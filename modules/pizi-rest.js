"use strict";
let express = require('express');
let mongoose   = require('mongoose');

module.exports = (config) => {
    
    config = config || {restrictions: {}};
    
    // Array of Mongoose models
    mongoose.models = mongoose.models || {};
    
    // Create dynamic Mongoose model
    function getMoogouseModel(name){
        let Model;
        try{
            Model = require('./database/models/' + name);
        } catch(e){
            console.log("No model matching: " + name);
        }
        
        if(!Model){
            Model = mongoose.model(name, new mongoose.Schema());
            mongoose.models[name] = Model;
        }
        return Model;
    }
    
        // Define errors:
    let OperationError = new Error("An error has occurred, cannot achieve the desired action!");
    let StoreNotFoundError = new Error("The desired store do not exist!");
    let NotAuthorizedError = new Error("You are not authorized to proceed this operation!");
    
    // Check user right
    function checkRight(req , res, type, store){
        req = req || {user: null};
        let allowed = true;
        let restriction = config.restrictions[store] || config.restrictions["all"] || {};
        if(restriction[type] || restriction.all){
            let roleNeeded = restriction[type] || restriction.all;
            if(!req.user || req.user.role !== roleNeeded){
                allowed = false;
            }
        }
        if(restriction.attributes){
            for (let key of Object.keys(restriction.attributes)) {
                if(!req.user || restriction.attributes[key] !== req.user.role){
                    delete req.body[key];
                }
            }
        }
        if(!allowed) res.status(500).json({message: NotAuthorizedError.message});;
        return allowed;
    }
    
    // Get router
    let routerREST = express.Router();
    
    // Enter point
    routerREST.get('/', (req, res) => {
        res.json({ message: config.name });
    });
    
    // URL matching '/store' patern
    routerREST.route(/^\/\w*$/).post((req, res) => {
        let store = req.path.split('/')[1];
        if(checkRight(req, res, "post", store)){
            try{
                let MongooseModel = getMoogouseModel(store);             
                let model = new MongooseModel();
                for(let attribute in req.body){
                    model.set(attribute, req.body[attribute], {strict: false});
                }
                console.log(req.body);
                model.save((err) => {
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
        }
    }).get((req, res) => {
        let store = req.path.split('/')[1];
        if(checkRight(req, res, "get", store)){
            try{
                let Model = getMoogouseModel(store); 
                Model.find( req.query, (err, models) => {
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
        }
    }).delete((req, res) => {
        let store = req.path.split('/')[1];
        if(checkRight(req, res, "delete", store)){
            try{
                let Model = getMoogouseModel(store);
                Model.remove(req.body, (err, model) => {
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
        }
    });
    
    // URL matching '/store/id' patern
    routerREST.route('/*/:model_id').get((req, res) => {
        let store = req.path.split('/')[1];
        if(checkRight(req, res, "get", store)){
            try{
                let Model = getMoogouseModel(store);
                Model.findById(req.params.model_id, (err, model) => {
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
        }
    }).put((req, res) => {
        let store = req.path.split('/')[1];
        if(checkRight(req, res, "put", store)){
            try{
                var Model = getMoogouseModel(store);
                Model.findById(req.params.model_id, (err, model) => {
                    if (err) {
                        res.status(500).json({message: OperationError.message});
                        console.log(err);
                    } else {
                        for(var attribute in req.body){
                            model.set(attribute, req.body[attribute], {strict: false});
                        }
                        model.save( (err) => {
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
        }
    }).delete( (req, res) => {
        let store = req.path.split('/')[1];
        if(checkRight(req, res, "put", store)){
            try{
                let Model = getMoogouseModel(store);
                let hasAttributes = false;
                for(let prop in req.body) {
                    if(req.body.hasOwnProperty(prop)){
                        hasAttributes = true;
                        break;
                    }  
                }
                if(!hasAttributes){
                    Model.remove({_id: req.params.model_id}, (err, model) => {
                        if (err) {
                            res.status(500).json({message: OperationError.message});
                            console.log(err);
                        } else {
                            res.json({ message: 'Successfully deleted' });
                        }
                    });
                } else {
                    Model.findById(req.params.model_id, (err, model) => {
                        if (err) {
                            res.status(500).json({message: OperationError.message});
                            console.log(err);
                        } else {
                        for(let attribute in req.body){
                                model.set(attribute, undefined, {strict: false});
                            }
                            model.save( (err) => {
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
        }
    });
    return routerREST;
}