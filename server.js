const fs = require('fs');
const path = require('path');
const express = require('express');
const mongoose = require('mongoose');

// Get config file
const config = require('./config.json');

/*--------------------- DATABASE ---------------------------------*/

// Connect to db
mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.set('useUnifiedTopology', true);
mongoose.connect(process.env.MONGODB_URI || config.db);
const db = mongoose.connection;
db.on('error', e => console.log('Database connection error:' + e));
db.once('open', () => {
    console.log('Database successfully connected!');
});

/*--------------------- EXPRESS MODULES ---------------------------------*/

// Get express instance
const app = express();
// Use body parser to parse json from request body
app.use(require('body-parser').json());
// Define a static server
app.use(express.static(config.staticServerFolder));

// Define the authentification function
function checkAuth(login, password, callback){
    const UserModel = require('./database/models/user');
    try{
        UserModel.find({"login": login},
        function(err, models) {
            if (err) {
                callback(true);
                console.log(err);
            } else if(models.length > 0 && models[0].get('password') === password) {
                callback(null, {user: models[0].get('login'), role: models[0].get('role')});
            } else {
                callback(true);
            }
        });
    } catch(err){
        callback(true);
        console.log(err);
    }  
}

// Use auth for the REST API
app.use('/pizi-rest', require('./modules/pizi-jwt')(checkAuth, config.jwt));
// Define the REST API
app.use('/pizi-rest', require('./modules/pizi-rest')(config.rest));
// Add server utils
app.use('/utils', require('./modules/pizi-server-utils.js')(config.utils));


/*--------------------- CREATE SERVER ---------------------------------*/

// Get launch HTTP server
const port = process.env.PORT || config.port;
const server = require('http').createServer(app);
server.listen(port, function () {
    console.log('Server started on port ' + port + '...');
});

/*--------------------- APPS---------------------------------*/
const socketServer = require('socket.io')(server);

// Get Apps
const appsPath = path.join(__dirname, 'apps');
const apps = fs.readdirSync(appsPath, { withFileTypes: true }).filter(dirent => {
    if(!dirent.isDirectory()) return false;
    if(fs.existsSync(path.join(appsPath, dirent.name, "server", "server.json"))){
        return true;
    } else {
        console.log("No server.json file found for: " + dirent.name);
    }
}).map(dirent => {
    const json = require(path.join(appsPath, dirent.name, "server", "server.json"));
    return {...json, name: dirent.name, entry: path.join(appsPath, dirent.name, "server", json.entry)};
});

// Register Apps
apps.forEach(function (app) {
    console.log("App: " + app.name + " detected, trying to install..."); 
    try{
        if(app.type === "socket"){
            require(app.entry)(socketServer);
        }
        console.log("App: " + app.name + " successfully installed!"); 
    } catch(e){
        console.log("Error while installing: " + app.entry + "!", e); 
    }
});