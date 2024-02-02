import { IModel, Model } from "~/core/models/Model.js"
import db from "~/adapters/mongo/DbAdapter.js"
import { IUser, User } from "~/core/models/User.js"
import { IOAuthClient, OAuthClient } from "~/core/models/OAuthClient.js"
import { IOAuthAuthorizationCode, OAuthAuthorizationCode } from "~/core/models/OAuthAuthorizationCode.js"
import { IOAuthToken, OAuthToken } from "~/core/models/OAuthToken.js"
import { Request, Response, NextFunction } from "express"

export function getModelHelper<T extends Model, U extends IModel>(ModelClass: any){
    const dbAdapter = db<T>(ModelClass)

    return {
        async addModelToDb(data: U){
            const model: T = new ModelClass(data)
            const savedModel = await dbAdapter.save(model)
            return model
        },
        async addModelsToDb(data: U[]){
            const models = await Promise.all(data.map(d => {
                dbAdapter.save(new ModelClass(d))
            }))
            return models
        }
    }
}

const today = new Date()
const tomorrow = new Date()
tomorrow.setDate(today.getDate() + 1)

export const clientHelper = getModelHelper<OAuthClient, IOAuthClient>(OAuthClient)
export const userHelper = getModelHelper<User, IUser>(User)
export const tokenHelper = getModelHelper<OAuthToken, IOAuthToken>(OAuthToken)
export const authorizationCodeHelper = getModelHelper<OAuthAuthorizationCode, IOAuthAuthorizationCode>(OAuthAuthorizationCode)

export const TEST_DATA = {
    OAuthClients: {
        clientCredentials: {
            secret: 'testSecret',
            redirectUris: ["http://localhost:3434/oauth"],
            grants: ["client_credentials"]
        } as IOAuthClient,
        password: {
            secret: 'testSecret',
            redirectUris: ["http://localhost:3434/oauth"],
            grants: ["password"]
        } as IOAuthClient,
        refreshToken: {
            id: process.env.OAUTH_CLIENT_ID,
            secret: 'testSecret',
            redirectUris: ["http://localhost:3434/oauth"],
            grants: ["refresh_token"]
        } as IOAuthClient,
        authorizationCode: {
            id: process.env.OAUTH_CLIENT_ID,
            secret: process.env.OAUTH_CLIENT_SECRET,
            redirectUris: JSON.parse(process.env.OAUTH_REDIRECT_URIS),
            grants: ["authorization_code"]
        } as IOAuthClient
    },
    OAuthAuthorizationCode: {
        code: {
            clientId: "7b307131-4011-4cdd-bffa-1709d7b39884",
            userId: "e4a92496-24f7-4694-9601-a73385fdcbf0",
            redirectUri: JSON.parse(process.env.OAUTH_REDIRECT_URIS)[0],
            expiresAt: tomorrow,
            authorizationCode: 	"asdasdasdsadas",
            scope: []
        } as IOAuthAuthorizationCode
    },
    OAuthToken: {
        accessToken: {
            accessToken: 'accessToken',
            clientId: "96f512e6-55bb-4ef6-ba40-00cf2bc23883",
            userId:  "6ec4ff8f-fd16-45c3-8f06-c003aba79d0f",
            accessTokenExpiresAt: tomorrow
        } as IOAuthToken,
        refreshToken: {
            refreshToken: 'refreshToken',
            clientId: "96f512e6-55bb-4ef6-ba40-00cf2bc23883",
            userId:  "6ec4ff8f-fd16-45c3-8f06-c003aba79d0f",
            refreshTokenExpiresAt: tomorrow
        } as IOAuthToken
    },
    Users: {
        testUser: {
            username: 'testUser',
            email: 'test@test.com',
            password: 'Passw0rd!'
        } as IUser
    }
}

export function mockRequest(customReq: any = {}){
    const req: any = {
        headers: {},
        ...customReq
    }
    return req as Request
}
  
export function mockResponse(status: number = 200){
    const res: any = {
        status: status,
        json: jest.fn().mockReturnValue({})
    }
    return res as Response
}

export function mockNext(){
    return jest.fn()
}