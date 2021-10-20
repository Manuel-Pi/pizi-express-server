const fs = require('fs')
const path = require('path')
const console = require('./logger').getLogger()

const MODULES_FOLDER = "./modules/"

module.exports = {
    // Register web apps
    registerApps(appsPath, socketServer, serverUrl){
        // Get Apps
        const apps = fs.readdirSync(appsPath, { withFileTypes: true }).filter(dirent => {
            if(!dirent.isDirectory()) return false;
            if(fs.existsSync(path.join(appsPath, dirent.name, "server", "server.json")) && dirent.name !== "server") return true
            dirent.name !== "server" && console.warn("Socket App: No server.json file found for: " + dirent.name)
            return false
        }).map(dirent => {
            const json = require(path.join(appsPath, dirent.name, "server", "server.json"))
            return {...json, name: dirent.name, entry: path.join(appsPath, dirent.name, "server", json.entry)}
        })
        
        // Register Apps
        apps.forEach(app => {
            try{
                console.info("Socket App: " + app.name + " detected, trying to install...")
                if(app.type === "socket") require(app.entry)(socketServer,require('./logger').getLogger(app.name), serverUrl)
                console.info("Socket App: " + app.name + " successfully installed!")
            } catch(e){
                console.warn("Socket App: Error while installing: " + app.entry + "!")
                console.debug(e)
            }
        })

        return apps
    },

    activateModules : ({app, config, console}) => {
        // Use auth for the REST API
        if(config.jwt && config.rest){
            app.use(config.rest.url, require(MODULES_FOLDER + 'pizi-jwt')({
                config: config.jwt,
                console
            }))
            console.info("Module " + 'pizi-jwt' + " activated")
        }
        if(config.rest){
            // Define the REST API
            app.use(config.rest.url, require(MODULES_FOLDER + 'pizi-rest')({
                config: config.rest,
                console,
            }))
            console.info("Module " + 'pizi-rest' + " activated")
        }
        if(config.utils){
            // Add server utils
            app.use('/utils', require(MODULES_FOLDER + 'pizi-server-utils')({
                config: config.utils,
                console
            }));
            console.info("Module " + 'pizi-server-utils' + " activated")
        }

        // Watch dev apps
        if(process.env.NODE_ENV !== 'production' && config.watch && config.watch.enable){
            console.info("Module " + 'pizi-server-watch' + " activated")

            require(MODULES_FOLDER + 'pizi-watch-dev')({
                config: config.watch, 
                console
            }).forEach(middleware => app.use(middleware))
        }

        if(config.spa){

        }
    }
}