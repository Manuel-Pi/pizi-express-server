import { User } from "~/core/models/User.js"
import { IAdapter } from "~/adapters/adapters.js"
import db from "~/adapters/mongo/DbAdapter.js"
import { logger } from "~/core/loggers.js"

interface IUserDbAdapter extends IAdapter<User>{
    createSuperAdmin: () => Promise<string>
}

const UserDbAdapter = db<User, IUserDbAdapter>(User, {
    createSuperAdmin: async function(){
        const existingSuperAdmin = await this.findOne!({username: process.env.SUPER_ADMIN_USERNAME})
        if(existingSuperAdmin) return existingSuperAdmin.id
        logger.info("superAdmin not found, creating it ... ")
        const superAdmin = new User({
            username:   process.env.SUPER_ADMIN_USERNAME!,
            email:      process.env.SUPER_ADMIN_EMAIL!,
            password:   process.env.SUPER_ADMIN_PASSWORD!
        })
        await superAdmin.encryptPassword()
        await this.save!(superAdmin)
        return superAdmin.id
    }
})

export default UserDbAdapter