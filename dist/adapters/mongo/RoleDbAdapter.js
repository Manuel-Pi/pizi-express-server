import { Role } from "../../core/models/Role.js";
import db from "./DbAdapter.js";
import { logger } from "../../core/loggers.js";
const RoleDbAdapter = db(Role, {
    async createSuperAdminRole(superAdminId) {
        const existingSuperAdminRole = await this.findOne({ name: process.env.SUPER_ADMIN_ROLE });
        if (existingSuperAdminRole)
            return existingSuperAdminRole.id;
        logger.info("superAdmin role not found, creating it ... ");
        const superAdminRole = new Role({
            name: process.env.SUPER_ADMIN_ROLE,
            rights: {},
            userIds: [superAdminId]
        });
        await this.save(superAdminRole);
        return superAdminRole.id;
    },
    async getUserRoles(userId) {
        const roles = await this.find({ userIds: userId });
        return roles;
    }
});
export default RoleDbAdapter;
//# sourceMappingURL=RoleDbAdapter.js.map