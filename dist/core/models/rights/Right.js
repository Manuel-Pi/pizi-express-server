import { z } from "zod";
import { formatZodError } from "../../../Utils.js";
export const RIGHTS_DEFINITION = {
    users: {
        read: {
            restrictions: ['id']
        },
        write: {
            restrictions: ['id']
        },
        delete: {
            restrictions: ['id']
        }
    }
};
export function isValidRight(right = {}) {
    const rightsDefinition = RIGHTS_DEFINITION;
    const rightTypes = Object.keys(rightsDefinition);
    // Check if right exist
    if (!rightTypes.includes(right.type))
        throw new Error(`invalid right type`);
    if (!rightsDefinition[right.type][right.name])
        throw new Error(`invalid right name`);
    const rightDefinition = rightsDefinition[right.type][right.name];
    // Check restrictions
    if (rightDefinition.restrictions) {
        let restrictionsSchema = {};
        for (const restriction of rightDefinition.restrictions) {
            switch (restriction) {
                case "id":
                    restrictionsSchema = { ids: z.array(z.string().uuid()) };
                    break;
                default:
                    throw new Error(`invalid restriction '${JSON.stringify(restriction)}'`);
            }
        }
        try {
            z.object(restrictionsSchema).parse(right.restrictions);
        }
        catch (e) {
            throw new Error(`invalid restrictions: ${formatZodError(e)}`);
        }
    }
}
export function isAllow() {
}
//# sourceMappingURL=Right.js.map