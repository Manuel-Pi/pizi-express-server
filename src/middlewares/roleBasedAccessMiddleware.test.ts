import { mockRequest, mockResponse } from "~/../tests/testHelper.js"
import roleBasedAccessMiddleware from "./roleBasedAccessMiddleware.js"
import { Role } from "~/core/models/Role.js"
import RoleDbAdapter from "~/adapters/mongo/RoleDbAdapter.js"
import UserDbAdapter from "~/adapters/mongo/UserDbAdapter.js"

describe("UT - roleBasedAccessMiddleware", () => {
	const user = { id: "9761589d-6854-4ebf-b961-089bbd075a7c" }
	const roleData = {
		name: "testRole",
		rights: {},
		userIds: [user.id]
	}

	async function addRoleToDb(rData: any = {}) {
		const role = new Role({ ...roleData, ...rData })
		await RoleDbAdapter.save(role)
		return role
	}

	test("access not allowed if user do not have matching rights", async () => {
		await addRoleToDb()
		const middleware = roleBasedAccessMiddleware({users: ['read']})
		const req = mockRequest({ userId: user.id })
		const res = mockResponse(200)
		const next = jest.fn()
		await middleware(req, res, next)
		expect(next).toHaveBeenCalledWith(expect.objectContaining({ name: "UnauthorizedError", message: "user do not have 'users' rights" }))
	})

	test("access allowed if user have matching rights (no restrictions)", async () => {
		await addRoleToDb({
			rights: {
				users: {
					read: {
						ids: []
					}
				}
			}
		})
		const middleware = roleBasedAccessMiddleware({users: ['read']})
		const req = mockRequest({ userId: user.id, params: { id: "fakeid"} })
		const res = mockResponse(200)
		const next = jest.fn()
		await middleware(req, res, next)
		expect(next).toHaveBeenCalledWith()
	})

	test("access not allowed if user do not have matching rights restrictions", async () => {
		const restrictionIds = ["76ccf678-9ebd-44c7-83f9-855c216fcd8c"]
		await addRoleToDb({
			rights: {
				users: {
					read: {
						ids: ["0e37c3aa-5a1a-4ecc-b190-b81545a52ba6"]
					}
				}
			}
		})
		const middleware = roleBasedAccessMiddleware({users: ['read']})
		const req = mockRequest({ userId: user.id, params: { id: restrictionIds[0]} })
		const res = mockResponse(200)
		const next = jest.fn()
		await middleware(req, res, next)
		expect(next).toHaveBeenCalledWith(expect.objectContaining({ name: "UnauthorizedError", message: "user not allowed: 'id' restriction not matching for 'users.read' right" }))
	})

	test("access allowed if user have matching rights restrictions", async () => {
		const restrictionIds = ["76ccf678-9ebd-44c7-83f9-855c216fcd8c"]
		await addRoleToDb({
			rights: {
				users: {
					read: {
						ids: restrictionIds
					}
				}
			}
		})
		const middleware = roleBasedAccessMiddleware({users: ['read']})
		const req = mockRequest({ userId: user.id, params: { id: restrictionIds[0]} })
		const res = mockResponse(200)
		const next = jest.fn()
		await middleware(req, res, next)
		expect(next).toHaveBeenCalledWith()
	})

	test("access allowed if user have superAdmin role", async () => {
		const restrictionIds = ["76ccf678-9ebd-44c7-83f9-855c216fcd8c"]
		const superAdmin = await UserDbAdapter.findOne({username: process.env.SUPER_ADMIN_USERNAME})
		const middleware = roleBasedAccessMiddleware({users: ['read']})
		const req = mockRequest({ userId: superAdmin.id, params: { id: restrictionIds[0]} })
		const res = mockResponse(200)
		const next = jest.fn()
		await middleware(req, res, next)
		expect(next).toHaveBeenCalledWith()
	})
})