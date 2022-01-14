const webpack = require('webpack');
const webpackDevMiddleware = require('webpack-dev-middleware');
const webpackHotMiddleware = require('webpack-hot-middleware');
module.exports = ({ config, console }) => {
    const middlewares = [];
    if (config && config.projects)
        config.projects.forEach(webpackConfigProject => {
            try {
                const webpackConfigFile = require("../../../" + webpackConfigProject + "/webpack.config.dev.js");
                // Add middleware for SPA routing if needed
                try {
                    const serverConfig = require("../../../" + webpackConfigProject + "/src/server/server.json");
                    if (serverConfig.spa) {
                        middlewares.push(function (req, resp, next) {
                            const match = req.originalUrl.match(new RegExp("\\" + webpackConfigFile.output.publicPath + "((?:\\/[^/.]*)*)(\\/[^.]+\\.\\w+)?$"), "g");
                            if (match) {
                                console.debug("Re-routing " + req.originalUrl + " -> " + webpackConfigFile.output.publicPath);
                                req.url = webpackConfigFile.output.publicPath + (match[2] || "");
                            }
                            next();
                        });
                    }
                }
                catch (e) {
                    console.debug("Cannot add middleware for SPA routing for " + webpackConfigProject);
                }
                const compiler = webpack(webpackConfigFile);
                const middleware = webpackDevMiddleware(compiler, {
                    publicPath: webpackConfigFile.output.publicPath,
                });
                middleware.waitUntilValid(() => console.info(webpackConfigProject, "successfully compiled!"));
                middlewares.push(middleware);
                middlewares.push(webpackHotMiddleware(compiler));
                console.warn("Webpack watch for: " + webpackConfigProject + "!");
            }
            catch (e) {
                console.warn("Cannot watch: " + webpackConfigProject + "!", e.message);
            }
        });
    return middlewares;
};
//# sourceMappingURL=pizi-watch-dev.js.map