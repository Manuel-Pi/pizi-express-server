const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const helmet = require('helmet');
const fs = require('fs');

// Get config file
const config = require('./config.json');
// Get utils functions
const utils = require('./server/utils');
// Override logger
const console = require('./server/logger').getLogger("", config.logger);

/*--------------------- DATABASE ---------------------------------*/

// Connect to db
mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.set('useUnifiedTopology', true);
mongoose.connect(process.env.MONGODB_URI || config.db);
const db = mongoose.connection;
db.on('error', e => {
    console.error('Database connection error!');
    console.debug(e);
    setServerState({db:  "error"});
});
db.once('open', () => {  
    console.info('Database successfully connected!');
    var admin = new mongoose.mongo.Admin(mongoose.connection.db);
    admin.buildInfo(function (err, info) {
        setServerState({dbVersion: info.version});
    });
    setServerState({db:  "connected"});
});

/*--------------------- MODULES ---------------------------------*/

// Get express instance
const app = express();
// Cache
app.use(require('express-mung').json(body => {
    console.log(body);
}));
// app.use(require('./server/modules/pizi-cache')(config.cache));
// Secure headers
//app.use(helmet({
//    contentSecurityPolicy: false,
 // }));
// Use body parser to parse json from request body
app.use(require('body-parser').json());
// Define a static server
const appsPath = path.join(__dirname, config.staticServerFolder);
app.use(express.static(appsPath));
const apisPath = path.join(__dirname, config.apiServerFolder);
app.use('/api', express.static(apisPath));
app.use(express.static(path.join(appsPath, 'server'))); // client server app

// CUSTOM MODULES
// Use auth for the REST API
app.use(config.rest.url, require('./server/modules/pizi-jwt')(utils.checkAuth, config.jwt));
// Define the REST API
app.use(config.rest.url, require('./server/modules/pizi-rest')(config.rest));
// Add server utils
app.use('/utils', require('./server/modules/pizi-server-utils.js')(config.utils));

/*--------------------- CREATE SERVER ---------------------------------*/

// Get server options
const port = process.env.PORT || config.port;
const protocol = config.https ? require('https') : require('http');
const serverOptions = !config.https ? {} : {
    key: fs.readFileSync("./server/certificates/cert.key"),
    cert: fs.readFileSync("./server/certificates/cert.pem")
};
// Create server
const server = protocol.createServer(serverOptions, app);
server.listen(port, () => console.info('Server started on port ' + port + ' (' + (config.https ? "https" : "http") + ')'));

/*--------------------- APPS---------------------------------*/

// Register apps
const socketServer = require('socket.io')(server);
const apps = utils.registerApps(appsPath, socketServer);

/*--------------------- NOTIFY---------------------------------*/

// Init server state
let serverState = {
    db: "connecting...",
    dbUrl: process.env.MONGODB_URI || config.db,
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