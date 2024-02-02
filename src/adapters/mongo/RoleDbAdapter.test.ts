import { IRole, Role } from "~/core/models/Role.js"
import RoleDbAdapter from "./RoleDbAdapter.js"

const roleData: IRole = {
    name: 'testRole',
    rights: {},
    userIds: ["4a28e58d-7ae6-49d9-85ee-07631e0a8125"]
}

async function addRoleToDb(rData: IRole = roleData){
    const role = new Role(rData)
    await RoleDbAdapter.save(role)
    return role
}

describe("UT - RoleDbAdapter", () => {

    test("", async () => {
        await addRoleToDb()
        await addRoleToDb({...roleData, name: 'testRole2'})
        await addRoleToDb({...roleData, name: 'testRole3'})
        const roles = await RoleDbAdapter.getUserRoles("4a28e58d-7ae6-49d9-85ee-07631e0a8125")
        expect(roles.length).toBe(3)
    }) 
})