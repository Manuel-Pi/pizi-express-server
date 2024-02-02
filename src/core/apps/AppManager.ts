import shell from 'shelljs'
import path from 'path'

interface AppRegisterOptions {
    gitRepository: string
    name?: string
}

interface IAppManager {
    registerApp(gitRepository: AppRegisterOptions): void
}

const AppManager: IAppManager = {
    async registerApp(appOptions: AppRegisterOptions){
        if(!process.env.APPS_DIR) throw new Error(`invalid APPS_DIR`)
        const appsDir = path.resolve(__dirname, process.env.APPS_DIR)
        const appsDirTmp = path.resolve(appsDir, "/tmp")

        // Clone repository
        if (shell.exec(`git clone ${appOptions.gitRepository} ${appsDirTmp}`).code !== 0) {
            shell.echo(`cannot clone repository: '${appOptions.gitRepository}'`)
            shell.exit(1)
        }

        // Check for project structure
        if (shell.cd()) {
            shell.echo(`cannot clone repository: '${appOptions.gitRepository}'`)
            shell.exit(1)
        }

    }
}

export {
    IAppManager,
    AppManager
} 
