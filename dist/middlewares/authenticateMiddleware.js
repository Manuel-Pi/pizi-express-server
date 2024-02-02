import OAuth2Server from "@node-oauth/oauth2-server";
import oauth from "../core/oauth/oauth.js";
export default async function (req, res, next) {
    try {
        if (req.headers.authorization) {
            const token = await oauth.authenticate(new OAuth2Server.Request(req), new OAuth2Server.Response(res));
            const userReq = req;
            userReq.userId = token.user.id;
        }
        next();
    }
    catch (e) {
        next();
    }
}
//# sourceMappingURL=authenticateMiddleware.js.map