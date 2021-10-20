const MODULES_FOLDER = "./modules/";
module.exports = ({app, config, console}) => {
    // Use auth for the REST API
    if(config.jwt && config.rest){
        app.use(config.rest.url, require(MODULES_FOLDER + 'pizi-jwt')({
            config: config.jwt,
            console
        }));
        console.info("Module " + 'pizi-jwt' + " activated");
    }
    if(config.rest){
        // Define the REST API
        app.use(config.rest.url, require(MODULES_FOLDER + 'pizi-rest')({
            config: config.rest,
            console,
        }));
        console.info("Module " + 'pizi-rest' + " activated");
    }
    if(config.utils){
        // Add server utils
        app.use('/utils', require(MODULES_FOLDER + 'pizi-server-utils')({
            config: config.utils,
            console
        }));
        console.info("Module " + 'pizi-server-utils' + " activated");
    }

    // Watch dev apps
    if(process.env.NODE_ENV !== 'production' && config.watch && config.watch.enable){
        require(MODULES_FOLDER + 'pizi-watch-dev')({
            config: config.watch, 
            console
        }).forEach(middleware => app.use(middleware));
    }
}