import { z } from "zod";
import { Model } from "./Model.js";
export class OAuthToken extends Model {
    static Schema = {
        accessToken: z.string().trim().optional().nullable(),
        accessTokenExpiresAt: z.date().optional().nullable(),
        clientId: z.string().trim(),
        userId: z.string().uuid().trim(),
        refreshToken: z.string().trim().optional().nullable(),
        refreshTokenExpiresAt: z.date().optional().nullable(),
        tokenType: z.string().trim().optional(),
        scope: z.array(z.string().trim()).optional()
    };
    accessToken;
    accessTokenExpiresAt;
    clientId;
    userId;
    refreshToken;
    refreshTokenExpiresAt;
    tokenType = "Bearer";
    scope = [];
    constructor(oAuthToken) {
        super(oAuthToken);
        this.assign(oAuthToken);
    }
    toNodeOAuthRefreshToken(client, user) {
        return {
            id: this.id,
            refreshToken: this.refreshToken,
            refreshTokenExpiresAt: this.refreshTokenExpiresAt,
            scope: this.scope,
            client: client || { id: this.clientId, grants: [] },
            user: { id: this.userId }
        };
    }
    toNodeOAuthAccessToken(client, user) {
        return {
            id: this.id,
            accessToken: this.accessToken,
            accessTokenExpiresAt: this.accessTokenExpiresAt,
            scope: this.scope,
            client: client || { id: this.clientId, grants: [] },
            user: { id: this.userId }
        };
    }
}
//# sourceMappingURL=OAuthToken.js.map