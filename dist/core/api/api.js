import { PiziApi } from "./PiziApi/PiziApi.js";
import { oauthAuthorizationCodesApi } from "./apis/oauthAuthorizationCodesApi.js";
import { oauthClientsApi } from "./apis/oauthClientsApi.js";
import { oauthTokensApi } from "./apis/oauthTokensApi.js";
import { rolesApi } from "./apis/rolesApi.js";
import { usersApi } from "./apis/usersApi.js";
export const apis = [
    usersApi,
    rolesApi,
    oauthTokensApi,
    oauthClientsApi,
    oauthAuthorizationCodesApi
];
export const api = new PiziApi(apis);
export const serverApi = api.getApi();
export const clientApi = api.getClientApi();
//# sourceMappingURL=api.js.map