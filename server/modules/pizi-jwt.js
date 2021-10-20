"use strict";
let jwt = require('jsonwebtoken');

// Define errors
let NotAuthorizedError = new Error("You are not authorized to proceed this operation!");
let NoCredential = new Error("Provide credential!");
let BadCredential = new Error("Bad credential!");

const CONNECTED_USERS = {};

module.exports = ({config, console, check = checkAuthDefault}) => {
	return (req, res, next) => {
		delete req.user;
		if(req.path === config.token.path){
			if(req.headers.login && req.headers.password){
				check(req.headers.login, req.headers.password, (err, user) => {
					if(err){
						if(err === "wrong password"){
							res.json({
								exist: true
							});
						} else {
							res.status(500).json({message: BadCredential.message});
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
				res.status(500).json({message: NoCredential.message});
			}
		} else if(req.path === config.token.checkPath){
			let auth = req.headers.authorization;
			if(auth && auth.match(/^Bearer ((\w|-|_)+.(\w|-|_)+.(\w|-|_)+)$/)){
				let token = auth.match(/^Bearer ((\w|-|_)+.(\w|-|_)+.(\w|-|_)+)$/)[1];
				jwt.verify(token, config.token.key, (err, decoded) => {
					decoded = decoded || {};
					// TODO: || !CONNECTED_USERS[decoded.user] || CONNECTED_USERS[decoded.user].ip !== req.connection.remoteAddress
					if(err){
						res.status(500).json({message: err ? err.message : "unknown user ip"});
					} else if(decoded && decoded.user){
						res.json({
							jwt: token,
							user: decoded.user,
							role: decoded.role
						});
					}
				});
			}
		}  else if(req.path === "/"){
			next();
		} else {
			let auth = req.headers.authorization;
			if(auth && auth.match(/^Bearer ((\w|-|_)+.(\w|-|_)+.(\w|-|_)+)$/)){
				let token = auth.match(/^Bearer ((\w|-|_)+.(\w|-|_)+.(\w|-|_)+)$/)[1];
				jwt.verify(token, config.token.key, (err, decoded) => {
					decoded = decoded || {};
					if(err && config.needToken){
						res.status(500).json({message: err.message});
					} else {
						req.user = {
							user: decoded.user,
							role: decoded.role || "anonymous"
						};
						next();
					}
				});
			} else {
				if(config.needToken) {
					res.status(500).json({message: NotAuthorizedError.message});
				} else {
					next();
				}
			}
		}
	}
}

// Default authentification function
const checkAuthDefault = (login, password, callback) => {
	const UserModel = require('../database/models/user');
	try{
		UserModel.find({"login": login},
		function(err, models) {
			if (err) {
				callback(true);
				console.debug(err);
			} else if(models.length > 0 && models[0].get('password') === password) {
				callback(null, {user: models[0].get('login'), role: models[0].get('role')});
			} else if(models.length > 0){
				callback("wrong password");
			} else {
				callback(true);
			}
		});
	} catch(err){
		callback(true);
		console.error(err);
	}  
}