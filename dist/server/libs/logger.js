// Get config file
const fs = require('fs');
const path = require('path');
class Logger {
    /**
     * Create a logger for the specified prefix with the passed options
     * @param {string} name - name used to identify the logger
     * @param {object} options -    {
     *                                  level: debug | info | warn | error
     *                                  enabled: boolean - log into the file (if a filename is specified)
     *                                  filename: string - the filename to use for log file
     *                              }
     */
    constructor(name = "") {
        this.name = name;
    }
    static logToFile(filename, message) {
        if (!filename)
            return;
        if (!Logger.LOG_FILES[filename]) {
            const filepath = path.join(Logger.CONFIG.basePath, filename);
            if (!fs.existsSync(path.dirname(filepath)))
                fs.mkdirSync(path.dirname(filepath), { recursive: true });
            if (!Logger.LOG_FILES[filepath])
                Logger.LOG_FILES[filepath] = fs.createWriteStream(filepath, { flags: 'a' });
        }
        Logger.LOG_FILES[filepath].on('open', () => Logger.LOG_FILES[this.file].write(message + "\n"));
    }
    config() {
        return Logger.getConfig[this.name];
    }
    debug(...args) {
        const config = this.config();
        if (Logger.getLogLevelValue(config.level) > 0)
            return;
        const info = "DEBUG" + Logger.getInfo(this.name);
        if (Logger.CONSOLE_LEVEL <= 0)
            console.debug('\x1b[37m' + info, ...args, '\x1b[0m');
        Logger.logToFile(config.file, [info, ...args].join(" "));
    }
    info(...args) {
        const config = this.config();
        if (Logger.getLogLevelValue(config.level) > 1)
            return;
        const info = "INFO" + Logger.getInfo(this.name);
        if (Logger.CONSOLE_LEVEL <= 1)
            console.info('\x1b[36m' + info, ...args, '\x1b[0m');
        Logger.logToFile(config.file, [info, ...args].join(" "));
    }
    warn(...args) {
        const config = this.config();
        if (Logger.getLogLevelValue(config.level) > 2)
            return;
        const info = "WARN" + Logger.getInfo(this.name);
        if (Logger.CONSOLE_LEVEL <= 2)
            console.warn('\x1b[33m' + info, ...args, '\x1b[0m');
        Logger.logToFile(config.file, [info, ...args].join(" "));
    }
    error(...args) {
        const config = this.config();
        if (Logger.getLogLevelValue(config.level) > 3)
            return;
        const info = "ERROR" + Logger.getInfo(this.name);
        if (Logger.CONSOLE_LEVEL <= 3)
            console.error('\x1b[31m' + info, ...args, '\x1b[0m');
        Logger.logToFile(config.file, [info, ...args].join(" "));
    }
    log(...args) {
        const config = this.config();
        const info = "LOG" + Logger.getInfo(this.name);
        console.log(info, ...args);
        Logger.logToFile(config.file, [info, ...args].join(" "));
    }
}
/**
 * Config object: {
 *      console: logLevel
 *      loggers: {
 *          [loggerName]: {
 *              level: logLevel
 *              file:
 *          }
 *      }, ...
 * }
 */
Logger.CONFIG = {
    console: "info",
    basePath: path.join(__dirname, "/logs"),
    loggers: {}
};
/* Log files */
Logger.LOG_FILES = {};
/* Console log level */
Logger.CONSOLE_LEVEL = 1;
/* Time format */
Logger.TIME_FORMAT = new Intl.DateTimeFormat('en-US', {
    year: 'numeric', month: 'numeric', day: 'numeric',
    hour: 'numeric', minute: 'numeric', second: 'numeric',
    hour12: false
});
/* Log info string */
Logger.getInfo = (name) => "[" + Logger.TIME_FORMAT.format(new Date()) + "]" + name ? "[" + name + "]" : "";
/* Get log level, numeric value */
Logger.getLogLevelValue = (logLevel) => {
    switch (logLevel) {
        case "debug":
            return 0;
        case "info":
            return 1;
        case "warn":
            return 2;
        case "error":
            return 3;
        default:
            return 1;
    }
};
/* Get config for logger */
Logger.getConfig = (name) => Logger.CONFIG.loggers[name] || null;
const LOGGERS = new Map();
module.exports = {
    setConfig(config) {
        Logger.CONFIG = Object.assign(Object.assign({}, CONFIG), config);
        Logger.CONSOLE_LEVEL = Logger.getLogLevelValue(Logger.CONFIG.console);
        Object.values(Logger.LOG_FILES).forEach(file => file.close());
        Logger.LOG_FILES = {};
    },
    getLogger(name) {
        if (!LOGGERS.get(name))
            LOGGERS.set(name, new Logger(name));
        return LOGGERS.get(name);
    }
};
//# sourceMappingURL=logger.js.map