import { Request, Response, NextFunction } from "express"
import { HttpErrors } from "~/Utils.js"
import { logger } from "~/core/loggers.js"

export default async function (error: Error, req: Request, res: Response, next: NextFunction): Promise<void>{
    try{
        const httpError = error instanceof HttpErrors.HttpError ? error : HttpErrors(500, error)
        // Log error
        logger.error(httpError)
        // Return error
        res.status(httpError.status).json({
            error: httpError.constructor.name,
            message: httpError.expose ? httpError.message : ""
        })
    } catch(e) {
        logger.error(e)
        res.end()
    }
}