var express = require('express');
var mongoose   = require('mongoose');

// Get config file
var config = require('./config.json');

// --------------------- AUTHENTIFICATION ---------------------------------
// Array of Mongoose models
mongoose.models = mongoose.models || {};
// Set user model for auth
mongoose.models["user"] = mongoose.model("user", new mongoose.Schema());
// Define the authentification function
function checkAuth(login, password, callback){
    try{
        mongoose.models["user"].find({"login": login},
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

// Get express instance
var app = express();
// Use body parser to parse json from request body
app.use(require('body-parser').json());

// Use auth for the REST API
app.use('/pizi-rest', require('./pizi-jwt.js')(checkAuth, config.jwt));

// Define the REST API
app.use('/pizi-rest', require('./pizi-rest.js')(config.rest));

// Add server utils
app.use('/utils', require('./pizi-server-utils.js')(config.utils));

// Define a static server
app.use(express.static(config.staticServerFolder));

// Get launch HTTP server
var server = require('http').createServer(app);
server.listen(config.port, function () {
    console.log('Server started on port ' + config.port + '...');
});

// Add WebSocket Chat
require('./pizi-chat.js')(server);