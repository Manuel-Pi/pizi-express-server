"use strict"
const express = require('express')
//const { transcoder } = require('googleapis/build/src/apis/transcoder')
const utils = require('../utils/utils')

/* ERRORS */
const UserCreationError = new Error("Cannot create user!")
const UserExistError = new Error("User already exist!")
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
        Object.keys(CHECK_CODE_SENT).filter(login => (new Date()).getTime() - CHECK_CODE_SENT[login].date > CODE_EXPIRATION_TIME).forEach(login => delete CHECK_CODE_SENT[login])
    }, 300000)

    const UserModel = utils.getMongouseModel("users")

    const getCleanUser = (user, validationPropsAllowed = false) => {
        const allowedProps = ['email', 'login', 'password']
        if(validationPropsAllowed) allowedProps.push('checkPassword', 'keyCode', 'urlCode')
        const cleanUser = {}
        Object.keys(user).filter(key => allowedProps.includes(key)).forEach(key => cleanUser[key] = user[key] && user[key].toString ? user[key].toString() : user[key])
        return cleanUser
    }

    const updateUser = (login, user, callback) => {
        if(!login || !user.checkPassword) callback(OperationError)
        else UserModel.findOne({login}, (err, model) => {
            if(err || !model) callback(OperationError)
            else if(!utils.compareEncrypted(user.checkPassword, model.get('password'))) callback(new Error("Passwords not matching"))
            else {
                for(var attribute in getCleanUser(user)) {
                    const value = attribute === "password" ? utils.encrypt(user.password) : user[attribute]
                    model.set(attribute, value, {strict: false}) 
                }
                model.save( err => err ? callback(OperationError) : callback(null, { message: 'Model updated!' }))
            }
        })
    }

    const sendCode = (userLogin, userData, generateUrlCode, callback) => {
        const checkCode = "" + Math.floor(100000 + Math.random() * 900000)
        const urlCode = "" + Math.floor(100000 + Math.random() * 900000)

        const email = {
            from: 'Moins de neuf <pizi.dev@gmail.com>',
            to: userData.email,
            subject: generateUrlCode ? "Réinitiaisation du mot de passe" : "Création de compte",
            html: utils.getTemplate( generateUrlCode ? "resetPasswordEmailTemplate.html" : "checkCodeEmailTemplate.html", {...userData, checkCode, urlCode})
        }

        console.debug("try sending email code to: " + userData.email + "...")

        if(serverLibs.email) serverLibs.email.sendMail(email, (err, result) => {
            if(err)callback(EmailError)
            else {
                CHECK_CODE_SENT[userLogin] = {
                    checkCode,
                    urlCode: generateUrlCode ? urlCode : null,
                    user: getCleanUser(userData),
                    date: new Date(),
                    attempt: 3
                }
                serverLibs.email.close()
                callback(null, {message: 'ok'})
            }
        })
        else callback(EmailError)
    }

    const checkCode = (login, checkCode, urlCode, callback) => {
        if(urlCode && checkCode){
            login = Object.keys(CHECK_CODE_SENT).filter(key => CHECK_CODE_SENT[key].urlCode === urlCode)[0]
            if(login && CHECK_CODE_SENT[login].attempt < 0) delete CHECK_CODE_SENT[login]
            if(login){
                CHECK_CODE_SENT[login].attempt--
                if(CHECK_CODE_SENT[login].checkCode === checkCode){
                    callback(null, CHECK_CODE_SENT[login].user)
                    delete CHECK_CODE_SENT[login]
                    return
                }
            }
        } else if(CHECK_CODE_SENT[login] && checkCode){
            CHECK_CODE_SENT[login].attempt--
            if(CHECK_CODE_SENT[login].attempt <= 0) delete CHECK_CODE_SENT[login]
            if(CHECK_CODE_SENT[login] && checkCode === CHECK_CODE_SENT[login].checkCode){
                callback(null, CHECK_CODE_SENT[login].user)
                delete CHECK_CODE_SENT[login]
                return
            }
        }
        callback(UserCreationCheckCodeError)
    }

    return express.Router().post("/createUser", (req, res) => {
        const data = getCleanUser(req.body, true)
        if(data.login && data.checkCode){
            checkCode(data.login, data.checkCode, null, (err, user) => {
                if(err) utils.throwError(err, res)
                else {
                    const model = new UserModel()
                    for(const attribute in user) {
                        const value = attribute === "password" ? utils.encrypt(user.password) : user[attribute]
                        model.set(attribute, value, {strict: false}) 
                    }
                    model.set("role", "basic", {strict: false}) 
                    model.save((err) => err ? utils.throwError(UserCreationError, res) : res.json({ message: 'Model created!'}))
                }
            })
        } else if(data.email && data.login && data.password && !CHECK_CODE_SENT[data.login]){
            // Check user don't exist
            UserModel.findOne({$or: [{login: data.login}, {email: data.email}]}, ["-password", "-_id"], (err, model) => {
                if(model) utils.throwError(UserExistError, res)
                else sendCode(data.login, data, false, (err, message) => err ? utils.throwError(err, res) : res.json(message))
            })  
        } else {
            utils.throwError(UserCreationError, res)
        }
    }).get("/getUser/:login", (req, res) => {
        if(!req.user || req.params.login !== req.user.user) utils.throwError(NotAuthorizedError, res) 
        else UserModel.findOne({login: req.params.login}, ["-password", "-_id"], (err, model) => {
            try{
                if (err || !model) throw OperationError
                res.json(model)
            } catch(error){
                utils.throwError(error, res)
            }
        })
    }).put("/updateUser/:userLogin", (req, res) => {
        if(CHECK_CODE_SENT[req.params.userLogin]){
            checkCode(req.params.userLogin, req.body.checkCode, null, (err, user) => {
                if(err) utils.throwError(err, res)
                else updateUser(req.params.userLogin, {checkPassword: req.body.checkPassword, ...user}, (err, message) => err ? utils.throwError(err, res) : res.json(message))
            })
        } else if(req.body.email){
            sendCode(req.params.userLogin, req.body, false, (err, message) => err ? utils.throwError(err, res) : res.json(message))
        } else {
            updateUser(req.params.userLogin, req.body, (err, message) => err ? utils.throwError(err, res) : res.json(message))
        }
    }).delete("/deleteUser/:userLogin", (req, res) => {
        if(!req.user || req.user.user !== req.params.userLogin) utils.throwError(NotAuthorizedError, res) 
        else UserModel.findOne({login: req.params.userLogin}, (err, model) => {
            try{
                if(err) throw OperationError
                else if(!utils.compareEncrypted(req.body.checkPassword, model.get('password'))) throw NotAuthorizedError
                else UserModel.deleteOne({login: req.params.userLogin}, (err, model) => {
                    if(err) utils.throwError(OperationError, res)
                    else res.json({ message: 'Successfully deleted' })
                })
            } catch(error){
                utils.throwError(error, res)
            }
        })
    }).post("/reset-password", (req, res) => {
        if(req.body.urlCode && req.body.checkCode){
            checkCode(null, req.body.checkCode, req.body.urlCode, (err, user) => {
                if(err) utils.throwError(err, res)
                else UserModel.findOne({email: user.email}, (err, model) => {
                    try{
                        if(err || !model) throw OperationError
                        if(req.body.checkPassword !== req.body.password) throw new Error("Passwords not matching")
                        model.set("password", utils.encrypt(req.body.password), {strict: false}) 
                        model.save(err => err ? utils.throwError(OperationError, res) : res.json({ message: 'Model updated!' }))
                    } catch(error){
                        utils.throwError(error, res)
                    }
                })
            })
        } else if(req.body.email){
            UserModel.findOne({email: req.body.email}, (err, model) => {
                if(err) throw utils.throwError(OperationError, res)
                if(model) sendCode(model.login, {email: req.body.email}, true, (err, message) => err ? utils.throwError(err, res) : res.json(message))
                else res.json({ message: 'ok' })
            })
        } else utils.throwError(OperationError, res)
    })
}