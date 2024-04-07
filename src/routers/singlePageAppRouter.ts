import express, { NextFunction, Request, Response } from 'express'
import { HttpErrors } from '~/Utils.js'
import ReactDOMServer from "react-dom/server"
import React from 'react'
import path from "path"
import { UserRequest } from '~/types.js'
import UserDbAdapter from '~/adapters/mongo/UserDbAdapter.js'
import { logger } from '~/core/loggers.js'
import { serverApi } from '~/core/api/api.js'
import "esm-reload"

const CACHE_INDEX: boolean = JSON.parse(process.env.CACHE_SSR_APP_FILES)

function renderApp(serverAppPath: string, appElement?: any){
    return async function renderApp(req: Request, res: Response, next: NextFunction){
        try{
            if(req.originalUrl.match(/.*\..*/)) return next()
            if(req.baseUrl.includes("/api"))    return next(new HttpErrors.NotFound())

            if(!CACHE_INDEX){
                logger.debug(`using ssr without cache`)
                const serverAppComponentPath = path.join(serverAppPath, `/ssr/server.js?reload`)
                const { default: App } = await import(serverAppComponentPath).catch(e => {
                    logger.debug(`ssr not available for '${serverAppComponentPath}': ${e.message}`)
                    return {}
                })
                appElement = App
            }

            if(appElement){
                try{
                    await SSRRendering(req, res, serverAppPath, appElement)
                } catch(e){
                    logger.error(new Error(`server-side rendering failed for '${serverAppPath}' : ${e.message}`, e))
                    StaticRendering(req, res, serverAppPath)
                }
            } else {
                StaticRendering(req, res, serverAppPath)
            }
        } catch(e){
            next(e)
        }
    }
}

function StaticRendering(req: Request, res: Response, serverAppPath: string){
    const appIndexFilePath = path.join(serverAppPath, "/client/index.html")
    res.sendFile(appIndexFilePath)
}

async function SSRRendering(req: Request, res: Response, serverAppPath: string, appElement: any){
    // Get server state for connected users
    const userRequest = req as UserRequest
    const serverState = { 
        token: userRequest.token && {
            accessToken: userRequest.token.accessToken,
            userId: userRequest.token.user.id
        }, 
        user: userRequest.token && (await UserDbAdapter.findOne(userRequest.token.user.id)).toPublic()
    }
    const props = await appElement.getAppPropsFromServer(createFetchRequest(req), { serverState })
    props.api = userRequest.token && serverApi
    const { pipe } = ReactDOMServer.renderToPipeableStream(React.createElement(appElement, props), {
        onShellReady() {
            res.setHeader('content-type', 'text/html')
            pipe(res)
        },
        onShellError(e: any){
            logger.error(new Error(`server-side rendering failed for '${serverAppPath}' : ${e.message}`, e))
            StaticRendering(req, res, serverAppPath)
        }
    })
}

function createFetchRequest(req: Request){
    const origin = `${req.protocol}://${req.get("host")}`
    const url = new URL(req.originalUrl || req.url, origin)
    const headers = new Headers()
    for(const [key, values] of Object.entries(req.headers)){
        if(!values) continue
        if (Array.isArray(values)) for(const value of values) headers.append(key, value)
        else headers.set(key, values)
    }
    return new Request(url.href, { method: req.method, headers })
}

export default async function(appDir: string){
    const router = express.Router()
    const serverAppPath = path.join(process.env.ROOT, appDir)
    const serverAppComponentPath = path.join(serverAppPath, `/ssr/server.js`)
    let App
    if(CACHE_INDEX){
        const { default: UnCachedApp } = await import(serverAppComponentPath).catch(e => {
            logger.debug(`ssr not available for '${serverAppComponentPath}': ${e.message}`)
            return {}
        })
        App = UnCachedApp
    }
    
    if(App) logger.info(`ssr active for '${appDir}'`)
    const renderer = renderApp(serverAppPath, App)
    router.get("/", renderer)
    logger.debug(`static path: ${serverAppPath}`)
    router.use(express.static(path.join(serverAppPath, "/client")))
    router.get(/.*/, renderer)
    return router
}