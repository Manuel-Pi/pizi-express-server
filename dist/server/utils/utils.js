const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
// Get config file
const config = require('../../config.json');
// Get server libs
const serverLibs = require('../libs/custom-server-libs');
const { getSystemErrorMap } = require('util');
// Override console
const console = serverLibs.logger.getLogger();
// Module folder
const MODULES_FOLDER = "../modules/";
// Array of Mongoose models
mongoose.models = mongoose.models || {};
const saltRounds = 10;
module.exports = {
    /**
     * Register pizi web app
     * @param {*} appsPath - apps folder
     * @param {*} socketServer - instance of socket to use for apps
     * @param {*} host - url of the server
     * @returns - registered apps
     */
    registerApps(appsPath, socketServer, host) {
        // Get Apps
        const apps = fs.readdirSync(appsPath, { withFileTypes: true }).filter(dirent => {
            if (!dirent.isDirectory())
                return false;
            if (fs.existsSync(path.join(appsPath, dirent.name, "server", "server.json")))
                return true;
            console.warn("Socket App: No server.json file found for: " + dirent.name);
            return false;
        }).map(dirent => {
            const json = require(path.join(appsPath, dirent.name, "server", "server.json"));
            return Object.assign(Object.assign({}, json), { name: dirent.name, entry: path.join(appsPath, dirent.name, "server", json.entry) });
        });
        // Register Apps
        apps.forEach(app => {
            try {
                console.info("Socket App: " + app.name + " detected, trying to install...");
                if (app.type === "socket")
                    require(app.entry)({
                        socketServer,
                        console: serverLibs.logger.getLogger(app.name, { type: 'app' }),
                        host
                    });
                console.info("Socket App: " + app.name + " successfully installed!");
            }
            catch (e) {
                console.warn("Socket App: Error while installing: " + app.entry + "!");
                console.debug(e);
            }
        });
        return apps;
    },
    /**
     * Activate server modules
     * @param {*} modulesParams - parameters passed to modules
     */
    activateModules: (server) => {
        // Use jwt restriction module
        if (config.jwt) {
            server.use(require(MODULES_FOLDER + 'pizi-jwt')({
                config: config.jwt,
                serverLibs,
                console: serverLibs.logger.getLogger('pizi-jwt')
            }));
            console.info("Module " + 'pizi-jwt' + " activated");
        }
        // Add users module
        if (config.users) {
            server.use(config.users.url, require(MODULES_FOLDER + 'pizi-users')({
                config: config.users,
                serverLibs,
                console: serverLibs.logger.getLogger('pizi-users')
            }));
            console.info("Module " + 'pizi-users' + " activated");
        }
        // Use the REST API module
        if (config.rest) {
            server.use(config.rest.url, require(MODULES_FOLDER + 'pizi-rest')({
                config: config.rest,
                serverLibs,
                console: serverLibs.logger.getLogger('pizi-rest')
            }));
            console.info("Module " + 'pizi-rest' + " activated");
        }
        // Add email module
        if (config.email) {
            server.use(config.email.url, require(MODULES_FOLDER + 'pizi-email')({
                config: config.email,
                serverLibs,
                console: serverLibs.logger.getLogger('pizi-email')
            }));
            console.info("Module " + 'pizi-email' + " activated");
        }
        // Add server utils module
        if (config.webdav && config.webdav.enabled !== false) {
            server.use(require(MODULES_FOLDER + 'pizi-webdav')({
                config: config.webdav,
                serverLibs,
                console: serverLibs.logger.getLogger('pizi-webdav')
            }));
            console.info("Module " + 'pizi-webdav' + " activated");
        }
        // Add server utils module
        if (config.utils && config.utils.enabled !== false) {
            server.use('/utils', require(MODULES_FOLDER + 'pizi-server-utils')({
                config: config.utils,
                serverLibs,
                console: serverLibs.logger.getLogger('pizi-server-utils')
            }));
            console.info("Module " + 'pizi-server-utils' + " activated");
        }
        // Watch dev apps
        if (process.env.NODE_ENV !== 'production' && config.watch && config.watch.enabled !== false) {
            console.info("Module " + 'pizi-server-watch' + " activated");
            require(MODULES_FOLDER + 'pizi-watch-dev')({
                config: config.watch,
                serverLibs,
                console: serverLibs.logger.getLogger('pizi-watch-dev')
            }).forEach(middleware => server.use(middleware));
        }
    },
    /**
     * Get mongoose model or create one
     * @param {string} name - model name
     * @returns - the mongoose model
     */
    getMongouseModel(name) {
        name = name.slice(-1) === "s" ? name.substring(0, name.length - 1) : name;
        let Model = mongoose.models[name];
        if (!Model) {
            try {
                Model = require('../database/models/' + name);
            }
            catch (e) {
                console.warn("No model matching: " + name + " ...create new one!");
                Model = mongoose.model(name, new mongoose.Schema());
                mongoose.models[name] = Model;
            }
        }
        return Model;
    },
    throwError(error, res, options = {}) {
        if (!res)
            throw error;
        else
            res.status(options.errorCode || 500).json({ message: error.message });
        const logger = options.logger || console;
        logger[options.logLevel || "error"](error.message, options.message || "");
    },
    getUserRoles(role) {
        const roles = config.jwt.roles || [];
        const userRoles = new Set([this.DEFAULT_ROLE, role]);
        if (!roles[role])
            return userRoles;
        if (roles[role].inherit)
            roles[role].inherit.forEach(r => this.getUserRoles(r).forEach(ur => userRoles.add(ur)));
        return userRoles;
    },
    compareEncrypted(password, encrypted) {
        return bcrypt.compareSync(password, encrypted);
    },
    encrypt(password) {
        return bcrypt.hashSync(password, saltRounds);
    },
    DEFAULT_ROLE: "anonymous"
};
//# sourceMappingURL=utils.js.map