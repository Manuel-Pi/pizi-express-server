import oAuth2Server, { AuthorizationCodeModel, ClientCredentialsModel, ExtensionModel, PasswordModel, RefreshTokenModel } from '@node-oauth/oauth2-server'
import oauth from "./oauth.js"
import { TEST_DATA, authorizationCodeHelper, clientHelper, tokenHelper, userHelper } from '~/../tests/testHelper.js'

const oauthClientData = TEST_DATA.OAuthClients.clientCredentials
const userData = TEST_DATA.Users.testUser

const oAuth2ServerOptions: oAuth2Server.ServerOptions = (oauth as any).options
const oAuth2ServerModel: AuthorizationCodeModel | ClientCredentialsModel | RefreshTokenModel | PasswordModel | ExtensionModel = oAuth2ServerOptions.model

describe("UT - OAuth2Server model", () => {

    test("getAccessToken", async () => {
        const client = await clientHelper.addModelToDb(oauthClientData)
        const user = await userHelper.addModelToDb(userData)
        const tokenData = {
            ...TEST_DATA.OAuthToken.accessToken,
            userId: user.id,
            clientId: client.id
        }
        const token = await tokenHelper.addModelToDb(tokenData)
        const retrievedToken = await oAuth2ServerModel.getAccessToken(token.accessToken)
        expect(retrievedToken).toBeDefined()
    })

    test("getRefreshToken", async () => {
        const client = await clientHelper.addModelToDb(oauthClientData)
        const user = await userHelper.addModelToDb(userData)
        const tokenData = {
            ...TEST_DATA.OAuthToken.refreshToken,
            userId: user.id,
            clientId: client.id
        }
        const token = await tokenHelper.addModelToDb(tokenData)
        const retrievedToken = await (oAuth2ServerModel as RefreshTokenModel).getRefreshToken(token.refreshToken!)
        expect(retrievedToken).toBeDefined()
    }) 

    test("getClient", async () => {
        const client = await clientHelper.addModelToDb(oauthClientData)
        const retrievedClient = await oAuth2ServerModel.getClient(client.id, client.secret)
        expect(retrievedClient).toBeDefined()
        expect(retrievedClient).toMatchObject(client)
    }) 

    test("getUser", async () => {
        const user = await userHelper.addModelToDb(userData)
        const client = await clientHelper.addModelToDb(oauthClientData)
        const retrievedUser = await (oAuth2ServerModel as PasswordModel).getUser(user.username, user.password, client)
        expect(retrievedUser).toBeDefined()
        expect(retrievedUser).toMatchObject(user)
    })

    test("saveAuthorizationCode", async () => {
        const user = await userHelper.addModelToDb(userData)
        const client = await clientHelper.addModelToDb(oauthClientData)
        const retrievedAuthoizationCode = await (oAuth2ServerModel as AuthorizationCodeModel).saveAuthorizationCode(TEST_DATA.OAuthAuthorizationCode.code, client, user)
        expect(retrievedAuthoizationCode).toBeDefined()
    })

    test("getAuthorizationCode", async () => {
        const authorizationCode = await authorizationCodeHelper.addModelToDb(TEST_DATA.OAuthAuthorizationCode.code)
        const retrievedAuthrizationCode = await (oAuth2ServerModel as AuthorizationCodeModel).getAuthorizationCode(authorizationCode.authorizationCode)
        expect(retrievedAuthrizationCode).toBeDefined()
    }) 

    test("revokeAuthorizationCode", async () => {
        const authorizationCode = await authorizationCodeHelper.addModelToDb(TEST_DATA.OAuthAuthorizationCode.code)
        const isRevoked = await (oAuth2ServerModel as AuthorizationCodeModel).revokeAuthorizationCode({id: authorizationCode.id} as any)
        expect(isRevoked).toBe(true)
    })

    test("saveToken", async () => {
        const user = await userHelper.addModelToDb(userData)
        const client = await clientHelper.addModelToDb(oauthClientData)
        const tokenData = {
            ...TEST_DATA.OAuthToken.accessToken,
            userId: user.id,
            clientId: client.id
        }
        const token = await tokenHelper.addModelToDb(tokenData)
        const retrievedToken = await (oAuth2ServerModel as AuthorizationCodeModel).saveToken(token as any, client, user)
        expect(retrievedToken).toBeDefined()
        expect(retrievedToken).toMatchObject(tokenData)
    })

    test("revokeToken", async () => {
        const authorizationCode = await authorizationCodeHelper.addModelToDb(TEST_DATA.OAuthAuthorizationCode.code)
        const isRevoked = await (oAuth2ServerModel as RefreshTokenModel).revokeToken({id: authorizationCode.id} as any)
        expect(isRevoked).toBe(true)
    })

})