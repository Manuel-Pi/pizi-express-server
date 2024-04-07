import OAuthClientDbAdapter from "../../../adapters/mongo/OAuthClientDbAdapter.js";
import { ModelApi } from "../PiziApi/PiziApi.js";
export const oauthClientsApi = new ModelApi("oauthClients", {
    dbAdapter: OAuthClientDbAdapter
});
//# sourceMappingURL=oauthClientsApi.js.map