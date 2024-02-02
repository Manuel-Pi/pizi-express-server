import { User } from "../../core/models/User.js";
import db from "./DbAdapter.js";
import { logger } from "../../core/loggers.js";
const UserDbAdapter = db(User, {
    createSuperAdmin: async function () {
        const existingSuperAdmin = await this.findOne({ username: process.env.SUPER_ADMIN_USERNAME });
        if (existingSuperAdmin)
            return existingSuperAdmin.id;
        logger.info("superAdmin not found, creating it ... ");
        const superAdmin = new User({
            username: process.env.SUPER_ADMIN_USERNAME,
            email: process.env.SUPER_ADMIN_EMAIL,
            password: process.env.SUPER_ADMIN_PASSWORD
        });
        await superAdmin.encryptPassword();
        await this.save(superAdmin);
        return superAdmin.id;
    }
});
export default UserDbAdapter;
//# sourceMappingURL=UserDbAdapter.js.map