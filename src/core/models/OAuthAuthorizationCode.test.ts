import { IOAuthAuthorizationCode, OAuthAuthorizationCode } from "./OAuthAuthorizationCode.js"

const authorizationCodeData: IOAuthAuthorizationCode = {
    clientId: "7b307131-4011-4cdd-bffa-1709d7b39884",
	userId: "e4a92496-24f7-4694-9601-a73385fdcbf0",
	redirectUri: "http://localhost:2393/oauth",
    expiresAt: new Date(),
    authorizationCode: 	"asdasdasdsadas",
	scope: []
}

describe("UT - OAuthAuthorizationCode ", () => {

    test("valid authorization code", async () => {
        const authorizationCode = new OAuthAuthorizationCode(authorizationCodeData)
        expect(authorizationCode).toMatchObject(authorizationCodeData)
        expect(authorizationCode.id).toBeDefined()
    }) 
})