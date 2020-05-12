var fs = require('fs');
var express = require('express');
var mongoose = require('mongoose');

// Get config file
var config = require('./config.json');

/*--------------------- DATABASE ---------------------------------*/

// Connect to db
mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.set('useUnifiedTopology', true);
mongoose.connect(process.env.MONGODB_URI || config.db);
var db = mongoose.connection;
db.on('error', e => console.log('Database connection error:' + e));
db.once('open', () => {
    console.log('Database successfully connected!');
});

/*--------------------- EXPRESS MODULES ---------------------------------*/

// Get express instance
var app = express();
// Use body parser to parse json from request body
app.use(require('body-parser').json());
// Define a static server
app.use(express.static(config.staticServerFolder));

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

// Use auth for the REST API
//app.use('/pizi-rest', require('./pizi-jwt.js')(checkAuth, config.jwt));

// Define the REST API
//app.use('/pizi-rest', require('./pizi-rest.js')(config.rest));

// Add server utils
//app.use('/utils', require('./pizi-server-utils.js')(config.utils));


/*--------------------- CREATE SERVER ---------------------------------*/

// Get launch HTTP server
const port = process.env.PORT || config.port;
var server = require('http').createServer(app);
server.listen(port, function () {
    console.log('Server started on port ' + port + '...');
});

/*--------------------- APPS---------------------------------*/

// Add WebSocket Chat
//require('./pizi-chat.js')(server);

require('./pizi-moins-de-neuf.js')(server);