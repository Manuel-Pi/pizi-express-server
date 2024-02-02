import { [FTName] } from "~/core/models/[FTName].js"
import { IAdapter } from "~/adapters/adapters.js"
import db from "~/adapters/mongo/DbAdapter.js"
import { logger } from "~/core/loggers.js"

interface I[FTName]DbAdapter extends IAdapter<[FTName]>{
}

const [FTName]DbAdapter = db<[FTName], I[FTName]DbAdapter>([FTName], {
})

export default [FTName]DbAdapter