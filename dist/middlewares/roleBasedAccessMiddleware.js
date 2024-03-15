import RoleDbAdapter from "../adapters/mongo/RoleDbAdapter.js";
import { RIGHTS_DEFINITION } from "../core/models/rights/Right.js";
import { Role } from "../core/models/Role.js";
import { HttpErrors } from "../Utils.js";
export default function (requiredRightsFunction) {
    return async function (req, res, next) {
        try {
            const userReq = req;
            if (!userReq.userId)
                throw new HttpErrors.Unauthorized(`user not found in request`);
            const userRoles = await RoleDbAdapter.getUserRoles(userReq.userId);
            userReq.userRoles = userRoles;
            // If user has superAdminRole access is allowed
            if (userRoles.map(role => role.name).includes(process.env.SUPER_ADMIN_ROLE))
                return next();
            const requiredRights = requiredRightsFunction(req);
            // Get rights from user's roles
            const userRights = Role.getUserRightsFromRoles(userRoles);
            userReq.userRights = userRights;
            for (const requiredRightType of Object.keys(requiredRights)) {
                if (!userRights[requiredRightType])
                    throw new HttpErrors.Unauthorized(`user do not have '${requiredRightType}' rights`);
                for (const requiredRightName of requiredRights[requiredRightType]) {
                    if (!userRights[requiredRightType][requiredRightName])
                        throw new HttpErrors.Unauthorized(`user do not have '${requiredRightType}.${requiredRightName}' right`);
                    // Check restrictions
                    const rightsDefinition = RIGHTS_DEFINITION;
                    for (const restrictionKey of rightsDefinition[requiredRightType][requiredRightName].restrictions) {
                        switch (restrictionKey) {
                            case "id":
                                const userAllowedIds = userRights[requiredRightType][requiredRightName].ids;
                                const id = req.params.id;
                                if (!id)
                                    throw new Error(`cannot find an id for restrictions`);
                                // Authorized if user restriction ids is an empty array
                                if (!userAllowedIds.length)
                                    continue;
                                // Authorized if user restriction ids match required
                                if (userAllowedIds.includes(id))
                                    continue;
                            default:
                                throw new HttpErrors.Unauthorized(`user not allowed: '${restrictionKey}' restriction not matching for '${requiredRightType}.${requiredRightName}' right`);
                        }
                    }
                }
            }
            next();
        }
        catch (e) {
            next(e);
        }
    };
}
//# sourceMappingURL=roleBasedAccessMiddleware.js.map