import OAuth2Server from '@node-oauth/oauth2-server';
import express from 'express';
import OAuthClientDbAdapter from '../adapters/mongo/OAuthClientDbAdapter.js';
import UserDbAdapter from '../adapters/mongo/UserDbAdapter.js';
import oauth, { tokenOptions, tokenToSnakeCase } from '../core/oauth/oauth.js';
import { HttpErrors } from '../Utils.js';
const router = express.Router();
export const STAY_CONNECTED_CACHE_ARRAY = new Set();
export function withRefreshToken(req) {
    let withRefreshToken = false;
    if (req.body.code && STAY_CONNECTED_CACHE_ARRAY.has(req.body.code)) {
        withRefreshToken = true;
        STAY_CONNECTED_CACHE_ARRAY.delete(req.body.code);
    }
    return withRefreshToken;
}
router.post("/token", async (req, res, next) => {
    try {
        const token = await oauth.token(new OAuth2Server.Request(req), new OAuth2Server.Response(res), tokenOptions(req));
        res.status(200).json(tokenToSnakeCase(token, withRefreshToken(req)));
    }
    catch (e) {
        next(e);
    }
});
router.get("/authorize", async (req, res, next) => {
    try {
        res.redirect(302, `${process.env.OAUTH_LOGIN_URL}?${new URLSearchParams(req.query)}`);
    }
    catch (e) {
        next(e);
    }
});
router.post("/authorize", async (req, res, next) => {
    try {
        const authorizationCode = await oauth.authorize(new OAuth2Server.Request(req), new OAuth2Server.Response(res), {
            authenticateHandler: { handle: async () => {
                    const user = await UserDbAdapter.findOne({ username: req.body.username });
                    if (!user || !(await user.validatePassword(req.body.password)))
                        throw new OAuth2Server.InvalidRequestError(`invalid credentials`);
                    return user;
                } },
            authorizationCodeLifetime: parseInt(process.env.OAUTH_AUTHORIZATION_CODE_LIFETIME)
        });
        if (req.body.stayConnected)
            STAY_CONNECTED_CACHE_ARRAY.add(authorizationCode.authorizationCode);
        const client = await OAuthClientDbAdapter.findOne(authorizationCode.client.id);
        res.status(200).json({
            redirectUri: `${client.redirectUris[0]}?${new URLSearchParams({
                code: authorizationCode.authorizationCode,
                state: req.body.state,
                stayConnected: req.body.stayConnected
            })}`
        });
    }
    catch (e) {
        next(e);
    }
});
router.get("/authenticate", async (req, res, next) => {
    try {
        const token = await oauth.authenticate(new OAuth2Server.Request(req), new OAuth2Server.Response(res));
        if (!token || !token.user)
            throw new HttpErrors.Unauthorized();
        res.status(200).end();
    }
    catch (e) {
        next(e);
    }
});
export default router;
//# sourceMappingURL=oauthRouter.js.map