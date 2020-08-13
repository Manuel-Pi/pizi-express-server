const fs = require('fs');
const path = require('path');

module.exports = {
    // Register web apps
    registerApps(appsPath, socketServer){
        // Get Apps
        const apps = fs.readdirSync(appsPath, { withFileTypes: true }).filter(dirent => {
            if(!dirent.isDirectory()) return false;
            if(fs.existsSync(path.join(appsPath, dirent.name, "server", "server.json"))) return true;
            console.log("No server.json file found for: " + dirent.name);
            return false;
        }).map(dirent => {
            const json = require(path.join(appsPath, dirent.name, "server", "server.json"));
            return {...json, name: dirent.name, entry: path.join(appsPath, dirent.name, "server", json.entry)};
        });
        
        // Register Apps
        apps.forEach(app => {
            try{
                console.log("App: " + app.name + " detected, trying to install..."); 
                if(app.type === "socket") require(app.entry)(socketServer);
                console.log("App: " + app.name + " successfully installed!"); 
            } catch(e){
                console.log("Error while installing: " + app.entry + "!", e); 
            }
        });
    },

    // Define the authentification function
    checkAuth(login, password, callback){
        const UserModel = require('./database/models/user');
        try{
            UserModel.find({"login": login},
            function(err, models) {
                if (err) {
                    callback(true);
                    console.log(err);
                } else if(models.length > 0 && models[0].get('password') === password) {
                    callback(null, {user: models[0].get('login'), role: models[0].get('role')});
                } else {
                    callback(true);
                }
            });
        } catch(err){
            callback(true);
            console.log(err);
        }  
    }
}