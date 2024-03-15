import HTTP_ERRORS from "http-errors";
import crypto from "crypto";
import migrate from "migrate";
import { logger } from "./core/loggers.js";
import DBMigrationDbAdapter from "./adapters/mongo/DBMigrationDbAdapter.js";
import { DBMigration } from "./core/models/DBMigration.js";
export const HttpErrors = HTTP_ERRORS;
export function formatZodError(error) {
    const errors = error.errors.map((error) => {
        return `${error.message.toLowerCase()} '${error.path.join(",")}': expected ${error.expected} but received '${error.received}'`;
    });
    return `[${errors.join(",")}]`;
}
const algorithm = 'aes-256-cbc'; //Using AES encryption
const key = Buffer.from(process.env.OAUTH_COOKIE_ENCRYPTION_KEY, 'utf8');
export function encrypt(text) {
    const iv = crypto.randomBytes(12).toString('base64');
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return `${encrypted.toString('hex')}:${iv}`;
}
export function decrypt(text) {
    const [encrypted, iv] = text.split(":");
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(Buffer.from(encrypted, 'hex'));
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
}
export function runMigrations(migrationsDir = process.env.MIGRATIONS_DIR) {
    return new Promise((resolve, reject) => {
        try {
            migrate.load({
                migrationsDirectory: "./server/adapters/mongo/migrations",
                filterFunction: (migration) => !migration.includes(".js.map"),
                stateStore: {
                    async load(callback) {
                        const [lastMigration] = await DBMigrationDbAdapter.find({});
                        if (!lastMigration)
                            logger.warn("cannot find previous migration");
                        return callback(null, lastMigration || {});
                    },
                    async save(set, callback) {
                        try {
                            const [lastMigration] = await DBMigrationDbAdapter.find({});
                            const migration = new DBMigration({
                                lastRun: set.lastRun,
                                migrations: set.migrations
                            });
                            await DBMigrationDbAdapter.save(migration);
                            // Delete previous entry
                            if (lastMigration)
                                await DBMigrationDbAdapter.delete(lastMigration.id);
                        }
                        catch (e) {
                            return callback(e);
                        }
                        return callback(null);
                    }
                }
            }, (e, set) => {
                if (e)
                    return error(e, reject);
                set.up((e) => {
                    if (e)
                        return error(e, reject);
                    logger.info('migrations successfully ran');
                    resolve();
                });
            });
        }
        catch (e) {
            error(e, reject);
        }
    });
}
function error(e, reject) {
    logger.error(`error on migration: ${e.message}`);
    reject(e);
}
//# sourceMappingURL=Utils.js.map