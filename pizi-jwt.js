var jwt = require('jsonwebtoken');

// Define errors
var NotAuthorizedError = new Error("You are not authorized to proceed this operation!");
var NoCredential = new Error("Provide credential!");
var BadCredential = new Error("Bad credential, cannot access API!");

module.exports = function(check, config){
	return function(req, res, next){
		if(req.path === "/token"){
			if(req.headers.login && req.headers.password){
				check(req.headers.login, req.headers.password, function(err){
					if(err){
						res.status(500).json({message: BadCredential.message});
					} else {
						var payload = config.payload;
						payload.user = req.headers.login;
						var token = jwt.sign(payload, config.key, {expiresIn: config.expire});
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
			var auth = req.headers.authorization;
			if(auth && auth.match(/^Bearer ((\w|-|_)+.(\w|-|_)+.(\w|-|_)+)$/)){
				var token = auth.match(/^Bearer ((\w|-|_)+.(\w|-|_)+.(\w|-|_)+)$/)[1];
				jwt.verify(token, config.key, function(err, decoded){
					if(err){
						res.status(500).json({message: err.message});
					} else {
						next();
					}
				});
			} else {
				res.status(500).json({message: NotAuthorizedError.message});
			}
		}
	}
};