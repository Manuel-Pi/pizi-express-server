import express from 'express'
import RoleDbAdapter from '~/adapters/mongo/RoleDbAdapter.js'
const router = express.Router()

router.get("/:id/roles", async (req, res, next) => {
    try{
        const roles = await RoleDbAdapter.getUserRoles(req.params.id)
        res.status(200).json(roles)
    } catch(e){
        next(e)
    }
})

export default router