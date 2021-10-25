const path = require('path')
const express = require('express')
const mongoose = require('mongoose')
const helmet = require('helmet')
const fs = require('fs')

// Get config file
const config = require('./config.json')
// Get utils functions
const utils = require('./server/utils')
// Override logger
const console = require('./server/logger').getLogger("", config.logger)

/*--------------------- DATABASE ---------------------------------*/

// Connect to db
mongoose.connect(process.env.MONGODB_URI_ATLAS || process.env.MONGODB_URI || config.db).catch(error => {
    console.error('Database connection error!')
    console.debug(error)
    setServerState({db:  "error"})
})
const db = mongoose.connection;
db.on('error', e => {
    console.error('Database connection error!')
    console.debug(e)
    setServerState({db:  "error"})
})
db.once('open', () => {
    console.info('Database successfully connected!')
    const admin = new mongoose.mongo.Admin(mongoose.connection.db)
    admin.buildInfo((err, info) => {
        setServerState({dbVersion: info.version})
    })
    setServerState({db:  "connected"})
})

/*--------------------- MODULES ---------------------------------*/

// Get express instance
const app = express()
// Cache
// app.use(require('./server/modules/pizi-cache')(config.cache));
// Secure headers
app.use(helmet({
    contentSecurityPolicy: false,
}))
// Use body parser to parse json from request body
app.use(express.json())
// Define a static server
const appsPath = path.join(__dirname, config.staticServerFolder)
app.use(express.static(appsPath))
const apisPath = path.join(__dirname, config.apiServerFolder)
app.use('/api', express.static(apisPath))
app.use(express.static(path.join(appsPath, 'server'))) // client server app

// Register custom middleware
utils.activateModules({app, config, console})

/*--------------------- CREATE SERVER ---------------------------------*/

// Get server options
const port = process.env.PORT || config.port
const protocol = config.https ? require('https') : require('http')
const serverOptions = !config.https ? {} : {
    key: fs.readFileSync("./server/certificates/cert.key"),
    cert: fs.readFileSync("./server/certificates/cert.pem")
}
// Create server
const server = protocol.createServer(serverOptions, app);
server.listen(port, () => console.info('Server started on port ' + port + ' (' + (config.https ? "https" : "http") + ')'))

/*--------------------- APPS---------------------------------*/

// Register apps
const socketServer = require('socket.io')(server)
const exposed = {
    socketServer,
    console,
    host: config.https ? "https://localhost:" + port : "http://localhost:" + port
}
const apps = utils.registerApps(appsPath, exposed)
const apis = utils.registerApps(apisPath, exposed)

// Re-routing SPA apps
const spaApps = apps.filter(app => app.spa).map(app => app.name)
app.use("/:app/:other", function (req, resp, next) {
    if(spaApps.includes(req.params.app) && req.params.other){
        console.debug("SPA app redirection: " + req.params.app + "/" + req.params.other + " -> " + req.params.app)
        const indexFile = path.join(appsPath, req.params.app, "index.html")
        console.debug("Index file: "  + indexFile)
        resp.sendFile(indexFile)
    } else {
        next()
    }
})

/*--------------------- NOTIFY---------------------------------*/

// Hide credentials from URL
let dbUrl = process.env.MONGODB_URI_ATLAS || process.env.MONGODB_URI || config.db;
dbUrl = dbUrl.replace(/[^:]+:\/\/([^@]+).*/, (match, p1) => dbUrl.replace(p1, "user:password"));

// Init server state
let serverState = {
    db: "connecting...",
    dbUrl: dbUrl,
    tokenUrl: config.jwt.token.path,
    tokenExpire: config.jwt.token.expire,
    logger: config.logger,
    rest: config.rest,
    jwt: config.jwt.needToken,
    https: config.https,
    port
};
// Update state function (notify client)
const setServerState = (state = {}) => {
    serverState = {... serverState, ...state};
    socketServer.of('/pizi-server').emit("infos", serverState);
}
socketServer.of('/pizi-server').on('connection', socket => setServerState({apps}));