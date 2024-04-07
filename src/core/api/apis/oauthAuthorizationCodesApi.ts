import { IOAuthAuthorizationCode } from "~/core/models/OAuthAuthorizationCode.js"
import { IModelApi, ModelApi } from "../PiziApi/PiziApi.js"
import OAuthAuthorizationCodeDbAdapter from "~/adapters/mongo/OAuthAuthorizationCodeDbAdapter.js"

export type IOAuthAuthorizationCodesApi = IModelApi<IOAuthAuthorizationCode>

export const oauthAuthorizationCodesApi = new ModelApi<IOAuthAuthorizationCode, IOAuthAuthorizationCodesApi>("oauthAuthorizationCodes", {
    dbAdapter: OAuthAuthorizationCodeDbAdapter
})