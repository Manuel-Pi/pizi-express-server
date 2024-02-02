import { Role } from "./Role.js"

describe("UT - Role", () => {

    test("invalid role (empty rights)", async () => {
        const userRole = {
            name: "admin",
            rights: {
                Usesr: {
                    read: {}
                }
            },
            userIds: []
        }
        expect(() => {
            new Role(userRole)
        }).toThrow('invalid right')
    })

    test('getUserRightsFromRoles merge rights', async () => {
        const user = {
            id: "4a28e58d-7ae6-49d9-85ee-07631e0a8125"
        }
        const role1 = {
            name: "role1",
            rights: {
                users: {
                    read: {}
                }
            },
            userIds: [user.id]
        }
        const role2 = {
            name: "role2",
            rights: {
                users: {
                    read: {},
                    write: {},
                    delete: {}
                },
                role: {
                    read: {}
                }
            },
            userIds: [user.id]
        }
        const role3 = {
            name: "role3",
            rights: {
                role: {
                    write: {}
                },
                admin: {
                    read: {}
                }
            },
            userIds: [user.id]
        }
        const userRights = Role.getUserRightsFromRoles([role1, role2, role3])
        expect(userRights).toMatchObject({
            users: {
                read: {},
                write: {},
                delete: {}
            },
            role: {
                read: {},
                write: {}
            },
            admin: {
                read: {}
            }
        })
    })

    test('getUserRightsFromRoles merge restrictions', async () => {
        const user = {
            id: "4a28e58d-7ae6-49d9-85ee-07631e0a8125"
        }
        const role1 = {
            name: "role1",
            rights: {
                users: {
                    read: {
                        ids: ["956d5886-13e4-441c-b56e-63eb26a8995c"]
                    }
                }
            },
            userIds: [user.id]
        }
        const role2 = {
            name: "role2",
            rights: {
                users: {
                    read: {
                        ids: ["b22d2b7d-361a-424a-9c38-7e1d74a1900b"]
                    }
                }
            },
            userIds: [user.id]
        }
        const userRights = Role.getUserRightsFromRoles([role1, role2])
        expect(userRights).toMatchObject({
            users: {
                read: {
                    ids: ["956d5886-13e4-441c-b56e-63eb26a8995c", "b22d2b7d-361a-424a-9c38-7e1d74a1900b"]
                }
            }
        })
    })

})
