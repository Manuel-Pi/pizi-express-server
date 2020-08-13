const path = require('path');
const express = require('express');
const mongoose = require('mongoose');

// Get config file
const config = require('./config.json');
// Get utils functions
const utils = require('./server/utils');

/*--------------------- DATABASE ---------------------------------*/

// Connect to db
mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.set('useUnifiedTopology', true);
mongoose.connect(process.env.MONGODB_URI || config.db);
const db = mongoose.connection;
db.on('error', e => console.log('Database connection error:' + e));
db.once('open', () => console.log('Database successfully connected!'));

/*--------------------- EXPRESS MODULES ---------------------------------*/

// Get express instance
const app = express();
// Use body parser to parse json from request body
app.use(require('body-parser').json());
// Define a static server
const appsPath = path.join(__dirname, config.staticServerFolder);
app.use(express.static(appsPath));

/*--------------------- CUSTOM MODULES ---------------------------------*/

// Use auth for the REST API
app.use('/pizi-rest', require('./server/modules/pizi-jwt')(utils.checkAuth, config.jwt));
// Define the REST API
app.use('/pizi-rest', require('./server/modules/pizi-rest')(config.rest));
// Add server utils
app.use('/utils', require('./server/modules/pizi-server-utils.js')(config.utils));

/*--------------------- CREATE SERVER ---------------------------------*/

// Get launch HTTP server
const port = process.env.PORT || config.port;
const server = require('http').createServer(app);
server.listen(port, () => console.log('Server started on port ' + port + '...'));

/*--------------------- APPS---------------------------------*/

const socketServer = require('socket.io')(server);
utils.registerApps(appsPath, socketServer);