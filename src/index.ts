import { checkEnvVars } from '~/core/envVars.js'
import https from 'https'
import fs from 'fs'
import app from '~/app.js'
import { Server } from 'socket.io'
import UserDbAdapter from './adapters/mongo/UserDbAdapter.js'
import { logger } from './core/loggers.js'
import OAuthClientDbAdapter from './adapters/mongo/OAuthClientDbAdapter.js'
import path from 'path'
import RoleDbAdapter from './adapters/mongo/RoleDbAdapter.js'
import axios from 'axios'
import { runMigrations } from './Utils.js'

process.on('SIGTERM', process.exit)
process.on('SIGINT', process.exit)

async function start(){
    // Setup
    checkEnvVars()
    await runMigrations()
    await RoleDbAdapter.createSuperAdminRole(await UserDbAdapter.createSuperAdmin())
    await OAuthClientDbAdapter.createServerClient()

    const certificatesPath = path.join(process.env.ROOT, process.env.HTTPS_CERTIFICATES_DIR)
    const serverOptions = {
        key: fs.readFileSync(`${certificatesPath}/cert.key`),
        cert: fs.readFileSync(`${certificatesPath}/cert.pem`)
    }

    const httpServer = https.createServer(serverOptions, app)
    const socketServer = new Server(httpServer)
    httpServer.listen(process.env.PORT)
    httpServer.on('error', e => logger.error(e))
    httpServer.on('listening', () => logger.info(`server sucessfully started on ${process.env.PORT}`))
    socketServer.of('/pizi-server').on('connection', (socket) => {
        console.log('socket user connected')
    })

    // Allow axios to bypass self signed certificate (must be disabled on prod)
    //const httpsAgent = new https.Agent({ rejectUnauthorized: false })
    //axios.defaults.httpsAgent = httpsAgent
    //logger.warn(process.env.NODE_ENV, `axios rejectUnauthorized is disabled`)
}
start()