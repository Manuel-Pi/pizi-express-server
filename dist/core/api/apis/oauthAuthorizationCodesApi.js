import { ModelApi } from "../PiziApi/PiziApi.js";
import OAuthAuthorizationCodeDbAdapter from "../../../adapters/mongo/OAuthAuthorizationCodeDbAdapter.js";
export const oauthAuthorizationCodesApi = new ModelApi("oauthAuthorizationCodes", {
    dbAdapter: OAuthAuthorizationCodeDbAdapter
});
//# sourceMappingURL=oauthAuthorizationCodesApi.js.map