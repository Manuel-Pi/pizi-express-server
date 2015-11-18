var jwt = require('jsonwebtoken');

module.exports = function(check){
	return function(req, res, next){
		if(req.path === "/token"){
			if(req.headers.login && req.headers.password){
				check(req.headers.login, req.headers.password, function(err){
					if(err){
						res.send(err);
					} else {
						var token = jwt.sign({
							user: req.headers.login,
							iss: "http://pizi-rest"
						}, 'PiziKey', {expiresIn: "1h"});
						res.json({
							jwt: token
						});
					}
				});
			} else {
				res.send("Error!");
			}
		} else {
			var auth = req.headers.authorization;
			if(auth && auth.match(/^Bearer (\w+.\w+.\w+)$/)){
				var token = auth.match(/^Bearer (\w+.\w+.\w+)$/)[1];
				jwt.verify(token, "PiziKey", function(err, decoded){
					if(err){
						res.send(err.message);
					} else {
						next();
					}
				});
			} else {
				res.send('Authorization needed');
			}
		}
	}
};