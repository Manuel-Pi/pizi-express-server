import { IOAuthToken, OAuthToken } from "./OAuthToken.js"

const oauthTokenData: IOAuthToken = {
    accessToken: 'testUser',
    clientId: "96f512e6-55bb-4ef6-ba40-00cf2bc23883",
    userId:  "6ec4ff8f-fd16-45c3-8f06-c003aba79d0f"
}

describe("UT - OAuthToken", () => {

    test("valid token", async () => {
        const token = new OAuthToken(oauthTokenData)
        expect(token).toMatchObject(oauthTokenData)
        expect(token.id).toBeDefined()
    }) 
})