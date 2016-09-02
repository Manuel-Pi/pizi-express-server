"use strict";
let jwt = require('jsonwebtoken');

// Define errors
let NotAuthorizedError = new Error("You are not authorized to proceed this operation!");
let NoCredential = new Error("Provide credential!");
let BadCredential = new Error("Bad credential!");

module.exports = (check, config) => {
	return (req, res, next) => {
		delete req.user;
		if(req.path === config.token.path){
			if(req.headers.login && req.headers.password){
				check(req.headers.login, req.headers.password, (err, user) => {
					if(err){
						res.status(500).json({message: BadCredential.message});
					} else {
						let token = jwt.sign(Object.assign(config.token.payload, user), config.token.key, {expiresIn: config.token.expire});
						res.json({
							jwt: token
						});
					}
				});
			} else {
				res.status(500).json({message: NoCredential.message});
			}
		} else if(req.path === "/"){
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
							role: decoded.role
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
};