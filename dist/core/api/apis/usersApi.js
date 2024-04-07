import RoleDbAdapter from "../../../adapters/mongo/RoleDbAdapter.js";
import { ModelApi } from "../PiziApi/PiziApi.js";
import UserDbAdapter from "../../../adapters/mongo/UserDbAdapter.js";
export const usersApi = new ModelApi("users", {
    dbAdapter: UserDbAdapter,
    extraApi: {
        queries: {
            async getRoles(id) {
                return await RoleDbAdapter.getUserRoles(id);
            }
        }
    }
});
//# sourceMappingURL=usersApi.js.map