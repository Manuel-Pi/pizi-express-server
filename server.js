var http = require('http');
var express = require('express');
var mongoose   = require('mongoose');

var app = express();
var port = 8080;

// Get config file
var config = require('./config.json');

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
                callback();
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
app.use('/pizi-rest', require('./pizi-jwt.js')(checkAuth, config.jwt));

// Define the REST API
app.use('/pizi-rest', require('./pizi-rest.js')(config.rest));

// Define a static server
app.use(express.static('Apps'));

// Get launch HTTP server
var server = http.createServer(app);
server.listen(port, function () {
    console.log('Server started on port ' + port + ' !');
});

// Add WebSocket Chat
require('./pizi-chat.js')(server);