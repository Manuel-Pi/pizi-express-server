import { Request } from "express"
import { IUserRights, Role } from "./core/models/Role.js"
import OAuth2Server from "@node-oauth/oauth2-server"
import { IServerApi } from "./core/api/PiziApi/PiziApi.js"

declare global {
    const API: IServerApi
}

export interface UserRequest extends Request {
    userRoles: Role[]
    userRights: IUserRights
    token: OAuth2Server.Token
}

