import { logger } from "../core/loggers.js";
export default async function (req, res, next) {
    try {
        logger.info({
            req: {
                id: req.id,
                method: req.method,
                url: req.url.split("?")[0],
                headers: req.headers
            }
        }, `incoming request:`);
        next();
    }
    catch (e) {
        next(e);
    }
}
//# sourceMappingURL=requestLoggerMiddleware.js.map