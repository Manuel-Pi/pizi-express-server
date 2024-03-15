import { Request } from "express"
import { IUserRights, Role } from "./core/models/Role.js"

export interface UserRequest extends Request {
    userId: string
    userRoles: Role[]
    userRights: IUserRights
    tokenId: string
}