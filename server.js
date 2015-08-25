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

var router = express.Router();

var User = require('./models/user'); 

// test route to make sure everything is working (accessed at GET http://localhost:8080/api)
router.get('/', function(req, res) {
    res.json({ message: 'RESTFull Server (Manuel Pi)' });  
});

router.route('/*/$').post(function(req, res){
  var path = req.path.split('/')[1];
  try{
        var Model = require('./models/' + path);
        var model = new Model();
        model.login = req.body.login;
        model.save(function(err) {
                    if (err)
                        res.send(err);
        
                    res.json({ message: 'Model created!'});
                });
    } catch(e){
        res.send( path + " not found");
    }
}).get(function(req, res) {
    var path = req.path.split('/')[1];
    try{
        var Model = require('./models/' + path); 
        Model.find(function(err, models) {
            if (err)
                res.send(err);
    
            res.json(models);
        });
    } catch(e){
        res.send( path + " not found");
    }
});

router.route('/*/:model_id').get(function(req, res) {
    var path = req.path.split('/')[1];
    try{
        var Model = require('./models/' + path);
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
        var Model = require('./models/' + path);
        Model.findById(req.params.model_id, function(err, model) {
    
            if (err)
                res.send(err);
    
            model.login = req.body.login;  // update the bears info
    
            // save the bear
            model.save(function(err) {
                if (err)
                    res.send(err);
    
                res.json({ message: 'User updated!' });
            });
        });
    } catch(e){
        res.send( path + " not found");
    }  
}).delete(function(req, res) {
    var path = req.path.split('/')[1];
    try{
        var Model = require('./models/' + path);
        Model.remove({
            _id: req.params.model_id
        }, function(err, model) {
            if (err)
                res.send(err);

            res.json({ message: 'Successfully deleted' });
        });
    } catch(e){
        res.send( path + " not found");
    }  
});

// REGISTER OUR ROUTES -------------------------------
// all of our routes will be prefixed with /api
app.use('/api', router);

// START THE SERVER
// =============================================================================
app.use(express.static('Apps'));

var server = app.listen(port, function () {
  var host = server.address().address;
  var port = server.address().port;

 console.log('Server started!', host, port);
});