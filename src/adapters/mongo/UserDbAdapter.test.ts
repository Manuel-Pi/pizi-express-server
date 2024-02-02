import { User } from "~/core/models/User.js"
import UserDbAdapter from "./UserDbAdapter.js"

const userData = {
    username: 'testUser',
    email: 'test@test.com',
    password: 'Passw0rd!'
}

async function addUserToDb(uData: any = userData){
    const user = new User(uData)
    await UserDbAdapter.save(user)
    return user
}

describe("UT - UserDbAdapter ", () => {

    test("Save user", async () => {
        await expect(addUserToDb()).resolves.not.toThrow()
    }, 100000)

    test("Get user by id", async () => {
        const user = await addUserToDb()
        const retrievedUser = await UserDbAdapter.findOne(user.id)
        expect(retrievedUser).toMatchObject(user)
    }, 100000)

    test("Get user with filter", async () => {
        const user = await addUserToDb()
        const retrievedUser = await UserDbAdapter.findOne({username: user.username})
        expect(retrievedUser).toMatchObject(user)
    }, 100000)
})