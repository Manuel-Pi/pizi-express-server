import { z } from "zod";
import { Model } from "./Model.js";
export class OAuthAuthorizationCode extends Model {
    static Schema = {
        clientId: z.string().trim(),
        userId: z.string().uuid().trim(),
        redirectUri: z.string().url().trim(),
        expiresAt: z.date(),
        authorizationCode: z.string(),
        scope: z.array(z.string().trim()).optional().nullable()
    };
    clientId;
    userId;
    redirectUri;
    expiresAt;
    authorizationCode;
    responseType = 'code';
    scope = [];
    constructor(oAuthAuthorizationCode) {
        super(oAuthAuthorizationCode);
        this.assign(oAuthAuthorizationCode);
    }
    toNodeOAuthAuthorizationCode() {
        return {
            authorizationCode: this.authorizationCode,
            expiresAt: this.expiresAt,
            redirectUri: this.redirectUri,
            scope: this.scope,
            client: { id: this.clientId, grants: [] },
            user: { id: this.userId }
        };
    }
}
//# sourceMappingURL=OAuthAuthorizationCode.js.map