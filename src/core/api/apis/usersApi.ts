import RoleDbAdapter from "~/adapters/mongo/RoleDbAdapter.js"
import { IModelApi, ModelApi } from "../PiziApi/PiziApi.js"
import { IUser } from "~/core/models/User.js"
import { IRole } from "~/core/models/Role.js"
import UserDbAdapter from "~/adapters/mongo/UserDbAdapter.js"

export type IUsersApi = IModelApi<IUser> & {
    queries: { 
        getRoles:( id: string) => Promise<IRole[]> 
    }
}

export const usersApi = new ModelApi<IUser, IUsersApi>("users", {
    dbAdapter: UserDbAdapter,
    extraApi: {
        queries: {
            async getRoles(id: string){
                    return await RoleDbAdapter.getUserRoles(id)
            }
        }
    }
})



