let LOG_LEVEL = null;
let LOG_PREFIX = "";
let LOG_OPTIONS = {};

module.exports = {
    getLogger(prefix, options){

        // Get options
        let logLevel, logLevelValue;
        if(typeof options === "object"){
            LOG_OPTIONS = options;
        } else if(typeof options === "string"){
            LOG_OPTIONS.server = options;
        }

        logLevel = LOG_OPTIONS[prefix] || LOG_OPTIONS[prefix] === 0 ? LOG_OPTIONS[prefix] : LOG_OPTIONS.server;

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

        // Set default LOG_LEVEL
        if(!LOG_LEVEL && LOG_LEVEL !== 0 || (options && options.default)) LOG_LEVEL = logLevelValue;

        // Create log prefix
        if(prefix) LOG_PREFIX = prefix;
        let stringDate = LOG_PREFIX ? " " + prefix : "";
        stringDate += " [" + new Intl.DateTimeFormat('en-US', {
            year: 'numeric', month: 'numeric', day: 'numeric',
            hour: 'numeric', minute: 'numeric', second: 'numeric',
            hour12: false,
            timeZone: 'America/Los_Angeles' 
        }).format(new Date()) + "]: ";

        
        return {
            debug: function(text){
                if(logLevelValue > 0) return;
                console.debug('\x1b[37mDEBUG' + stringDate + '%s\x1b[0m', text);
            },
            info: function (text) {
                if(logLevelValue > 1) return;
                console.info('\x1b[36mINFO' + stringDate + '%s\x1b[0m', text);
            },
            warn: function (text) {
                if(logLevelValue > 2) return;
                console.warn('\x1b[33mWARN' + stringDate + '%s\x1b[0m', text);
            },
            error: function (text) {
                if(logLevelValue > 3) return;
                console.error('\x1b[31mERROR' + stringDate + '%s\x1b[0m', text);
            },
            log: function(text){
                console.log("LOG " + stringDate + text);
            }
        }
    }
}