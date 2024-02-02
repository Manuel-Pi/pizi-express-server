import { z } from "zod"
import { IModel, Model } from "~/core/models/Model.js"

export interface I[FTName] extends IModel {

}


export class [FTName] extends Model implements I[FTName]{
    static Schema = {

	}

    constructor([FTName|camelcase]: I[FTName]){
        super([FTName|camelcase])
		this.assign([FTName|camelcase])
    }
}