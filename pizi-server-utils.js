"use strict";
const express = require('express');
const fs = require('fs');
const basePath = 'Apps/';

module.exports = (config) => {
    // Get router
    let routerREST = express.Router();
    // Enter point
    routerREST.get('/', (req, res) => {
        res.json({ message: 'Pizi Server Utils'});
    });

    //List directory
    routerREST.post('/list', (req, res) => {
        let result = {directories: [], files: []};
        try{
            const path = req.body.path.match(/\w[\w|_|\/|\s]+/) ? req.body.path : null;
            if(!path) throw new Error("Path not valid");
            fs.readdir(basePath + path, (err, files)=>{
                if(files) for(let file of files) result[ fs.statSync(basePath + path + '/' + file).isDirectory() ? 'directories' : 'files'].push(file);
                res.json(result);
            });
        } catch(e){
            res.json(result);
        }
    });
    return routerREST;
}
