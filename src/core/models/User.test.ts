import { User } from "./User.js"

const userData = {
    username: 'testUser',
    email: 'test@test.com',
    password: 'Passw0rd!'
}

describe("UT - Users ", () => {

    test("invalid email", async () => {
        expect(() => {
            new User({
                ...userData,
                email: 'asdasdasd'
            })
        }).toThrow('invalid email')
    }) 

    test("valid user", async () => {
        const user = new User(userData)
        expect(user).toMatchObject(userData)
        expect(user.id).toBeDefined()
    }) 

    test("invalid password", async () => {
        const user = new User(userData)
        await user.encryptPassword()
        expect(user.password).not.toMatch(userData.password)
        const isValid = await user.validatePassword('Pwesw0rd!')
        expect(isValid).toBe(false)
    })

    test("valid password", async () => {
        const user = new User(userData)
        await user.encryptPassword()
        expect(user.password).not.toMatch(userData.password)
        const isValid = await user.validatePassword(userData.password)
        expect(isValid).toBe(true)
    })
})