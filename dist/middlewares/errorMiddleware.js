import { HttpErrors } from "../Utils.js";
import { logger } from "../core/loggers.js";
export default async function (error, req, res, next) {
    try {
        const httpError = error instanceof HttpErrors.HttpError ? error : HttpErrors(500, error);
        // Log error
        logger.error(httpError);
        // Return error
        res.status(httpError.status).json({
            error: httpError.constructor.name,
            message: httpError.expose ? httpError.message : ""
        });
    }
    catch (e) {
        logger.error(e);
        res.end();
    }
}
//# sourceMappingURL=errorMiddleware.js.map