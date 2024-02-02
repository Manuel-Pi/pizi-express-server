import { encrypt, decrypt } from "./Utils.js"

describe("UT - Utils", () => {

    test("encrypt and decrypt string", async () => {
        const text = "asdasdsadasdasdasdasdrggdfgs"
        expect(decrypt(encrypt(text))).toEqual(text)
    }) 
})