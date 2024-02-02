import { z } from "zod"
import { IModel, Model } from "~/core/models/Model.js"

export interface IOAuthClient extends IModel {
	secret: 		string
	redirectUris: 	string[]
	grants: 		OAuthGrantType[]
}

type OAuthGrantType = "authorization_code" | "refresh_token" | "client_credentials"  | "password"

export class OAuthClient extends Model implements IOAuthClient{
    static Schema = {
		id: z.string().trim(),
		secret: z.string().trim(),
		redirectUris: z.array(z.string().url().trim()),
		grants: z.array(z.string().trim())
	}

	secret: 		string
	redirectUris: 	string[] = []
	grants: 		OAuthGrantType[] = []

    constructor(oAuthClient: IOAuthClient){
        super(oAuthClient)
		this.assign(oAuthClient)
    }
}