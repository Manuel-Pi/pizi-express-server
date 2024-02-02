import express from 'express';
import UserDbAdapter from '../adapters/mongo/UserDbAdapter.js';
import roleBasedAccessMiddleware from '../middlewares/roleBasedAccessMiddleware.js';
const router = express.Router();
const userRight = (rights = []) => roleBasedAccessMiddleware({ users: rights });
router.get("/:id", userRight(['read']), async (req, res, next) => {
    try {
        const user = await UserDbAdapter.findOne(req.params.id);
        res.status(200).json(user.toPublic());
    }
    catch (e) {
        next(e);
    }
});
export default router;
//# sourceMappingURL=userRouter.js.map