"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogService = void 0;
const Service_1 = require("./Service");
const logger_1 = __importDefault(require("../libs/logger"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const TAIL_FILES = {};
const LOG_FILES = {};
class LogService extends Service_1.Service {
    constructor(config) {
        super("Log");
    }
    start(config) {
        super.start(config);
        logger_1.default.setConfig(this.config);
        // create files
        Object.keys(this.config.loggers).forEach(loggerName => {
            const loggerConfig = this.config.loggers[loggerName];
            if (loggerConfig.file && this.config.enabled !== false) {
                let filePath = path_1.default.join(__dirname, "../../logs", loggerConfig.file);
                // Create files
                if (!fs_1.default.existsSync(path_1.default.dirname(filePath)))
                    fs_1.default.mkdirSync(path_1.default.dirname(filePath), { recursive: true });
                if (!LOG_FILES[loggerName])
                    LOG_FILES[loggerName] = fs_1.default.createWriteStream(filePath, { flags: 'a' });
            }
        });
        // listen files
    }
}
exports.LogService = LogService;
//# sourceMappingURL=LogService.js.map