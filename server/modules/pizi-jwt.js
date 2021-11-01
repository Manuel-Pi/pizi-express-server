"use strict"
const jwt = require('jsonwebtoken')
const express = require('express')
const UserModel = require('../database/models/user')
const utils = require('../utils/utils')
const CONNECTED_USERS = {}

/* ERRORS */
const NotAuthorizedError = new Error("You are not authorized to proceed this operation!")
const NoCredential = new Error("Provide credential!")
const BadCredential = new Error("Bad credential!")
const BadToken = new Error("Token not valid!")

/**
 * pizi-jwt module
 * express middleware used to deal with Json Web Token
 * @param config: the options to use
 * @param console: the console object
 * @param check: the function used to check if user login is valid
 * @returns: the express middleware
 */
module.exports = ({config, console, check = checkAuthDefault}) => {

	const router = express.Router()

	const isAllowed = (req) => {
        // Get restritions
        const restrictions = config.restrictions
        const restrictionPaths = new Set(Object.keys(restrictions).sort())
		const userRoles = utils.getUserRoles(req.user?.role)

        let isAllowed = true
        for(const path of restrictionPaths){
            if(req.path.startsWith(path)){
                isAllowed = restrictions[path].some(allowedRole => userRoles.has(allowedRole))
            }
        }
		console.debug(req.user ? req.user.user : utils.DEFAULT_ROLE, isAllowed ? "is allowed on" : "is not allowed on", req.path)
        return isAllowed
    }

	router.get(config.token.checkPath, (req, res, next) => { // Check token
		const auth = req.headers.authorization
		if(auth && auth.match(/^Bearer ((\w|-|_)+.(\w|-|_)+.(\w|-|_)+)$/)){
			let token = auth.match(/^Bearer ((\w|-|_)+.(\w|-|_)+.(\w|-|_)+)$/)[1];
			jwt.verify(token, config.token.key, (err, decoded) => {
				decoded = decoded || {}
				// TODO: || !CONNECTED_USERS[decoded.user] || CONNECTED_USERS[decoded.user].ip !== req.connection.remoteAddress
				if(err){
					res.status(500).json({message: err ? err.message : BadToken.message})
				} else if(decoded && decoded.user){
					// Check user exist
					check(decoded.user, "", (valid) => {
						if(valid === "wrong password"){
							res.json({
								jwt: token,
								user: decoded.user,
								role: decoded.role
							})
						} else {
							res.status(500).json({message: BadToken.message})
						}
					})
				}
			})
		} else {
			res.status(500).json({message: BadToken.message})
		}
	}).get(config.token.path,(req, res, next) => { // Get token
		if(req.headers.login && req.headers.password){
			check(req.headers.login, req.headers.password, (err, user) => {
				if(err){
					if(err === "wrong password"){
						res.json({exist: true})
					} else {
						res.status(500).json({message: BadCredential.message})
					}
				} else {
					let token = jwt.sign(Object.assign(config.token.payload, user), config.token.key, {expiresIn: config.token.expire});
					res.json({
						jwt: token,
						user: user.user,
						role: user.role
					});
					CONNECTED_USERS[user.user] = {
						token: token,
						ip: req.connection.remoteAddress
					};
					console.info("token given to: " + user.user + " for IP:" + req.connection.remoteAddress);
				}
			});
		} else {
			res.status(500).json({message: NoCredential.message})
		}
	})

	router.use((req, res, next) => {
		delete req.user
		const auth = req.headers.authorization
		if(auth && auth.match(/^Bearer ((\w|-|_)+.(\w|-|_)+.(\w|-|_)+)$/)){
			const token = auth.match(/^Bearer ((\w|-|_)+.(\w|-|_)+.(\w|-|_)+)$/)[1];
			jwt.verify(token, config.token.key, (err, decoded) => {
				decoded = decoded || {};
				if(err && config.needToken){
					res.status(500).json({message: err.message})
				} else {
					// Check user exist
					check(decoded.user, "", (valid) => {
						if(valid === "wrong password"){
							req.user = {
								user: decoded.user,
								role: decoded.role || "anonymous"
							}
						}
						next()
					})
				}
			})
		} else next()
	}).use((req, res, next) => {
		if(!isAllowed(req)){
			utils.throwError(NotAuthorizedError, res)
		} else next()
	})

	return router
}

/**
 * Default authentification function
 * 
 */
const checkAuthDefault = (login, password, callback) => {
	try{
		UserModel.findOne({"login": login}, (err, model) => {
			if (err) {
				callback(true)
				console.debug(err)
			} else if(model && model.get('password') === password) {
				callback(null, {user: model.get('login'), role: model.get('role')})
			} else if(model){
				callback("wrong password")
			} else {
				callback(true)
			}
		})
	} catch(err){
		callback(true)
		console.error(err)
	}  
}