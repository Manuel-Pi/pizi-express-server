import { z } from "zod";
import { Model } from "./Model.js";
import { isValidRight } from "./rights/Right.js";
export class Role extends Model {
    static Schema = {
        name: z.string().trim(),
        rights: z.object({}).passthrough().optional(),
        userIds: z.array(z.string().uuid())
    };
    static getUserRightsFromRoles(roles) {
        const userRights = {};
        for (const role of roles) {
            for (const rightType of Object.keys(role.rights)) {
                const rights = role.rights[rightType];
                if (!userRights[rightType]) {
                    userRights[rightType] = rights;
                }
                else {
                    for (const rightName of Object.keys(rights)) {
                        if (!userRights[rightType][rightName]) {
                            userRights[rightType][rightName] = rights[rightName];
                        }
                        else {
                            for (const restrictionKey of Object.keys(rights[rightName])) {
                                const restrictionValue = rights[rightName][restrictionKey];
                                if (Array.isArray(restrictionValue)) {
                                    for (const item of restrictionValue) {
                                        if (!userRights[rightType][rightName][restrictionKey].includes(item))
                                            userRights[rightType][rightName][restrictionKey].push(item);
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        return userRights;
    }
    name;
    rights = {};
    userIds = [];
    constructor(role) {
        super(role);
        this.checkRoleRights(role);
        this.assign(role);
    }
    checkRoleRights(role) {
        for (const rightType of Object.keys(role.rights)) {
            for (const right of Object.keys(role.rights[rightType]))
                isValidRight({
                    type: rightType,
                    name: right,
                    restrictions: { ...role.rights[rightType][right] }
                });
        }
    }
}
//# sourceMappingURL=Role.js.map