// Get config file
const config = require('../../config.json')
const fs = require('fs')
const path = require('path')
const logConfig = config.log || {}
const openFiles = {}


const getLogLevelValue = (logLevel) => {
    switch(logLevel){
        case "debug":
            return 0
        case "info":
            return 1
        case "warn":
            return 2
        case "error":
            return 3
        default:
            return 1
    }
}

const CONSOLE_LOG_LEVEL = getLogLevelValue(logConfig.console)

/**
 * Get a dedicated logger
 * @param {string} prefix - logger name
 * @param {
 *          level: 'debug' | 'info' | 'warn' | 'error'
 *          type: 'server' | 'app' | 'api'
 *        } options - logger options
 */
const getLogger = (prefix = "", options = {}) => {
    const conf = logConfig.loggers[prefix] || logConfig.loggers.server || {}
    const logLevel = options.level || conf.level || "info"

    let logFile
    if(conf.filename && conf.enabled !== false){
        let logDir
        switch(options.type){
            case "app":
                logDir = path.join(__dirname, "../../logs/apps")
            break
            case "api":
                logDir = path.join(__dirname, "../../logs/apis")
            break
            default:
                logDir = path.join(__dirname, "../../logs")
        }
        if(!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true })
        if(!openFiles[conf.filename]) openFiles[conf.filename] = fs.createWriteStream(path.join(logDir, conf.filename), {flags : 'a'})
        logFile = openFiles[conf.filename]
    }

    // Set level
    let logLevelValue = getLogLevelValue(logLevel)
    
    // Create log prefix
    const getInfo = () => {
        let stringDate = "[" + new Intl.DateTimeFormat('en-US', {
            year: 'numeric', month: 'numeric', day: 'numeric',
            hour: 'numeric', minute: 'numeric', second: 'numeric',
            hour12: false
        }).format(new Date()) + "]"
        stringDate += prefix ? "[" + prefix + "]" : ""
        return stringDate
    }
    
    return {
        debug: function(...args){
            if(logLevelValue > 0) return
            const info = "DEBUG" + getInfo()
            if(CONSOLE_LOG_LEVEL <= 0) console.debug('\x1b[37m' + info, ...args, '\x1b[0m')
            if(logFile) logFile.write([info, ...args].join(" ") + "\n")
        },
        info: function (...args) {
            if(logLevelValue > 1) return
            const info = "INFO" + getInfo()
            if(CONSOLE_LOG_LEVEL <= 1) console.info('\x1b[36m' + info, ...args, '\x1b[0m')
            if(logFile) logFile.write([info, ...args].join(" ") + "\n")
        },
        warn: function (...args) {
            if(logLevelValue > 2) return
            const info = "WARN" + getInfo()
            if(CONSOLE_LOG_LEVEL <= 2) console.warn('\x1b[33m' + info, ...args, '\x1b[0m')
            if(logFile) logFile.write([info, ...args].join(" ") + "\n")
        },
        error: function (...args) {
            if(logLevelValue > 3) return
            const info = "ERROR" + getInfo()
            if(CONSOLE_LOG_LEVEL <= 3) console.error('\x1b[31m' + info, ...args, '\x1b[0m')
            if(logFile) logFile.write([info, ...args].join(" ") + "\n")
        },
        log: function(...args){
            const info = "LOG" + getInfo()
            console.log(info, ...args)
            if(logFile) logFile.write([info, ...args].join(" ") + "\n")
        }
    }
}
const logger = getLogger()

module.exports = {
    email: {
        sendMail(emailObject, callback){
            logger.info("[email to console] => " + JSON.stringify(emailObject))
            callback(null, {})
        },
        close(){}
    },
    logger: {
        getLogger
    }
}