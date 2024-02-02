import { mockRequest, mockResponse } from "~/../tests/testHelper.js"
import authenticateMiddleware from "./authenticateMiddleware.js"

describe("UT - authenticateMiddleware", () => {
    test("no error with empty authorization header", async () => {
		const req = mockRequest()
		const res = mockResponse(200)
		const next = jest.fn()
		await authenticateMiddleware(req, res, next)
		expect(next).toHaveBeenCalledWith()
    })

    test("error if authorization header is not a valid bearer token", async () => {
        const req = mockRequest({
            headers: {
                authorization: "asdasdasdasdasdassad"
            }
        })
		const res = mockResponse(200)
		const next = jest.fn()
		await authenticateMiddleware(req, res, next)
		expect(next).toHaveBeenCalledWith(expect.objectContaining({ name: "BadRequestError", message: "invalid authorization header" }))
    })
})