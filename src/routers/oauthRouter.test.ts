import { TEST_DATA, authorizationCodeHelper, clientHelper, tokenHelper, userHelper } from "~/../tests/testHelper.js"

describe("UT - oauthRouter", () => {

    const OAUTH_PATH = "/api/oauth"
    const userData = TEST_DATA.Users.testUser

    test("get token from user credentials", async () => {
        const clientData = TEST_DATA.OAuthClients.password
        const client = await clientHelper.addModelToDb(clientData)
        const user = await userHelper.addModelToDb(userData)
        const response = await global.TEST.app.post(`${OAUTH_PATH}/token`)
            .set("Content-Type", "application/x-www-form-urlencoded")
            .send({
                grant_type:     "password",
                client_id:      client.id,
                client_secret:  client.secret,
                username:       user.username,
                password:       (user as any).password
            })

        expect(response.status).toBe(200)
        expect(response.body.access_token).toBeDefined()
    })

    test("get token from refresh_token", async () => {
        const clientData = TEST_DATA.OAuthClients.refreshToken
        const client = await clientHelper.addModelToDb(clientData)
        const user = await userHelper.addModelToDb(userData)
        const tokenData = {
            ...TEST_DATA.OAuthToken.refreshToken,
            userId: user.id,
            clientId: client.id,
        }
        const token = await tokenHelper.addModelToDb(tokenData)
        const response = await global.TEST.app.post(`${OAUTH_PATH}/token`)
            .set("Content-Type", "application/x-www-form-urlencoded")
            .send({
                grant_type:     "refresh_token",
                client_id:      client.id,
                client_secret:  client.secret,
                refresh_token:  token.refreshToken
            })

        expect(response.status).toBe(200)
        expect(response.body.access_token).toBeDefined()
    })

    test("get authorization code", async () => {
        const clientData = TEST_DATA.OAuthClients.authorizationCode
        const client = await clientHelper.addModelToDb(clientData)
        const user = await userHelper.addModelToDb(userData)
        const urlParams = new URLSearchParams({
            username:       user.username,
            password:       user.password,
            client_id:      client.id,
            state:          'randomState',
            response_type:  'code'
        })
        const response = await global.TEST.app.get(`${OAUTH_PATH}/authorize?${urlParams.toString()}`)
            .set("Content-Type", "application/x-www-form-urlencoded")

        expect(response.status).toBe(302)
        expect(response.header['location'].includes(client.redirectUris[0])).toBe(true)
    })

    test("get token from authorization code", async () => {
        const clientData = TEST_DATA.OAuthClients.authorizationCode
        const client = await clientHelper.addModelToDb(clientData)
        const user = await userHelper.addModelToDb(userData)
        const authorizationCode = await authorizationCodeHelper.addModelToDb({
            ...TEST_DATA.OAuthAuthorizationCode.code,
            clientId: client.id,
            userId: user.id
        })
        const response = await global.TEST.app.post(`${OAUTH_PATH}/token`)
            .set("Content-Type", "application/x-www-form-urlencoded")
            .send({
                grant_type:     "authorization_code",
                client_id:      client.id,
                client_secret:  client.secret,
                redirect_uri:   authorizationCode.redirectUri,
                code:           authorizationCode.authorizationCode
            })

        expect(response.status).toBe(200)
        expect(response.body.access_token).toBeDefined()
    })

    test("authorization code redirection", async () => {
        const clientData = TEST_DATA.OAuthClients.authorizationCode
        const client = await clientHelper.addModelToDb(clientData)
        const user = await userHelper.addModelToDb(userData)
        const authorizationCode = await authorizationCodeHelper.addModelToDb({
            ...TEST_DATA.OAuthAuthorizationCode.code,
            clientId: client.id,
            userId: user.id
        })
        const response = await global.TEST.app.get(`${OAUTH_PATH}/authorizeCallback?${new URLSearchParams({ code: authorizationCode.authorizationCode, state: "testState" })}`)
        expect(response.status).toBe(200)
        expect(response.body.access_token).toBeDefined()
    })

    test("authenticate request from brearer token", async () => {
        const clientData = TEST_DATA.OAuthClients.authorizationCode
        const user = await userHelper.addModelToDb(userData)
        const client = await clientHelper.addModelToDb(clientData)
        const tokenData = {
            ...TEST_DATA.OAuthToken.accessToken,
            userId: user.id,
            clientId: client.id
        }
        const token = await tokenHelper.addModelToDb(tokenData)
        const response = await global.TEST.app.get(`${OAUTH_PATH}/authenticate`)
            .set("authorization", `Bearer ${token.accessToken}`)

        expect(response.status).toBe(200)
    })
})