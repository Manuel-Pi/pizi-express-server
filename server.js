var http = require('http');
var express = require('express');
var mongoose   = require('mongoose');

var app = express();
var port = 8080;

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
                callback(new Error("Error!"));
            } else if(models.length > 0 && models[0].get('password') === password) {
                callback();
            } else {
                callback(new Error("Error!"));
            }
        });
    } catch(e){
        callback(new Error("Error!"));
    }  
}

// Use auth for the REST API
app.use('/pizi-rest', require('./pizi-jwt.js')(checkAuth));

// Define the REST API
app.use('/pizi-rest', require('./pizi-rest.js'));

// Define a static server
app.use(express.static('Apps'));

// Get launch HTTP server
var server = http.createServer(app);
server.listen(port, function () {
    console.log('Server started on port ' + port + ' !');
});

// Add WebSocket Chat
require('./pizi-chat.js')(server);