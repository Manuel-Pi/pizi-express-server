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

	const restrictions = config.restrictions
    const restrictedPaths = new Set(Object.keys(restrictions).sort())
	const router = express.Router()

	// Check token and rights
	router.use((req, res, next) => {
		// Check token and add user to request
		delete req.user
		const auth = req.headers.authorization
		if(auth && auth.match(/^Bearer ((\w|-|_)+.(\w|-|_)+.(\w|-|_)+)$/)){
			const token = auth.match(/^Bearer ((\w|-|_)+.(\w|-|_)+.(\w|-|_)+)$/)[1];
			jwt.verify(token, config.token.key, (err, decoded = {}) => {
				if(err) utils.throwError(err.message, res)
				else {
					// Check user exist
					check(decoded.user, "", (valid) => {
						if(valid === "wrong password") req.user = 	{
																		token,
																		user: decoded.user,
																		role: decoded.role || "anonymous"
																	}
						next()
					})
				}
			})
		} else next()
	}).use((req, res, next) => {
		// Check if user is allowed for this path
		const userRoles = utils.getUserRoles(req.user?.role)
        let isAllowed = [...restrictedPaths].reduce((allow, path) => req.path.startsWith(path) ? restrictions[path].some(allowedRole => userRoles.has(allowedRole)): allow, true)
		console.debug(req.user ? req.user.user : utils.DEFAULT_ROLE, isAllowed ? "is allowed on" : "is not allowed on", req.path)

		if(!isAllowed) utils.throwError(NotAuthorizedError, res) 
		else next()
	})

	// Get or check tokens
	router.get(config.token.path,(req, res) => {
		// Get token
		if(req.headers.login && req.headers.password){
			check(req.headers.login, req.headers.password, (err, user) => {
				if(err === "wrong password") res.json({exist: true})
				else if(err) utils.throwError(BadCredential, res)
				else {
					let token = jwt.sign(Object.assign(config.token.payload, user), config.token.key, {expiresIn: config.token.expire});
					res.json({
						jwt: token,
						user: user.user,
						role: user.role
					})
					CONNECTED_USERS[user.user] = {
						token: token,
						ip: req.connection.remoteAddress
					}
					console.info("token given to: " + user.user + " for IP:" + req.connection.remoteAddress)
				}
			})
		} else if(req.user) res.json({
			jwt: req.user.token,
			user: req.user.user,
			role: req.user.role
		})
		else utils.throwError(NoCredential, res)
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
			if(err || !model) callback(err || "not found")
			else if(model && utils.compareEncrypted(password, model.get('password'))) callback(null, {user: model.get('login'), role: model.get('role')})
			else if(model) callback("wrong password")
		})
	} catch(err){
		callback(err)
	}  
}