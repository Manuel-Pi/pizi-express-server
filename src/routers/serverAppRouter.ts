import OAuth2Server from '@node-oauth/oauth2-server'
import express from 'express'
import oauth, { generateCodeChallenge, tokenOptions, tokenToSnakeCase } from '~/core/oauth/oauth.js'
import { logger } from '~/core/loggers.js'
import { HttpErrors, decrypt, generateRandomString } from '~/Utils.js'
import { encrypt } from '~/Utils.js'
import OAuthTokenDbAdapter from '~/adapters/mongo/OAuthTokenDbAdapter.js'
import { UserRequest } from '~/types.js'
import { withRefreshToken } from './oauthRouter.js'
const router = express.Router()

const STATES: {[key: string]: string} = {}

router.get("/token", async (req, res, next) => {
    try{
        let token
        const cookies = req.cookies
        if(!cookies || !cookies.token) throw new HttpErrors.NotFound()
        const tokenFromCookie = JSON.parse(decrypt(cookies.token))
        logger.info(`token retrieved from cookie for user '${tokenFromCookie.userId}'`)

        req.headers.authorization = `Bearer ${tokenFromCookie.access_token}`

        token = await oauth.authenticate(new OAuth2Server.Request(req), new OAuth2Server.Response(res)).catch(async (e: any) => {
            logger.info(`invalid access_token for user '${tokenFromCookie.user.id}'`)
            if(!tokenFromCookie.refresh_token) return
            // Get token from refresh token
            logger.info(`trying to have a new access_token from refresh_token`)
            req.body.client_id      = process.env.OAUTH_CLIENT_ID
            req.body.client_secret  = process.env.OAUTH_CLIENT_SECRET
            req.body.grant_type     = "refresh_token"
            req.body.refresh_token  = tokenFromCookie.refresh_token
            req.method              = "POST"
            req.headers['content-type']     = "application/x-www-form-urlencoded"
            req.headers['content-length']   = req.body.toString().length
            token = await oauth.token(new OAuth2Server.Request(req), new OAuth2Server.Response(res), tokenOptions(req))
            if(!token || !token.user) throw new Error(`cannot authenticate request`)
            // Encrypt token in a httpOnly secured cookie
            res.cookie('token', encrypt(JSON.stringify(tokenToSnakeCase(token))), { httpOnly: true, secure: true, sameSite: true, expires: new Date(token.refreshTokenExpiresAt!) })
            logger.info(`new access_token retrieved for '${tokenFromCookie.user.id}' from refresh_token`)
        })
        if(!token || !token.user) throw new HttpErrors.Unauthorized()

        res.status(200).json({
            accessToken: token.accessToken,
            userId: token.user.id
        })
    } catch(e){
        next(e)
    }
})

router.get("/authorizeCallback", async (req, res, next) => {
    try{
        const codeVerifier = STATES[req.query.state as string]
        if(!codeVerifier) throw new HttpErrors.BadRequest('invalid state')
        deleteState(req.query.state as string)
        req.body.client_id      = process.env.OAUTH_CLIENT_ID
        req.body.client_secret  = process.env.OAUTH_CLIENT_SECRET
        req.body.grant_type     = "authorization_code"
        req.body.code           = req.query.code
        req.body.redirect_uri   = JSON.parse(process.env.OAUTH_REDIRECT_URIS)[0]
        req.body.stayConnected  = req.query.stayConnected
        req.body.code_verifier  = codeVerifier
        req.method              = "POST"
        req.headers['content-type']     = "application/x-www-form-urlencoded"
        req.headers['content-length']   = req.body.toString().length

        const token = await oauth.token(new OAuth2Server.Request(req), new OAuth2Server.Response(res), tokenOptions(req))
        if(!token || !token.user) throw new Error(`cannot authenticate request`)

        // Encrypt token in a httpOnly secured cookie
        res.cookie('token', encrypt(JSON.stringify(tokenToSnakeCase(token, withRefreshToken(req as OAuth2Server.Request)))), { httpOnly: true, secure: true, sameSite: true, expires: new Date(req.body.stayConnected ? token.refreshTokenExpiresAt! : token.accessTokenExpiresAt!) })
        res.redirect(302, `/`)
    } catch(e){
        logger.error(e)
        res.redirect(302, `/error`)
    }
})

router.get("/login", async (req, res, next) => {
    try{
        const state = generateRandomString(10)
        const codeVerifier = generateRandomString(32)
        const codeChallengeMethod = 'S256'
        const codeChallenge = await generateCodeChallenge(codeVerifier, codeChallengeMethod)
        
        // Save codeVerifier with state in memory
        STATES[state] = codeVerifier
        // Remove state after OAUTH_STATE_LIFETIME
        setTimeout(() => deleteState(state), parseInt(process.env.OAUTH_STATE_LIFETIME))

        res.redirect(302, `https://localhost:2200/api/oauth/authorize?${new URLSearchParams({
            clientId: process.env.OAUTH_CLIENT_ID, 
            state, 
            codeChallengeMethod,
            codeChallenge,
            responseType: "code"
        })}`)
    } catch(e){
        next(e)
    }
})

router.get("/logout", async (req, res, next) => {
    try{
        const tokenId = (req as UserRequest).tokenId
        if(tokenId) await OAuthTokenDbAdapter.delete(tokenId)
        res.clearCookie("token")
        res.end()
    } catch(e){
        next(e)
    }
})

function deleteState(state: string){
    if(STATES[state]) delete STATES[state]
}

export default router