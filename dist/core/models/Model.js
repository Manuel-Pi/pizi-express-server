import { ZodError, z } from "zod";
import { randomUUID } from 'crypto';
export class Model {
    static getSchema() {
        let ineheritedSchema = {};
        let classProto = this;
        while (classProto && classProto !== Object.prototype) {
            if (classProto.Schema)
                ineheritedSchema = {
                    ...classProto.Schema,
                    ...ineheritedSchema
                };
            classProto = classProto.__proto__;
        }
        return ineheritedSchema;
    }
    static Schema = {
        id: z.string().uuid()
    };
    static PrivateAttributes = [];
    id;
    constructor(model = {}) {
        this.assign({
            ...model,
            id: model.id || randomUUID()
        });
    }
    assign(data) {
        try {
            const constructor = this.constructor;
            const ModelSchema = z.object(constructor.getSchema());
            Object.assign(this, ModelSchema.parse({ ...this, ...data }));
        }
        catch (e) {
            let message = `cannot assign data to ${this.constructor.name} (id: '${this.id}'): `;
            if (e instanceof ZodError) {
                message += e.errors.map(ze => `${ze.path.join(', ')} ${ze.message.toLowerCase()}`).join(', ');
            }
            else {
                message += e.message;
            }
            throw new Error(message);
        }
    }
    toPublic() {
        const publicData = { ...this };
        const constructor = this.constructor;
        for (const attribute of constructor.PrivateAttributes)
            delete publicData[attribute];
        return publicData;
    }
}
//# sourceMappingURL=Model.js.map