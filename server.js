const path = require('path');
const express = require('express');
const mongoose = require('mongoose');

// Get config file
const config = require('./config.json');
// Get utils functions
const utils = require('./server/utils');
const console = require('./server/logger').getLogger("", config.logger);

let serverState = {
    db: "connecting...",
    tokenUrl: config.jwt.token.path,
    logger: config.logger,
    rest: config.rest,
    jwt: config.jwt.needToken
};

/*--------------------- EXPRESS MODULES ---------------------------------*/

// Get express instance
const app = express();
// Use body parser to parse json from request body
app.use(require('body-parser').json());
// Define a static server
const appsPath = path.join(__dirname, config.staticServerFolder);
app.use(express.static(appsPath));

/*--------------------- DATABASE ---------------------------------*/

// Connect to db
mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.set('useUnifiedTopology', true);
mongoose.connect(process.env.MONGODB_URI || config.db);
const db = mongoose.connection;
db.on('error', e => {
    console.error('Database connection error:' + e);
    serverState.db = "error";
});
db.once('open', () => {
    console.info('Database successfully connected!');
    serverState.db = "connected";
});

/*--------------------- CUSTOM MODULES ---------------------------------*/

// Use auth for the REST API
app.use(config.rest.url, require('./server/modules/pizi-jwt')(utils.checkAuth, config.jwt));
// Define the REST API
app.use(config.rest.url, require('./server/modules/pizi-rest')(config.rest));
// Add server utils
app.use('/utils', require('./server/modules/pizi-server-utils.js')(config.utils));

app.get('/', (req, res) => {
    res.redirect('/appname');
});


let participantMap = new Map();
participantMap.set(1, {id:1, name: "José", participants: new Map()});
participantMap.set(2, {id:2, title: "Robert", participants: new Map()});
participantMap.set(3, {id:3, title: "Franck", participants: new Map()});

let activityMap = new Map();
activityMap.set(1, {id:1, title: "Soccer", participants: participantMap});
activityMap.set(2, {id:2, title: "Basket", participants: new Map()});
activityMap.set(3, {id:3, title: "Frisbee", participants: new Map()});


activityMap.get(1).participants.set(1, "José");

app.get('/mandana', (req, res) => {

    let activityArray = Array.from(activityMap.values())

    let activityWithParticipantArray = activityArray.map(activity => {
        return {
            ...activity,
            participants: Array.from(participantMap.values())
        }
    });

    res.send({
        message: "Caribou", 
        activityArray: activityWithParticipantArray,
        activityNumber: activityMap.size
    });
});

/*--------------------- CREATE SERVER ---------------------------------*/

// Get launch HTTP server
const port = process.env.PORT || config.port;
const server = require('http').createServer(app);
server.listen(port, () => console.info('Server started on port ' + port + '...'));

/*--------------------- APPS---------------------------------*/

const socketServer = require('socket.io')(server);
const apps = utils.registerApps(appsPath, socketServer);

const io = socketServer.of('/pizi-server');
io.on('connection', _socket => {
    socket = _socket;
    serverState = {...serverState, port, apps};
    socket.emit("infos", serverState);
});