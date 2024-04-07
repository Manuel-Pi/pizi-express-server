import express from 'express'
import { AppManager } from '~/core/apps/AppManager.js'
import oauthRouter from '~/routers/oauthRouter.js'
import serverAppRouter from '~/routers/serverAppRouter.js'
import singlePageAppRouter from '~/routers/singlePageAppRouter.js'
import authenticateMiddleware from './middlewares/authenticateMiddleware.js'
import requestLoggerMiddleware from './middlewares/requestLoggerMiddleware.js'
import errorMiddleware from './middlewares/errorMiddleware.js'
import secureHeaderMiddleware from './middlewares/secureHeaderMiddleware.js'
import parserMiddleware from './middlewares/parserMiddleware.js'
import path from 'path'
import { api } from './core/api/api.js'

const app = express()
app.use(requestLoggerMiddleware)
app.use(secureHeaderMiddleware({corsAllowedUris: JSON.parse(process.env.CORS_ALLOWED_URIS)}))
app.use(parserMiddleware())

// Routers App
app.use(authenticateMiddleware)
app.use("/api/app",   serverAppRouter)
app.use("/api/oauth", oauthRouter)
app.use("/api/rest",  api.getRouter())

// Register App
app.post(`/register`, async (req, res, next) => {
    try{
        AppManager.registerApp(req.body.repository)
    } catch(e){
        next(e)
    }
})

app.get("/api/client.js", (req, res) => res.sendFile(path.join(process.env.ROOT, "server/core/api/clientApi.js")))
app.use(await singlePageAppRouter(process.env.WEB_APP_DIR))
app.get("/", (req, res) => res.send("Pizi Server"))
app.use(errorMiddleware)
export default app