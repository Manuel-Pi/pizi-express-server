"use strict";
const cache = require('memory-cache');

module.exports = ({config, console}) => {

    let expirationTime = 0;
    if(config.expirationTime.indexOf("h") !== -1){
        try{
            expirationTime = parseInt(config.expirationTime.replace("s", "")) * 60 * 60 * 1000;
        } catch(e){
            console.warn("Cannot parse cache expirationTime!");
            console.debug(e);
        }
    }

    return (req, res, next) => {
        if(req.method !== "GET" || !expirationTime){
            next();
            return;
        }

        const url = req.originalUrl || req.url;
        console.debug("Cache:" + url);
        const cachedResponse = cache.get(url);
        if(cachedResponse && expirationTime){
            console.debug("Cache found:" + url);
            res.send(cachedResponse);
            return;
        } else {
            res.sendNoCache = res.send;
            res.send = body => {
                console.debug("Create cache:" + url);
                cache.put(url, body, expirationTime);
                res.sendNoCache(body); 
            };
        }
        next();
        console.log(res.body);
    }
}