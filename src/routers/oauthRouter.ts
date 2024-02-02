import OAuth2Server from '@node-oauth/oauth2-server'
import express from 'express'
import OAuthClientDbAdapter from '~/adapters/mongo/OAuthClientDbAdapter.js'
import UserDbAdapter from '~/adapters/mongo/UserDbAdapter.js'
import oauth, { tokenOptions, tokenToSnakeCase } from '~/core/oauth/oauth.js'
import { encrypt, HttpErrors } from '~/Utils.js'
const router = express.Router()

router.post("/token", async (req, res, next) => {
    try{
        const token = await oauth.token(new OAuth2Server.Request(req), new OAuth2Server.Response(res), tokenOptions(req))
        res.status(200).json(tokenToSnakeCase(token))
    } catch(e){
        next(e)
    }
})

router.get("/authorize", async (req, res, next) => {
    try{
        res.redirect(302, `${process.env.OAUTH_LOGIN_URL}?${new URLSearchParams({clientId: req.query.clientId as string})}`)
    } catch(e){
        next(e)
    }
})

router.post("/authorize", async (req, res, next) => {
    try{
        const authorizationCode = await oauth.authorize(new OAuth2Server.Request(req), new OAuth2Server.Response(res), {
            authenticateHandler: {  handle: async () => {
                const user = await UserDbAdapter.findOne({ username: req.body.username }).catch( () => null )
                if(!user || !(await user.validatePassword(req.body.password))) throw new OAuth2Server.InvalidRequestError(`invalid credentials`)
                return user
            } },
            allowEmptyState: true,
            authorizationCodeLifetime: parseInt(process.env.OAUTH_AUTHORIZATION_CODE_LIFETIME)
        })

        const client = await OAuthClientDbAdapter.findOne(authorizationCode.client.id)
        res.status(200).json({
            redirectUri: `${client.redirectUris[0]}?${new URLSearchParams({ code: authorizationCode.authorizationCode, state: req.body.state })}`
        })
    } catch(e){
        next(e)
    }
})

router.get("/authenticate", async (req, res, next) => {
    try{
        const token = await oauth.authenticate(new OAuth2Server.Request(req), new OAuth2Server.Response(res))
        if(!token || !token.user) throw new HttpErrors.Unauthorized()
        res.status(200).end()
    }
    catch(e){
        next(e)
    }
        
})

export default router