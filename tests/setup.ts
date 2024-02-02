import supertest from "supertest"
import app from "../src/app.js"
import { dbClient, db } from "../src/adapters/mongo/DbAdapter.js"
import UserDbAdapter from "~/adapters/mongo/UserDbAdapter.js"
import RoleDbAdapter from "~/adapters/mongo/RoleDbAdapter.js"
import OAuthClientDbAdapter from "~/adapters/mongo/OAuthClientDbAdapter.js"

declare global {
    var TEST: any
}

beforeAll( async () => {
    // Mock express app
    const mockedApp = supertest(app)

    // Expose test globals
    global.TEST = { app: mockedApp }
})

beforeEach( async () => {
    await db.dropDatabase()
    // Setup
    const superAdminId = await UserDbAdapter.createSuperAdmin()
    await RoleDbAdapter.createSuperAdminRole(superAdminId)
    await OAuthClientDbAdapter.createServerClient()
})

afterAll(async () => {
    await dbClient.close()
})