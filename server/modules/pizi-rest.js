"use strict"
const express = require('express')
const utils = require('../utils/utils')

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
    
    // Get router
    const routerREST = express.Router().use((req, res, next) => {
        if(req.path === "/") res.json({ message: config.name })
        else {
            // Check user right based on config
            req.store = req.path.split('/')[1]
            req.attributesBlackList = {}
            let allowed = true
            const defaultRestrictions = config.restrictions["default"] || {}
            let restriction = config.restrictions[req.store]
            if(restriction && restriction.attributes) restriction.attributes = {...defaultRestrictions.attributes, ...restriction.attributes}
            restriction = {...defaultRestrictions, ...config.restrictions[req.store]}
            const roleNeeded = restriction.all || restriction[req.method.toLowerCase()]
            if(roleNeeded && !utils.getUserRoles(req.user?.role).has(roleNeeded)) allowed = false

            // Default Attributes
            for (let key in restriction.attributes) {
                if(!req.user || !utils.getUserRoles(req.user.role).has(restriction.attributes[key])){
                    req.attributesBlackList[key] = 0
                    delete req.body[key]
                }
            }
            
            allowed ? next() : utils.throwError(NotAuthorizedError, res, {logger: console})
        }
    })
    
    // URL matching '/store' patern
    routerREST.route(/^\/\w*$/).post((req, res) => {
        try{
            const MongooseModel = utils.getMongouseModel(req.store)           
            const model = new MongooseModel()
            for(let attribute in req.body){
                model.set(attribute, req.body[attribute], {strict: false})
            }
            model.save((err) => {
                if(err) utils.throwError(OperationError, res, {logger: console})
                else res.json({ message: 'Model created!'})
            })
        } catch(err){
            utils.throwError(StoreNotFoundError, res, {logger: console})
        } 
    }).get((req, res) => {
        try{
            let Model = utils.getMongouseModel(req.store)
            Model.find(req.query, req.attributesBlackList || {}, (err, models) => {
                if(err) utils.throwError(OperationError, res, {logger: console})
                else res.json(models)
            })
        } catch(err){
            utils.throwError(StoreNotFoundError, res, {logger: console})
        }
    }).delete((req, res) => {
        try{
            let Model = utils.getMongouseModel(req.store)
            Model.remove(req.body, (err, model) => {
                if(err) utils.throwError(OperationError, res, {logger: console})
                else res.json({ message: 'Successfully deleted' })
            })
        } catch(err){
            utils.throwError(StoreNotFoundError, res, {logger: console})
        }
    })
    
    // URL matching '/store/id' patern
    routerREST.route('/*/:model_id').get((req, res) => {
        try{
            let Model = utils.getMongouseModel(req.store);
            Model.findById(req.params.model_id, req.attributesBlackList, (err, model) => {
                if(err) utils.throwError(OperationError, res, {logger: console})
                else res.json(model)
            })
        } catch(err){
            utils.throwError(StoreNotFoundError, res, {logger: console})
        }
    }).put((req, res) => {
        try{
            var Model = utils.getMongouseModel(req.store);
            Model.findById(req.params.model_id, (err, model) => {
                if(err) utils.throwError(OperationError, res, {logger: console})
                else {
                    for(var attribute in req.body){
                        model.set(attribute, req.body[attribute], {strict: false})
                    }
                    model.save( (err) => {
                        if(err) utils.throwError(OperationError, res, {logger: console})
                        else res.json({ message: 'Model updated!' })
                    })
                }
            })
        } catch(err){
            utils.throwError(StoreNotFoundError, res, {logger: console})
        }
    }).delete( (req, res) => {
        try{
            let Model = utils.getMongouseModel(req.store)
            let hasAttributes = false
            for(let prop in req.body) {
                if(req.body.hasOwnProperty(prop)){
                    hasAttributes = true
                    break
                }  
            }
            if(!hasAttributes){
                Model.remove({_id: req.params.model_id}, (err, model) => {
                    if(err) utils.throwError(OperationError, res, {logger: console})
                    else res.json({ message: 'Successfully deleted' })
                })
            } else {
                Model.findById(req.params.model_id, (err, model) => {
                    if (err) utils.throwError(OperationError, res, {logger: console})
                    else {
                        for(let attribute in req.body){
                            model.set(attribute, undefined, {strict: false})
                        }
                        model.save( (err) => {
                            if(err) utils.throwError(OperationError, res, {logger: console})
                            else res.json({ message: 'Model updated!' })
                        })
                    }
                })
            }
        } catch(err){
            utils.throwError(StoreNotFoundError, res, {logger: console})
        }
    })
    return routerREST
}