import { DBMigration } from "~/core/models/DBMigration.js"
import db from "~/adapters/mongo/DbAdapter.js"

const DBMigrationDbAdapter = db<DBMigration>(DBMigration)

export default DBMigrationDbAdapter