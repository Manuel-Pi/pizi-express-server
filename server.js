const path = require('path')
const express = require('express')
const mongoose = require('mongoose')
const helmet = require('helmet')
const fs = require('fs')

// Get config file
const config = require('./config.json')
// Get utils functions
const utils = require('./server/utils/utils')
// Get server libs
const serverLibs = require('./server/libs/custom-server-libs')
// Override console
const console = serverLibs.logger.getLogger()

/*--------------------- DATABASE ---------------------------------*/

// Connect to db
const dbUrl = process.env.MONGODB_URI_ATLAS_MDN || process.env.MONGODB_URI_ATLAS || process.env.MONGODB_URI || config.db
mongoose.connect(dbUrl).catch(error => {
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
app.use(helmet({contentSecurityPolicy: false}))
// Use body parser to parse json from request body
app.use(express.json())
// Define a static server
const appsPath = path.join(__dirname, config.appsPath)
app.use(express.static(appsPath))
const apisPath = path.join(__dirname, config.apisPath)
app.use('/api', express.static(apisPath))
// server app
app.get('/', (req, res) => res.redirect('/server'))
// Register custom middleware
utils.activateModules(app)

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
const host = (config.https ? "https": "http") + "//localhost:" + port 
const apps = utils.registerApps(appsPath, socketServer, host)
const apis = utils.registerApps(apisPath, socketServer, host)

// Re-routing SPA apps
const spaApps = apps.filter(app => app.spa).map(app => app.name)
app.use("/:app/:other*", (req, resp, next) => {
    if(spaApps.includes(req.params.app) && req.params.other){
        console.debug("SPA app redirection: " + req.params.app + "/" + req.params.other + " -> " + req.params.app)
        const url = path.parse(req.originalUrl)
        const indexFile = url.ext ? path.join(appsPath, req.params.app, url.base) : path.join(appsPath, req.params.app, "index.html")
        console.debug("Index file: "  + indexFile)
        resp.sendFile(indexFile)
    } else next()
})

/*--------------------- NOTIFY---------------------------------*/

// Init server state
let serverState = {
    server:{
        port,
        https: config.https,
        appsPath: config.appsPath,
        apisPath: config.apisPath
    },
    database:{
        url: dbUrl.replace(/[^:]+:\/\/([^@]+).*/, (match, p1) => dbUrl.replace(p1, "user:password"))
    },
    db: "connecting...",
    dbUrl: dbUrl.replace(/[^:]+:\/\/([^@]+).*/, (match, p1) => dbUrl.replace(p1, "user:password")),
    tokenUrl: config.jwt.token.path,
    tokenExpire: config.jwt.token.expire,
    log: config.log,
    rest: config.rest,
    jwt: !!Object.keys(config.jwt.restrictions).length,
    https: config.https,
    webdav: config.webdav,
    users: config.users,
    port
}
// Update state function (notify client)
const setServerState = (state = {}) => {
    serverState = {... serverState, ...state}
    socketServer.of('/pizi-server').emit("infos", serverState)
}
socketServer.of('/pizi-server').on('connection', socket => setServerState({apps}))