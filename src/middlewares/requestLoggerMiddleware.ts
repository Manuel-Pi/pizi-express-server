import { Request, Response, NextFunction } from "express"
import { logger } from "~/core/loggers.js"

export default async function (req: Request, res: Response, next: NextFunction): Promise<void>{
    try{
        logger.info({
            req: {
                id: 	 (req as any).id,
                method:  req.method,
                url: 	 req.url.split("?")[0],
                headers: req.headers
            }
        }, `incoming request:`)
        next()
    } catch(e) {
        next(e)
    }
}