import { z } from "zod";
import { Model } from "./Model.js";
export class OAuthClient extends Model {
    static Schema = {
        id: z.string().trim(),
        secret: z.string().trim(),
        redirectUris: z.array(z.string().url().trim()),
        grants: z.array(z.string().trim())
    };
    secret;
    redirectUris = [];
    grants = [];
    constructor(oAuthClient) {
        super(oAuthClient);
        this.assign(oAuthClient);
    }
}
//# sourceMappingURL=OAuthClient.js.map