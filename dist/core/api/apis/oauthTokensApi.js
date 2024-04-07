import OAuthTokenDbAdapter from "../../../adapters/mongo/OAuthTokenDbAdapter.js";
import { ModelApi } from "../PiziApi/PiziApi.js";
export const oauthTokensApi = new ModelApi("oauthTokens", {
    dbAdapter: OAuthTokenDbAdapter
});
//# sourceMappingURL=oauthTokensApi.js.map