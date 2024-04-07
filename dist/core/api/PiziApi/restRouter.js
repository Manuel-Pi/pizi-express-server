import * as express from 'express';
import { HttpErrors } from '../../../Utils.js';
import { ERRORS } from '../../../adapters/mongo/DbAdapter.js';
import { Model } from '../../models/Model.js';
import { ModelApi } from './PiziApi.js';
import { logger } from '../../loggers.js';
export function getRouter(apis) {
    const router = express.Router();
    const stores = [];
    const dbAdapters = {};
    for (const api of apis) {
        stores.push(api.apiKey);
        if (api instanceof ModelApi)
            dbAdapters[api.apiKey] = api.dbAdapter;
        const a = api.getApi();
        for (const key of Object.keys(a.queries)) {
            const matchGet = key.match(/^get(\w+)/);
            if (matchGet && matchGet[1]) {
                logger.warn('found! ' + matchGet[0]);
                router.get(`/${api.apiKey}/:id/${matchGet[1].toLocaleLowerCase()}`, async (req, res, next) => {
                    try {
                        const results = await a.queries[key](req.params.id);
                        res.status(200).json(results);
                    }
                    catch (e) {
                        next(e);
                    }
                });
            }
        }
    }
    router.route('/:store').get(async (req, res, next) => {
        try {
            const dbAdapter = getAdapter(req, stores, dbAdapters);
            const models = await dbAdapter.find({});
            res.status(200).json(models.map(model => model.toPublic()));
        }
        catch (e) {
            next(e);
        }
    }).post(async (req, res, next) => {
        try {
            const dbAdapter = getAdapter(req, stores, dbAdapters);
            const model = new dbAdapter.Model(req.body);
            await dbAdapter.save(model);
            res.status(201).json(model);
        }
        catch (e) {
            let finalError = e;
            if (e instanceof Model.ERRORS.InvalidDataError)
                finalError = HttpErrors(400, e);
            if (e instanceof ERRORS.DuplicateError)
                finalError = HttpErrors(409, e);
            next(finalError);
        }
    });
    router.route('/:store/:id').get(async (req, res, next) => {
        try {
            const dbAdapter = getAdapter(req, stores, dbAdapters);
            const model = await dbAdapter.findOne({ id: req.params.id });
            if (!model)
                throw new HttpErrors.NotFound();
            res.status(200).json(model.toPublic());
        }
        catch (e) {
            next(e);
        }
    }).put(async (req, res, next) => {
        try {
            const dbAdapter = getAdapter(req, stores, dbAdapters);
            const model = await dbAdapter.findOne({ id: req.params.id });
            if (!model)
                throw new HttpErrors.NotFound();
            model.assign(req.body);
            await dbAdapter.save(model);
            res.status(200).json(model.toPublic());
        }
        catch (e) {
            next(e);
        }
    }).delete(async (req, res, next) => {
        try {
            const dbAdapter = getAdapter(req, stores, dbAdapters);
            const model = await dbAdapter.findOne({ id: req.params.id });
            if (!model)
                throw new HttpErrors.NotFound();
            await dbAdapter.delete(model.id);
            res.status(200).json();
        }
        catch (e) {
            next(e);
        }
    });
    return router;
}
function getStore(req, stores) {
    const store = req.params.store;
    if (!stores.includes(req.params.store))
        throw new HttpErrors.NotFound();
    return store;
}
function getAdapter(req, stores, dbAdapters) {
    const store = getStore(req, stores);
    if (!dbAdapters[store])
        throw new Error(`dbAdapter not found for store: ${store}`);
    return dbAdapters[store];
}
//# sourceMappingURL=restRouter.js.map