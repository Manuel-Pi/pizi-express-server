import { AuthorizationCode } from "@node-oauth/oauth2-server"
import { z } from "zod"
import { IModel, Model } from "~/core/models/Model.js"

export interface IOAuthAuthorizationCode extends IModel {
	clientId: 			string
	userId: 	      	string
	redirectUri:		string
    expiresAt:      	Date
    authorizationCode: 	string
	responseType?:		'code'
	codeChallenge?: 	string
	codeChallengeMethod?: string
	scope?:          	string[]
}

export class OAuthAuthorizationCode extends Model implements IOAuthAuthorizationCode{
    static Schema = {
		clientId: 			z.string().trim(),
        userId: 			z.string().uuid().trim(),
		redirectUri: 		z.string().url().trim(),
		expiresAt: 			z.date(),
		authorizationCode: 	z.string(),
		codeChallenge: 		z.string().optional(),
		codeChallengeMethod: z.string().optional(),
		scope: 			 	z.array( z.string().trim()).optional().nullable()
	}

	clientId: 			string
	userId: 	      	string
	redirectUri:		string
    expiresAt:      	Date
    authorizationCode: 	string
	responseType: 		'code' = 'code'
	codeChallenge?: 		string
	codeChallengeMethod?: string
	scope?:          	string[] = []

    constructor(oAuthAuthorizationCode: IOAuthAuthorizationCode){
        super(oAuthAuthorizationCode)
		this.assign(oAuthAuthorizationCode)
    }

	toNodeOAuthAuthorizationCode(): AuthorizationCode{
		return {
			authorizationCode: this.authorizationCode,
			expiresAt: this.expiresAt,
			redirectUri: this.redirectUri,
			scope: this.scope,
			client: {id: this.clientId, grants:[]},
			user: {id: this.userId}
		}
	}
}