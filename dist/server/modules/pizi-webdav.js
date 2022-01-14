"use strict";
const webdav = require('webdav-server').v2;
const path = require('path');
/**
 * pizi-webdav module
 * express middleware used expose a folder threw webdav
 * @param config: the options to use
 * @param console: the console object
 * @returns: the express middleware
 */
module.exports = ({ config, console, serverLibs = {} }) => {
    const webdavPath = path.join(__dirname, "../../", config.folderPath);
    // Users
    const userManager = new webdav.SimpleUserManager();
    const user = userManager.addUser('Pizi', 'p!z!p!z!', false);
    // Privilege manager (tells which users can access which files/folders)
    const privilegeManager = new webdav.SimplePathPrivilegeManager();
    privilegeManager.setRights(user, '/', ['all']);
    const webdavServer = new webdav.WebDAVServer({
        httpAuthentication: new webdav.HTTPBasicAuthentication(userManager, 'Default realm'),
        privilegeManager: privilegeManager
    });
    webdavServer.setFileSystem("/", new webdav.PhysicalFileSystem(webdavPath));
    return webdav.extensions.express(config.url, webdavServer);
};
//# sourceMappingURL=pizi-webdav.js.map