"use strict"
const e = require('express')
const express = require('express')
const { transcoder } = require('googleapis/build/src/apis/transcoder')
const utils = require('../utils/utils')

/* ERRORS */
const UserCreationError = new Error("Cannot create user!")
const UserCreationCheckCodeError = new Error("Wrong code!")
const EmailError = new Error("Cannot sent email!")
const NotAuthorizedError = new Error("You are not authorized to proceed this operation!")
const OperationError = new Error("An error has occurred, cannot achieve the desired action!")

const CHECK_CODE_SENT= {}

// Expiration 10min
const CODE_EXPIRATION_TIME = 600000

/**
 * pizi-users module
 * express middleware used to deal with users
 * @param config: the options to use
 * @param console: the console object
 * @param serverLibs: server libs 
 * @returns: the express middleware
 */
module.exports = ({config, console, serverLibs}) => {

    // Check expiration
    setInterval(() => {
        const currentTime = (new Date()).getTime()
        Object.keys(CHECK_CODE_SENT).filter(login => currentTime - CHECK_CODE_SENT[login].date > CODE_EXPIRATION_TIME).forEach(login => {
            delete CHECK_CODE_SENT[login]
        })
    }, 300000)

    const getCleanUser = (user, validationPropsAllowed = false) => {
        const allowedProps = ['email', 'login', 'password']
        if(validationPropsAllowed) allowedProps.push('checkPassword', 'keyCode')
        const cleanUser = {}
        Object.keys(user).filter(key => allowedProps.includes(key)).forEach(key => cleanUser[key] = user[key])
        return cleanUser
    }

    const UserModel = utils.getMongouseModel("users")

    /**
     * Check if an email code should be sent and send it
     * @param {*} login - user login
     * @param {*} user - user data to update
     * @param {*} callback - callback(err, user, codeSent)
     */
    const needCheckCode = (login, user, callback = () => null) => {
        if(!CHECK_CODE_SENT[login] && user.email){
            const checkCode = "" + Math.floor(100000 + Math.random() * 900000)
            if(serverLibs.email) {
                serverLibs.email.sendMail({
                    from: 'pizi-server@no-reply.com',
                    to: user.email,
                    subject: "Validation Code",
                    html: "<h2>code: <b>" + checkCode + "</b></h2>"
                }, (err, result) => {
                    if(err){
                        callback(EmailError)
                    } else {
                        CHECK_CODE_SENT[login] = {
                            checkCode,
                            user: getCleanUser(user),
                            date: new Date(),
                            attempt: 3
                        }
                        serverLibs.email.close()
                        callback(null, null, {message: 'code sent'})
                    }
                })
            } else {
                callback(EmailError)
            }
        } else if(CHECK_CODE_SENT[login] && user.checkCode){
            if(user.checkCode !== CHECK_CODE_SENT[login].checkCode){
                CHECK_CODE_SENT[login].attempt--
                if(CHECK_CODE_SENT[login].attempt <= 0) delete CHECK_CODE_SENT[login]
                callback(UserCreationCheckCodeError)
            } else { 
                callback(null, CHECK_CODE_SENT[login].user)
                delete CHECK_CODE_SENT[login]
            }
        } else if(CHECK_CODE_SENT[login]){
            callback(null, {message: 'code sent'})
        } else if(!user.email){
            callback(null, getCleanUser(user))
        } else {
            callback(UserCreationError)
        }
    }

    return express.Router().post("/createUser", (req, res) => {
        // TODO: check data!
        try{
            if(!req.body.login) throw UserCreationError  
            UserModel.find({$or:[{'login': req.body.login}, {'email': req.body.email || "empty"}]}, req.attributesBlackList || {}, null, (err, models) => {
                try{
                    if(err) throw OperationError
                    if(models.length) throw new Error("User already exist")
                    needCheckCode(req.body.login, req.body, (err, user, codeSent) => {
                        try{
                            if(err) throw err
                            if(codeSent) res.json(codeSent)
                            else{
                                const model = new UserModel()
                                for(let attribute in user) model.set(attribute, user[attribute], {strict: false})
                                model.save((err) => {
                                    if (err) utils.throwError(OperationError, res)
                                    else res.json({ message: 'Model created!'})
                                })
                            }
                        } catch(error){
                            utils.throwError(error, res)
                        }
                    })
                } catch(error){
                    utils.throwError(error, res)
                }
            })
        } catch(error){
            utils.throwError(error, res)
        }
    }).get("/getUser/:login", (req, res) => {
        try{
            if(!req.user || req.params.login !== req.user.user) throw NotAuthorizedError
            UserModel.findOne({login: req.params.login}, ["-password", "-_id"], (err, model) => {
                try{
                    if (err || !model) throw OperationError
                    res.json(model)
                } catch(error){
                    utils.throwError(error, res)
                }
            })
        } catch(error){
            utils.throwError(error, res)
        }
    }).put("/updateUser/:userLogin", (req, res) => {
        try{
            if(!req.user || req.user.user !== req.params.userLogin) throw NotAuthorizedError
            UserModel.findOne({login: req.params.userLogin}, (err, model) => {
                try {
                    if(err) throw OperationError
                    if(model.get("password") !== req.body.checkPassword && !req.body.checkCode) throw NotAuthorizedError
                    needCheckCode(req.params.userLogin, req.body, (err, user, codeSent) => {
                        try{
                            if(err) throw err
                            if(codeSent) res.json(codeSent)
                            else {
                                for(var attribute in user) model.set(attribute, user[attribute], {strict: false})
                                model.save( (err) => {
                                    if (err) utils.throwError(OperationError, res)
                                    else res.json({ message: 'Model updated!' })
                                })
                            }
                        } catch (error) {
                            utils.throwError(error, res)
                        }
                    })
                } catch (error) {
                    utils.throwError(error, res)
                }
            })
        } catch(error){
            utils.throwError(error, res)
        }
    }).delete("/deleteUser/:userLogin", (req, res) => {
        try{
            if(!req.user || req.user.user !== req.params.userLogin) throw NotAuthorizedError
            UserModel.findOne({login: req.params.userLogin}, (err, model) => {
                try{
                    if(err) throw OperationError
                    else if(model.get("password") !== req.body.checkPassword) throw NotAuthorizedError
                    else Model.deleteOne({login: req.params.userLogin}, (err, model) => {
                        if (err) utils.throwError(OperationError, res)
                        else res.json({ message: 'Successfully deleted' })
                    })
                } catch(error){
                    utils.throwError(error, res)
                }
            })
        } catch(error){
            utils.throwError(error, res)
        }
    })
}