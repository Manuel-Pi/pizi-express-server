const webpack = require('webpack')
const webpackDevMiddleware = require('webpack-dev-middleware')

module.exports = ({config, console}) => {
    const middlewares = []
    if(config && config.projects) config.projects.forEach(webpackConfigProject => {
        try{
            const webpackConfigFile = require("../../../" + webpackConfigProject + "/webpack.config.js")

            // Add middleware for SPA routing if needed
            try{
                const serverConfig = require("../../../" + webpackConfigProject + "/src/server/server.json")
                if(serverConfig.spa){
                    middlewares.push(function (req, resp, next) {
                        if(req.originalUrl.match(new RegExp("\\" + webpackConfigFile.output.publicPath  + "\\/[^.]+$"), "g")){
                            console.debug("Re-routing " + req.originalUrl + " -> " + webpackConfigFile.output.publicPath)
                            req.url = webpackConfigFile.output.publicPath 
                        }
                        next()
                    })
                }
            } catch(e){
                console.debug("Cannot add middleware for SPA routing for " + webpackConfigProject)
            }

            const compiler = webpack(webpackConfigFile);
            middlewares.push(webpackDevMiddleware(compiler, {
                publicPath: webpackConfigFile.output.publicPath,
            }))
            console.warn("Webpack watch for: " + webpackConfigProject + "!")
        } catch(e){
            console.warn("Cannot watch: " + webpackConfigProject + "!", e)
        }
    })
    return middlewares
}