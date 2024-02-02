import { RefreshToken } from "@node-oauth/oauth2-server"
import { z } from "zod"
import { IModel, Model } from "~/core/models/Model.js"
import { OAuthClient } from "./OAuthClient.js"
import { User } from "./User.js"

export interface IOAuthToken extends IModel {
    accessToken: 			string
	accessTokenExpiresAt?: 	Date
	clientId: 				string
	userId: 				string
	refreshToken?: 			string
	refreshTokenExpiresAt?: Date
	tokenType?: 			string
    scope?:                 string[]
}

export class OAuthToken extends Model implements IOAuthToken{
    static Schema = {
        accessToken:            z.string().trim().optional().nullable(),
        accessTokenExpiresAt:   z.date().optional().nullable(),
        clientId:               z.string().trim(),
        userId:                 z.string().uuid().trim(),
        refreshToken:           z.string().trim().optional().nullable(),
        refreshTokenExpiresAt:  z.date().optional().nullable(),
        tokenType:              z.string().trim().optional(),
        scope:                  z.array( z.string().trim()).optional()
    }

    accessToken: 			string
	accessTokenExpiresAt?: 	Date
	clientId: 				string
	userId: 				string
	refreshToken?: 			string
	refreshTokenExpiresAt?: Date
	tokenType?: 			string = "Bearer"
    scope?:                 string[] = []

    constructor(oAuthToken: IOAuthToken){
        super(oAuthToken)
        this.assign(oAuthToken)
    }

    toNodeOAuthRefreshToken(client?: OAuthClient, user?: User): RefreshToken{
        return {
            id: this.id,
            refreshToken: this.refreshToken!,
            refreshTokenExpiresAt: this.refreshTokenExpiresAt,
            scope: this.scope,
            client: client || {id: this.clientId, grants: []},
			user: {id: this.userId}
        }
    }

    toNodeOAuthAccessToken(client?: OAuthClient, user?: User){
        return {
            id: this.id,
            accessToken: this.accessToken!,
            accessTokenExpiresAt: this.accessTokenExpiresAt,
            scope: this.scope,
            client: client || {id: this.clientId, grants: []},
			user: {id: this.userId}
        }
    }
}