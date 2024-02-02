import shell from 'shelljs';
import path from 'path';
const AppManager = {
    async registerApp(appOptions) {
        if (!process.env.APPS_DIR)
            throw new Error(`invalid APPS_DIR`);
        const appsDir = path.resolve(__dirname, process.env.APPS_DIR);
        const appsDirTmp = path.resolve(appsDir, "/tmp");
        // Clone repository
        if (shell.exec(`git clone ${appOptions.gitRepository} ${appsDirTmp}`).code !== 0) {
            shell.echo(`cannot clone repository: '${appOptions.gitRepository}'`);
            shell.exit(1);
        }
        // Check for project structure
        if (shell.cd()) {
            shell.echo(`cannot clone repository: '${appOptions.gitRepository}'`);
            shell.exit(1);
        }
    }
};
export { AppManager };
//# sourceMappingURL=AppManager.js.map