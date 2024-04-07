import { IRole } from "~/core/models/Role.js"
import { IModelApi, ModelApi } from "../PiziApi/PiziApi.js"
import RoleDbAdapter from "~/adapters/mongo/RoleDbAdapter.js"

export type IRoleApi = IModelApi<IRole>

export const rolesApi = new ModelApi<IRole, IRoleApi>("roles", { 
    dbAdapter: RoleDbAdapter
})
