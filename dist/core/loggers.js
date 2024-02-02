import { pino } from "pino";
export const logger = pino({
    level: process.env.NODE_ENV === 'test' ? 'silent' : (process.env.LOG_LEVEL || 'info'),
    transport: {
        target: 'pino-pretty',
        options: {
            colorize: true,
            singleLine: true,
            translateTime: "SYS:standard"
        }
    }
});
//# sourceMappingURL=loggers.js.map