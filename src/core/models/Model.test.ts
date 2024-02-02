import { z } from "zod"
import { IModel, Model } from "~/core/models/Model.js"

const testModelData = {
    foo: 'something incredible',
    bar: 2,
    param: {
        a: 39, 
        b: 29
    }
}

interface ITestModel extends IModel {
    foo: string
    bar: number
    param: {
        a: number
        b: number
    }
}

class TestModel extends Model implements ITestModel{
    static Schema = {
        foo: z.string().trim(),
        bar: z.number().max(10),
        param: z.object({
            a: z.number(),
            b: z.number()
        })
    }

    foo: string
    bar: number
    param: {
        a: number
        b: number
    }

    constructor(test: ITestModel){
        super(test)
        this.assign(test)
    }
}

describe("UT - Models", () => {

    test("invalid data", async () => {
        expect(() => {
            new TestModel({
                foo: 'testUser',
                bar: 14,
                param:{
                    a: 0,
                    b: 2
                }
            })
        }).toThrow('number must be less than or equal to 10')
    }) 


    test("valid data", async () => {
        const user = new TestModel(testModelData)

        expect(user).toMatchObject(testModelData)
        expect(user.id).toBeDefined()
    }) 
})