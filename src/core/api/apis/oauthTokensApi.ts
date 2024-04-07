import OAuthTokenDbAdapter from "~/adapters/mongo/OAuthTokenDbAdapter.js"
import { IModelApi, ModelApi } from "../PiziApi/PiziApi.js"
import { IOAuthToken } from "~/core/models/OAuthToken.js"

export type IOAuthTokensApi = IModelApi<IOAuthToken>

export const oauthTokensApi = new ModelApi<IOAuthToken, IOAuthTokensApi>("oauthTokens", { 
    dbAdapter: OAuthTokenDbAdapter
})