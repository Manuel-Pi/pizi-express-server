import { IModel } from "~/core/models/Model.js"

export interface IAdapter<T extends IModel> {
    save(model: T): Promise<void>
    delete(id: string): Promise<void>
    find(filter: object): Promise<T[]>
    findOne(id: string): Promise<T>
    findOne(filter: object): Promise<T>
}