var http = require('http');
var express = require('express');
var bodyParser = require('body-parser');
var mongoose   = require('mongoose');

mongoose.connect('mongodb://localhost/myapp');

var app = express();
var port = 8080;  


// configure app to use bodyParser()
// this will let us get the data from a POST
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

var routerREST = express.Router();

// test route to make sure everything is working (accessed at GET http://localhost:8080/api)
routerREST.get('/', function(req, res) {
    res.json({ message: 'RESTFull Server (Manuel Pi)' });  
});

var models = {};

function getMoogouseModel(path){
    var Model;
    if(!models[path]){
        Model = mongoose.model(path, new mongoose.Schema());
        models[path] = Model;
    } else {
        Model = models[path];
    }
    return Model;
}

routerREST.route('/*/$').post(function(req, res){
  var path = req.path.split('/')[1];
  try{
        var MongooseModel = getMoogouseModel(path);             
        var model = new MongooseModel();
        for(var attribute in req.body){
            model.set(attribute, req.body[attribute], {strict: false});
        }
        model.save(function(err) {
                    if (err)
                        res.send(err);
        
                    res.json({ message: 'Model created!'});
                });
    } catch(e){
        res.send( path + " not found" + e.message);
    }
}).get(function(req, res) {
    var path = req.path.split('/')[1];
    try{
        var Model = getMoogouseModel(path); 
        Model.find(function(err, models) {
            if (err)
                res.send(err);
    
            res.json(models);
        });
    } catch(e){
        res.send( path + " not found" + e.message);
    }
}).delete(function(req, res) {
    var path = req.path.split('/')[1];
    try{
        var Model = getMoogouseModel(path);
        
        Model.remove(req.body, function(err, model) {
            if (err)
                res.send(err);

            res.json({ message: 'Successfully deleted' });
        });
    } catch(e){
        res.send( path + " not found");
    }  
});

routerREST.route('/*/:model_id').get(function(req, res) {
    var path = req.path.split('/')[1];
    try{
        var Model = getMoogouseModel(path);
        Model.findById(req.params.model_id, function(err, model) {
            if (err)
                res.send(err);
               
            res.json(model);
        });
    } catch(e){
        res.send( path + " not found");
    }  
}).put(function(req, res) {
    var path = req.path.split('/')[1];
    try{
        var Model = getMoogouseModel(path);
        Model.findById(req.params.model_id, function(err, model) {
    
            if (err)
                res.send(err);

            for(var attribute in req.body){
                model.set(attribute, req.body[attribute], {strict: false});
            }
            model.save(function(err) {
                if (err)
                    res.send(err);
    
                res.json({ message: 'Model updated!' });
            });
        });
    } catch(e){
        res.send( path + " not found");
    }  
}).delete(function(req, res) {
    var path = req.path.split('/')[1];
    try{
        var Model = getMoogouseModel(path);
        var hasAttributes = false;
        for(var prop in req.body) {
            if(req.body.hasOwnProperty(prop)){
                hasAttributes = true;
                break;
            }  
        }
        if(!hasAttributes){
            Model.remove({
                _id: req.params.model_id
            }, function(err, model) {
                if (err)
                    res.send(err);
    
                res.json({ message: 'Successfully deleted' });
            });
        } else {
            Model.findById(req.params.model_id, function(err, model) {
                if (err)
                    res.send(err);
    
                for(var attribute in req.body){
                    model.set(attribute, undefined, {strict: false});
                }
                model.save(function(err) {
                    if (err)
                        res.send(err);
        
                    res.json({ message: 'Model updated!' });
                });
            });
        }
        
    } catch(e){
        res.send( path + " not found");
    }  
});

// REGISTER OUR ROUTES -------------------------------
// all of our routes will be prefixed with /api
app.use('/api', routerREST);




// START THE SERVER
// =============================================================================
app.use(express.static('Apps'));

// Get htpp server
var server = http.createServer(app);

// Chargement de socket.io
var io = require('socket.io').listen(server);

var users = [];

// Quand on client se connecte, on le note dans la console
io.sockets.on('connection', function (socket) {
    
    socket.on('login', function (pseudo) {
        socket.emit('message', {text: 'Connected!', user: "server"});
        console.log('Connection: ' + pseudo);
        socket.user = pseudo;
        users.push(pseudo);
        socket.emit('users', users);
        socket.broadcast.emit('users', users);
    });
    
     // Quand le serveur reçoit un signal de type "message" du client
    socket.on('message', function (message) {
        socket.broadcast.emit('message', message);
    });
    
    socket.on('disconnect', function () {
        var i = users.indexOf(socket.user);
        if(i > -1){
            console.log('Deconnexion: ' + users[i]);
            delete users[i];
        }
        socket.emit('users', users);
    });
});

server.listen(port, function () {
    console.log('Server started on port ' + port + ' !');
});