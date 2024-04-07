import OAuth2Server from "@node-oauth/oauth2-server"
import { Request, Response, NextFunction } from "express"
import { HttpErrors, decrypt } from "~/Utils.js"
import oauth from "~/core/oauth/oauth.js"
import { UserRequest } from "~/types.js"

export default async function (req: Request, res: Response, next: NextFunction): Promise<void>{
    try{
        if(!req.headers.authorization && req.cookies?.token){
            const tokenFromCookie = JSON.parse(decrypt(req.cookies.token))
            req.headers.authorization = `Bearer ${tokenFromCookie.access_token}`
        }
        if(req.headers.authorization){
            (req as UserRequest).token = await oauth.authenticate(new OAuth2Server.Request(req), new OAuth2Server.Response(res))
        }
        next()
    } catch(e) {
        next()
    }
}