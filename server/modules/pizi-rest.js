"use strict"
const express = require('express')
const utils = require('../utils/utils')

const DEFAULT_ROLE = "anonymous"

/**
 * pizi-rest module
 * express middleware used to deliver a simple REST server
 * @param config: the options to use
 * @param console: the console object
 * @returns: the express middleware
 */
module.exports = ({config = {restrictions: {}}, console}) => { 
    /* ERRORS */
    const OperationError = new Error("An error has occurred, cannot achieve the desired action!")
    const StoreNotFoundError = new Error("The desired store do not exist!")
    const NotAuthorizedError = new Error("You are not authorized to proceed this operation!")
    
    // Check user right based on config
    function checkRight(req , res, type, store){
        req = req || {user: null}
        req.attributesBlackList = {}
        let allowed = true
        const defaultRestrictions = config.restrictions["default"] || {}
        let restriction = config.restrictions[store]
        if(restriction && restriction.attributes) restriction.attributes = {...defaultRestrictions.attributes, ...restriction.attributes}
        restriction = {...defaultRestrictions, ...config.restrictions[store]}
        if(restriction[type] || restriction.all){
            let roleNeeded = restriction[type] || restriction.all
            if(roleNeeded !== DEFAULT_ROLE && (!req.user || req.user.role !== roleNeeded)){
                allowed = false
            }
        }

        // Default Attributes
        for (let key of Object.keys(restriction.attributes)) {
            if(!req.user || restriction.attributes[key] !== req.user.role){
                if(store === "users" && type === "put") continue // Exception for password update
                req.attributesBlackList[key] = 0
                delete req.body[key];
            }
        }
        
        if(!allowed) res.status(500).json({message: NotAuthorizedError.message})
        return allowed;
    }
    
    // Get router
    let routerREST = express.Router()
    
    // Enter point
    routerREST.get('/', (req, res) => {
        res.json({ message: config.name })
    })
    
    // URL matching '/store' patern
    routerREST.route(/^\/\w*$/).post((req, res) => {
        let store = req.path.split('/')[1];
        if(checkRight(req, res, "post", store)){
            try{
                let MongooseModel = utils.getMongouseModel(store);             
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
                let Model = utils.getMongouseModel(store); 
                Model.find(req.query, req.attributesBlackList || {}, (err, models) => {
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
                let Model = utils.getMongouseModel(store);
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
    })
    
    // URL matching '/store/id' patern
    routerREST.route('/*/:model_id').get((req, res) => {
        let store = req.path.split('/')[1];
        if(checkRight(req, res, "get", store)){
            try{
                let Model = utils.getMongouseModel(store);
                Model.findById(req.params.model_id, req.attributesBlackList, (err, model) => {
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
                var Model = utils.getMongouseModel(store);
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
                let Model = utils.getMongouseModel(store);
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
                    })
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
    })
    return routerREST
}