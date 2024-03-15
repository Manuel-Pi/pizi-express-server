import { logger } from "../../../core/loggers.js";
import { db } from "../DbAdapter.js";
const filename = "1710132248186-userindexes.js";
export async function up(next) {
    const users = db.collection("Users");
    // unique id
    const uniqueIdResult = await users.createIndex({ id: 1 }, { unique: true });
    logger.info(`Index created: ${uniqueIdResult}`);
    // unique email
    const uniqueEmailResult = await users.createIndex({ email: 1 }, { unique: true });
    logger.info(`Index created: ${uniqueEmailResult}`);
    // unique username
    const uniqueUsernameResult = await users.createIndex({ username: 1 }, { unique: true });
    logger.info(`Index created: ${uniqueUsernameResult}`);
    logger.info(`${filename} up migration successfully executed`);
    next();
}
export async function down(next) {
    throw new Error("not implemented");
    logger.info(`${filename} down migration successfully executed`);
    next();
}
//# sourceMappingURL=1710132248186-userindexes.js.map