import express from 'express';
import { HttpErrors } from '../Utils.js';
import db, { ERRORS } from '../adapters/mongo/DbAdapter.js';
import { Model } from '../core/models/Model.js';
import { OAuthAuthorizationCode } from '../core/models/OAuthAuthorizationCode.js';
import { OAuthClient } from '../core/models/OAuthClient.js';
import { OAuthToken } from '../core/models/OAuthToken.js';
import { Role } from '../core/models/Role.js';
import { User } from '../core/models/User.js';
import rbac from '../middlewares/roleBasedAccessMiddleware.js';
const router = express.Router();
/* Models allowed in rest endpoint */
const MODELS = [User, Role, OAuthToken, OAuthClient, OAuthAuthorizationCode];
function checkRights(rights = []) {
    return rbac(req => ({ [req.params.store]: rights }));
}
function getModel(store) {
    for (const ModelClass of MODELS)
        if (ModelClass.name.toLowerCase() + "s" === store)
            return ModelClass;
    throw new HttpErrors.NotFound();
}
function getAdapter(store) {
    return db(getModel(store));
}
router.route('/:store').get(checkRights(['read']), async (req, res, next) => {
    try {
        const userRequest = req;
        const allowedIds = userRequest.userRights ? userRequest.userRights[req.params.store]['read'].ids : [];
        const dbAdapter = getAdapter(req.params.store);
        const models = await dbAdapter.find(allowedIds.length ? { id: allowedIds } : {});
        res.status(200).json(models.map(model => model.toPublic()));
    }
    catch (e) {
        next(e);
    }
}).post(checkRights(['write']), async (req, res, next) => {
    try {
        const ModelClass = getModel(req.params.store);
        const model = new ModelClass(req.body);
        const dbAdapter = getAdapter(req.params.store);
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
router.route('/:store/:id').get(checkRights(['read']), async (req, res, next) => {
    try {
        const dbAdapter = getAdapter(req.params.store);
        const model = await dbAdapter.findOne({ id: req.params.id });
        if (!model)
            throw new HttpErrors.NotFound();
        res.status(200).json(model.toPublic());
    }
    catch (e) {
        next(e);
    }
}).put(checkRights(['write']), async (req, res, next) => {
    try {
        const dbAdapter = getAdapter(req.params.store);
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
}).delete(checkRights(['delete']), async (req, res, next) => {
    try {
        const dbAdapter = getAdapter(req.params.store);
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
export default router;
//# sourceMappingURL=restRouter.js.map