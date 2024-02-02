import OAuth2Server from '@node-oauth/oauth2-server'
import express from 'express'
import oauth, { tokenOptions, tokenToSnakeCase } from '~/core/oauth/oauth.js'
import { logger } from '~/core/loggers.js'
import { HttpErrors, decrypt } from '~/Utils.js'
import { encrypt } from '~/Utils.js'
const router = express.Router()

router.get("/token", async (req, res, next) => {
    try{
        const cookies = req.cookies
        if(!cookies || !cookies.token) throw new HttpErrors.NotFound()
        const tokenFromCookie = JSON.parse(decrypt(cookies.token))
        logger.info(`token retrieved from cookie for user '${tokenFromCookie.userId}'`)

        req.headers.authorization = `Bearer ${tokenFromCookie.access_token}`
        let token = await oauth.authenticate(new OAuth2Server.Request(req), new OAuth2Server.Response(res)).catch(async e => {
            // Get token from refresh token
            logger.info(`invalid access_token for user '${tokenFromCookie.userId}', trying having new one from refresh_token`)
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
            res.cookie('token', encrypt(JSON.stringify(tokenToSnakeCase(token))), { httpOnly: true, secure: true, sameSite: true })
            logger.info(`new access_token retrieved for '${tokenFromCookie.userId}' from refresh_token`)
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
        req.body.client_id      = process.env.OAUTH_CLIENT_ID
        req.body.client_secret  = process.env.OAUTH_CLIENT_SECRET
        req.body.grant_type     = "authorization_code"
        req.body.code           = req.query.code
        req.body.state          = req.query.state
        req.body.redirect_uri   = JSON.parse(process.env.OAUTH_REDIRECT_URIS)[0]
        req.method              = "POST"
        req.headers['content-type']     = "application/x-www-form-urlencoded"
        req.headers['content-length']   = req.body.toString().length

        const token = await oauth.token(new OAuth2Server.Request(req), new OAuth2Server.Response(res), tokenOptions(req))
        if(!token || !token.user) throw new Error(`cannot authenticate request`)

        // Encrypt token in a httpOnly secured cookie
        res.cookie('token', encrypt(JSON.stringify(tokenToSnakeCase(token))), { httpOnly: true, secure: true, sameSite: true })
        res.redirect(302, `/`)
    } catch(e){
        next(e)
    }
})

router.get("/logout", async (req, res, next) => {
    try{
        res.clearCookie("token")
        res.end()
    } catch(e){
        next(e)
    }
})

export default router