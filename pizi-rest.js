var express = require('express');
var mongoose   = require('mongoose');
var jwt = require('jsonwebtoken');

module.exports = function(config){
    // Connect to db
    mongoose.connect(config.db);
    
    // Array of Mongoose models
    mongoose.models = mongoose.models || {};
    
    // Create dynamic Mongoose model
    function getMoogouseModel(path){
        var Model;
        if(!mongoose.models[path]){
            Model = mongoose.model(path, new mongoose.Schema());
            mongoose.models[path] = Model;
        } else {
            Model = mongoose.models[path];
        }
        return Model;
    }
    
    // Define errors:
    var OperationError = new Error("An error has occurred, cannot achieve the desired action!");
    var StoreNotFoundError = new Error("The desired store do not exist!");
    
    // Get router
    var routerREST = express.Router();
    
    // Enter point
    routerREST.get('/', function(req, res) {
        res.json({ message: config.name });
    });
    
    // URL matching '/store' patern
    routerREST.route(/^\/\w*$/).post(function(req, res){
        var path = req.path.split('/')[1];
        try{
            var MongooseModel = getMoogouseModel(path);             
            var model = new MongooseModel();
            for(var attribute in req.body){
                model.set(attribute, req.body[attribute], {strict: false});
            }
            console.log(req.body);
            model.save(function(err) {
                        if (err) {
                            res.status(500).json({message: OperationError.message});
                            console.log(err);
                        } else {
                            res.json({ message: 'Model created!'});
                        }
                    });
        } catch(err){
            res.status(500).json({message: StoreNotFoundError.message});
            console.log(err);
        }
    }).get(function(req, res) {
        var path = req.path.split('/')[1];
        try{
            var Model = getMoogouseModel(path); 
            Model.find(function(err, models) {
                if (err) {
                    res.status(500).json({message: OperationError.message});
                    console.log(err);
                } else {
                    res.json(models);
                }
            });
        } catch(err){
            res.status(500).json({message: StoreNotFoundError.message});
            console.log(err);
        }
    }).delete(function(req, res) {
        var path = req.path.split('/')[1];
        try{
            var Model = getMoogouseModel(path);
            
            Model.remove(req.body, function(err, model) {
                if (err) {
                    res.status(500).json({message: OperationError.message});
                    console.log(err);
                } else {
                    res.json({ message: 'Successfully deleted' });
                }
            });
        } catch(err){
            res.status(500).json({message: StoreNotFoundError.message});
            console.log(err);
        }
    });
    
    // URL matching '/store/id' patern
    routerREST.route('/*/:model_id').get(function(req, res) {
        var path = req.path.split('/')[1];
        try{
            var Model = getMoogouseModel(path);
            Model.findById(req.params.model_id, function(err, model) {
                if (err) {
                    res.status(500).json({message: OperationError.message});
                    console.log(err);
                } else {
                    res.json(model);
                }
            });
        } catch(err){
            res.status(500).json({message: StoreNotFoundError.message});
            console.log(err);
        }
    }).put(function(req, res) {
        var path = req.path.split('/')[1];
        try{
            var Model = getMoogouseModel(path);
            Model.findById(req.params.model_id, function(err, model) {
                if (err) {
                    res.status(500).json({message: OperationError.message});
                    console.log(err);
                } else {
                    for(var attribute in req.body){
                        model.set(attribute, req.body[attribute], {strict: false});
                    }
                    model.save(function(err) {
                        if (err) {
                            res.status(500).json({message: OperationError.message});
                            console.log(err);
                        } else {
                            res.json({ message: 'Model updated!' });
                        }
                    });
                }
            });
        } catch(err){
            res.status(500).json({message: StoreNotFoundError.message});
            console.log(err);
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
                Model.remove({_id: req.params.model_id}, function(err, model) {
                    if (err) {
                        res.status(500).json({message: OperationError.message});
                        console.log(err);
                    } else {
                        res.json({ message: 'Successfully deleted' });
                    }
                });
            } else {
                Model.findById(req.params.model_id, function(err, model) {
                    if (err) {
                        res.status(500).json({message: OperationError.message});
                        console.log(err);
                    } else {
                    for(var attribute in req.body){
                            model.set(attribute, undefined, {strict: false});
                        }
                        model.save(function(err) {
                            if (err) {
                                res.status(500).json({message: OperationError.message});
                                console.log(err);
                            } else {
                                res.json({ message: 'Model updated!' });
                            }
                        }); 
                    }
                });
            }
        } catch(err){
            res.status(500).json({message: StoreNotFoundError.message});
            console.log(err);
        }
    });
    return routerREST;
}