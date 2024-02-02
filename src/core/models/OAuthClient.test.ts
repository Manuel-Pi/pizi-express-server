import { IOAuthClient, OAuthClient } from "./OAuthClient.js"

const oauthClientData: IOAuthClient = {
    secret: 'testUser',
    redirectUris: ["http://localhost:3434/oauth"],
    grants: ["client_credentials"]
}

describe("UT - OAuthClient ", () => {

    test("valid client", async () => {
        const client = new OAuthClient(oauthClientData)
        expect(client).toMatchObject(oauthClientData)
        expect(client.id).toBeDefined()
    }) 
})