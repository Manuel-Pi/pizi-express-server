const fs = require('fs');
const path = require('path');
const console = require('./logger').getLogger();

module.exports = {
    // Register web apps
    registerApps(appsPath, socketServer, serverUrl){
        // Get Apps
        const apps = fs.readdirSync(appsPath, { withFileTypes: true }).filter(dirent => {
            if(!dirent.isDirectory()) return false;
            if(fs.existsSync(path.join(appsPath, dirent.name, "server", "server.json")) && dirent.name !== "server") return true;
            dirent.name !== "server" && console.warn("Socket App: No server.json file found for: " + dirent.name);
            return false;
        }).map(dirent => {
            const json = require(path.join(appsPath, dirent.name, "server", "server.json"));
            return {...json, name: dirent.name, entry: path.join(appsPath, dirent.name, "server", json.entry)};
        });
        
        // Register Apps
        apps.forEach(app => {
            try{
                console.info("Socket App: " + app.name + " detected, trying to install..."); 
                if(app.type === "socket") require(app.entry)(socketServer,require('./logger').getLogger(app.name), serverUrl);
                console.info("Socket App: " + app.name + " successfully installed!"); 
            } catch(e){
                console.warn("Socket App: Error while installing: " + app.entry + "!"); 
                console.debug(e);
            }
        });

        return apps;
    },

    // Define the authentification function
    checkAuth(login, password, callback){
        const UserModel = require('./database/models/user');
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
}