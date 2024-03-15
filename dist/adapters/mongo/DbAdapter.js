import { MongoClient } from "mongodb";
import { logger } from "../../core/loggers.js";
export const dbClient = new MongoClient(process.env.MONGO_URL);
export const db = dbClient.db(process.env.MONGO_DB_NAME);
export const ERRORS = {
    InvalidDataError: class InvalidDataError extends Error {
    },
    DuplicateError: class DuplicateError extends Error {
    },
    NotFoundError: class NotFoundError extends Error {
    }
};
export default (ModelClass, customDefinition = {}, collectionName) => {
    const collection = db.collection(collectionName || (ModelClass.name + 's'));
    logger.debug(`new db adpater for model: ${ModelClass.name} (collection: ${collection.collectionName})`);
    return {
        async save(model) {
            logger.debug(`saving ${ModelClass.name} model with id: '${model.id}'`);
            await collection.findOneAndUpdate({
                id: model.id
            }, {
                $set: model
            }, {
                upsert: true
            }).catch(e => {
                if (e.codeName === "DuplicateKey")
                    throw new ERRORS.DuplicateError(e);
                throw e;
            });
        },
        async delete(id) {
            logger.debug(`deleting ${ModelClass.name} model with id: ${id}`);
            await collection.deleteOne({ id });
        },
        async find(filter) {
            logger.debug(`searching for ${ModelClass.name} models`);
            const documents = await collection.find(filter).toArray();
            return documents.map(document => new ModelClass(document));
        },
        async findOne(filter) {
            switch (typeof filter) {
                case 'string': {
                    logger.debug(`searching for ${ModelClass.name} model with id: ${filter}`);
                    const document = await collection.findOne({ id: filter });
                    return document ? new ModelClass(document) : undefined;
                }
                case 'object': {
                    logger.debug(`searching for ${ModelClass.name} model with filter`);
                    const document = await collection.findOne(filter);
                    return document ? new ModelClass(document) : undefined;
                }
            }
        },
        ...customDefinition
    };
};
//# sourceMappingURL=DbAdapter.js.map