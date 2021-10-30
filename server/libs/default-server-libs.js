// Get config file
const config = require('../../config.json')
const CONFIG_LOGGER = config.logger || {}

/**
 * Get a dedicated logger
 * @param {string} prefix - logger name
 * @param {
 *          level: 'debug' | 'info' | 'warn' | 'error'
 *        } options - logger options
 */
const getLogger = (prefix = "", options = {}) => {
    let logLevelValue
    let logLevel = options.level || CONFIG_LOGGER[prefix] || CONFIG_LOGGER.server || "info"
    
    // Set level
    if(logLevel){
        switch(logLevel){
            case "debug":
                logLevelValue = 0;
                break;
            case "info":
                logLevelValue = 1;
                break;
            case "warn":
                logLevelValue = 2;
                break;
            case "error":
                logLevelValue = 3;
                break;
            default:
                logLevelValue = 1;
        }
    }

    // Create log prefix
    let stringDate = prefix ? " " + prefix : "";
    stringDate += " [" + new Intl.DateTimeFormat('en-US', {
        year: 'numeric', month: 'numeric', day: 'numeric',
        hour: 'numeric', minute: 'numeric', second: 'numeric',
        hour12: false
    }).format(new Date()) + "]: "
    
    return {
        debug: function(...args){
            if(logLevelValue > 0) return
            console.debug('\x1b[37mDEBUG' + stringDate + '%s\x1b[0m', ...args)
        },
        info: function (...args) {
            if(logLevelValue > 1) return
            console.info('\x1b[36mINFO' + stringDate + '%s\x1b[0m', ...args)
        },
        warn: function (...args) {
            if(logLevelValue > 2) return
            console.warn('\x1b[33mWARN' + stringDate + '%s\x1b[0m', ...args)
        },
        error: function (...args) {
            if(logLevelValue > 3) return
            console.error('\x1b[31mERROR' + stringDate + '%s\x1b[0m', ...args)
        },
        log: function(...args){
            console.log("LOG " + stringDate, ...args)
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