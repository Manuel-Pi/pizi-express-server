import { OAuthClient } from "~/core/models/OAuthClient.js"
import db from "~/adapters/mongo/DbAdapter.js"
import { logger } from "~/core/loggers.js"
import { User } from "~/core/models/User.js"
import { IAdapter } from "../adapters.js"

interface IOAuthClientDbAdapter extends IAdapter<OAuthClient>{
    createServerClient: () => Promise<void>
}

export default db<OAuthClient, IOAuthClientDbAdapter>(OAuthClient, {
    createServerClient: async function(){
        const serverClient = await this.findOne!({id: process.env.OAUTH_CLIENT_ID})
        if(serverClient) return
        logger.info("server client not found, creating it ... ")
        await this.save!(new OAuthClient({
            id:             process.env.OAUTH_CLIENT_ID,
            secret:         process.env.OAUTH_CLIENT_SECRET,
            redirectUris:   JSON.parse(process.env.OAUTH_REDIRECT_URIS),
            grants:         JSON.parse(process.env.OAUTH_REDIRECT_GRANTS)
        }))
    }
})