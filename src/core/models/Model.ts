import { ZodError, z } from "zod"
import { randomUUID } from 'crypto'

export interface IModel {
    id?: string
}

export abstract class Model {

    static getSchema() {
        let ineheritedSchema = {}
        let classProto = this as any
        while (classProto && classProto !== Object.prototype) {
            if (classProto.Schema) ineheritedSchema = {
                ...classProto.Schema,
                ...ineheritedSchema
            }
            classProto = classProto.__proto__
        }
        return ineheritedSchema
    }

    static Schema: z.ZodRawShape = {
        id: z.string().uuid()
    }

    static PrivateAttributes: string[] = []

    id: string

    constructor(model: any = {}){
        this.assign({
            ...model,
            id: model.id || randomUUID()
        })
    }

    assign(data: Partial<IModel>){
        try{
            const constructor = (<typeof Model>this.constructor)
            const ModelSchema = z.object(constructor.getSchema())
            Object.assign(this, ModelSchema.parse({...this, ...data}))
        } catch(e){
            let message = `cannot assign data to ${this.constructor.name} (id: '${this.id}'): `
            if(e instanceof ZodError){
                message += e.errors.map(ze => `${ze.path.join(', ')} ${ze.message.toLowerCase()}`).join(', ')
            } else {
                message += e.message
            }
            throw new Error(message)
        }

    }

    toPublic(){
        const publicData: any = {...this}
        const constructor = (<typeof Model>this.constructor)
        for(const attribute of constructor.PrivateAttributes) delete publicData[attribute]
        return publicData
    }

}
