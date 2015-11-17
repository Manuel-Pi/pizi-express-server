var express = require('express');
var mongoose   = require('mongoose');

mongoose.connect('mongodb://localhost/myapp');
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

routerREST.route(/^\/\w*$/).post(function(req, res){
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
module.exports = routerREST;