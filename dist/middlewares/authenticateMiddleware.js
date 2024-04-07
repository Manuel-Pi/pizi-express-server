import OAuth2Server from "@node-oauth/oauth2-server";
import { decrypt } from "../Utils.js";
import oauth from "../core/oauth/oauth.js";
export default async function (req, res, next) {
    try {
        if (!req.headers.authorization && req.cookies?.token) {
            const tokenFromCookie = JSON.parse(decrypt(req.cookies.token));
            req.headers.authorization = `Bearer ${tokenFromCookie.access_token}`;
        }
        if (req.headers.authorization) {
            req.token = await oauth.authenticate(new OAuth2Server.Request(req), new OAuth2Server.Response(res));
        }
        next();
    }
    catch (e) {
        next();
    }
}
//# sourceMappingURL=authenticateMiddleware.js.map