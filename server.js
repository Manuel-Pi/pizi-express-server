var http = require('http');
var express = require('express');
var bodyParser = require('body-parser');

var app = express();
var port = 8080;

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