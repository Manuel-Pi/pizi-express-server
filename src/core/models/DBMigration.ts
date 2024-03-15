import { z } from "zod"
import { IModel, Model } from "~/core/models/Model.js"

export interface IDBMigration extends IModel {
    lastRun: string
    migrations: any[]
}


export class DBMigration extends Model implements IDBMigration{
    static Schema = {
        lastRun:  z.string().nullable(),
        migrations: z.array(z.any())
	}

    lastRun: string = ""
    migrations: any[] = []

    constructor(dbMigration: IDBMigration){
        super(dbMigration)
		this.assign(dbMigration)
    }
}