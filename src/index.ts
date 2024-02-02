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

checkEnvVars()

async function start(){
    // Setup
    const superAdminId = await UserDbAdapter.createSuperAdmin()
    await RoleDbAdapter.createSuperAdminRole(superAdminId)
    await OAuthClientDbAdapter.createServerClient()

    const certificatesPath = path.join(process.env.ROOT, process.env.HTTPS_CERTIFICATES_DIR)
    const serverOptions = {
        key: fs.readFileSync(`${certificatesPath}/cert.key`),
        cert: fs.readFileSync(`${certificatesPath}/cert.pem`)
    }

    const httpServer = https.createServer(serverOptions, app)
    httpServer.listen(process.env.PORT)
    httpServer.on('error', e => logger.error(e))
    httpServer.on('listening', () => logger.info(`server sucessfully started on ${process.env.PORT}`))
    const socketServer = new Server(httpServer)

    // Allow axios to bypass self signed certificate (must be disabled on prod)
    const httpsAgent = new https.Agent({ rejectUnauthorized: false })
    axios.defaults.httpsAgent = httpsAgent
    logger.warn(process.env.NODE_ENV, `axios rejectUnauthorized is disabled`)
}
start()