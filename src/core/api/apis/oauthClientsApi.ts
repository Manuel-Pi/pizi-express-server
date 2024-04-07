import OAuthClientDbAdapter from "~/adapters/mongo/OAuthClientDbAdapter.js"
import { IModelApi, ModelApi } from "../PiziApi/PiziApi.js"
import { IOAuthClient } from "~/core/models/OAuthClient.js"

export type IOAuthClientsApi = IModelApi<IOAuthClient>

export const oauthClientsApi = new ModelApi<IOAuthClient, IOAuthClientsApi>("oauthClients", { 
    dbAdapter: OAuthClientDbAdapter
})