import OAuth2Server from "@node-oauth/oauth2-server"
import { Request, Response, NextFunction } from "express"
import { HttpErrors } from "~/Utils.js"
import oauth from "~/core/oauth/oauth.js"
import { UserRequest } from "~/types.js"

export default async function (req: Request, res: Response, next: NextFunction): Promise<void>{
    try{
        if(req.headers.authorization){
            const token = await oauth.authenticate(new OAuth2Server.Request(req), new OAuth2Server.Response(res))
            const userReq = req as UserRequest
            userReq.userId = token.user.id
        }
        next()
    } catch(e) {
        next()
    }
}