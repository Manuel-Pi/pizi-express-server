import { MongoClient } from "mongodb"
import { IModel, Model } from "~/core/models/Model.js"
import { IAdapter } from "../adapters.js"
import { logger } from "~/core/loggers.js"

export const dbClient = new MongoClient(process.env.MONGO_URL)
export const db = dbClient.db(process.env.MONGO_DB_NAME)

export const ERRORS = {
    InvalidDataError: class InvalidDataError extends Error {},
    DuplicateError  : class DuplicateError extends Error {},
    NotFoundError   : class NotFoundError extends Error {}
}

export interface IdbAdapter<T extends IModel> extends IAdapter<T> {
    Model: any
}

export default <T extends Model, U extends IAdapter<T> = IAdapter<T>> (ModelClass: any, customDefinition: Partial<U> = {}, collectionName?: string): U & { Model: any } => {
    const collection = db.collection<T>(collectionName || (ModelClass.name + 's'))
    logger.debug(`new db adpater for model: ${ModelClass.name} (collection: ${collection.collectionName})`)
    return {
        Model: ModelClass,
        async save(model){
            logger.debug(`saving ${ModelClass.name} model with id: '${model.id}'`)
            await collection.findOneAndUpdate({
                id: model.id
            } as any, {
                $set: model
            }, {
                upsert: true
            }).catch(e => {
                if(e.codeName === "DuplicateKey") throw new ERRORS.DuplicateError(e)
                throw e
            })            
        },
        async delete(id) {
            logger.debug(`deleting ${ModelClass.name} model with id: ${id}`)
            await collection.deleteOne({ id } as any)
        },
        async find(filter){
            logger.debug(`searching for ${ModelClass.name} models`)
            const documents = await collection.find(filter).toArray()
            return documents.map( document => new ModelClass(document) ) as T[]
        },
        async findOne(filter){        
            switch(typeof filter){
                case 'string':{
                    logger.debug(`searching for ${ModelClass.name} model with id: ${filter}`)
                    const document = await collection.findOne({id: filter} as any)
                    return document ? new ModelClass(document) as T : undefined
                }
                case 'object': {
                    logger.debug(`searching for ${ModelClass.name} model with filter`)
                    const document = await collection.findOne(filter)
                    return document ? new ModelClass(document) as T : undefined
                }
            }
        },
        ...customDefinition
    } as U & { Model: any}
}