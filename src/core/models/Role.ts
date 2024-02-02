import { z } from "zod"
import { IModel, Model } from "./Model.js"
import { isValidRight } from "./rights/Right.js"

export interface IUserRights {
    [rightType: string]: {
        [rightName: string]: {
            [restriction: string]: any
        }
    }
}

export interface IRole extends IModel {
	name: string
    rights: IUserRights
    userIds: string[]
}

export class Role extends Model implements IRole{
    static Schema: z.ZodRawShape = {
		name: z.string().trim(),
        rights: z.object({}).passthrough().optional(),
        userIds: z.array(z.string().uuid())
	}

    static getUserRightsFromRoles(roles: IRole[]){
        const userRights: IUserRights = {}
        for(const role of roles){
            for(const rightType of Object.keys(role.rights)){
                const rights = role.rights[rightType]
                if(!userRights[rightType]) {
                    userRights[rightType] = rights
                } else {
                    for(const rightName of Object.keys(rights)){
                        if(!userRights[rightType][rightName]){
                            userRights[rightType][rightName] = rights[rightName]
                        } else {
                            for(const restrictionKey of Object.keys(rights[rightName])){
                                const restrictionValue = rights[rightName][restrictionKey]
                                if(Array.isArray(restrictionValue)){
                                    for(const item of restrictionValue){
                                        if(!userRights[rightType][rightName][restrictionKey].includes(item)) userRights[rightType][rightName][restrictionKey].push(item)
                                    }   
                                }
                            }
                        }
                    }
                }
            }
        }
        return userRights
    }

	name: string
    rights: {
        [rightType: string]: {
            [rightName: string]: any
        }
    } = {}
    userIds = []

    constructor(role: IRole){
        super(role)
        this.checkRoleRights(role)
		this.assign(role)
    }

    checkRoleRights(role: IRole){
        for(const rightType of Object.keys(role.rights)){
            for(const right of Object.keys(role.rights[rightType])) isValidRight({
                type: rightType,
                name: right,
                restrictions: {...role.rights[rightType][right]}
            })
        }
    }
}