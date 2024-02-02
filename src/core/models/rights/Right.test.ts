import { isValidRight } from "./Right.js"

describe("UT - Right", () => {

    test("invalid right type", async () => {
        expect(() => {
            isValidRight({
                type: "Muser",
                name: "read"
            })
        }).toThrow('invalid right type')
    })

    test("invalid right name", async () => {
        expect(() => {
            isValidRight({
                type: "users",
                name: "asdasd"
            })
        }).toThrow('invalid right name')
    })

    test("invalid right (without restrictions object)", async () => {
        expect(() => {
            isValidRight({
                type: "users",
                name: "read"
            })
        }).toThrow()
    })

    test("valid right (without optional restriction)", async () => {
        expect(() => {
            isValidRight({
                type: "users",
                name: "read",
                restrictions: {
                    ids: []
                }
            })
        }).not.toThrow()
    })

    test("valid right (with restriction)", async () => {
        expect(() => {
            isValidRight({
                type: "users",
                name: "read",
                restrictions: {
                    ids: ["f6403294-08ff-4e0e-90d2-3b9ab167c360"]
                }
            })
        }).not.toThrow()
    })
})