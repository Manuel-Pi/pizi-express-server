import { ModelApi } from "../PiziApi/PiziApi.js";
import RoleDbAdapter from "../../../adapters/mongo/RoleDbAdapter.js";
export const rolesApi = new ModelApi("roles", {
    dbAdapter: RoleDbAdapter
});
//# sourceMappingURL=rolesApi.js.map