import { z } from "zod";
import { Model } from "./Model.js";
export class DBMigration extends Model {
    static Schema = {
        lastRun: z.string().nullable(),
        migrations: z.array(z.any())
    };
    lastRun = "";
    migrations = [];
    constructor(dbMigration) {
        super(dbMigration);
        this.assign(dbMigration);
    }
}
//# sourceMappingURL=DBMigration.js.map