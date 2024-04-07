import { IServerApi, PiziApi } from "./PiziApi/PiziApi.js"
import { IOAuthAuthorizationCodesApi, oauthAuthorizationCodesApi } from "~/core/api/apis/oauthAuthorizationCodesApi.js"
import { IOAuthClientsApi, oauthClientsApi } from "~/core/api/apis/oauthClientsApi.js"
import { IOAuthTokensApi, oauthTokensApi } from "~/core/api/apis/oauthTokensApi.js"
import { IRoleApi, rolesApi } from "~/core/api/apis/rolesApi.js"
import { IUsersApi, usersApi } from "~/core/api/apis/usersApi.js"

export interface ServerApi extends IServerApi{
    users: IUsersApi
    roles: IRoleApi
    oauthTokens: IOAuthTokensApi
    oauthClients: IOAuthClientsApi
    oauthAuthorizationCodes: IOAuthAuthorizationCodesApi
}

export const apis = [
    usersApi,
    rolesApi,
    oauthTokensApi,
    oauthClientsApi,
    oauthAuthorizationCodesApi
]

export const api = new PiziApi<ServerApi>(apis)

export const serverApi = api.getApi()
export const clientApi = api.getClientApi()