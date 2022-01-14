const Service = require('./Service.js')
const path = require('path')
const fs = require('fs')
const Tail = require('tail').Tail
const Logger = require('./logger.js')

module.exports = class LogService extends Service {

    /* Default config */
    static DEFAULT_CONFIG = {
        ...Service.DEFAULT_CONFIG, 
        console: true,
        loggers: {}
    }

    /* Tailed files */
    static TAIL_FILES = {}

    constructor(){
        super("Log")
        this.consoleLogLevel = LogService.getLogLevelValue(this.config.console)
    }

    start(){
        super.start()
        Logger.setConfig(this.config)
        Object.keys(this.config.loggers).forEach(loggerName => {
            const logger = this.config.loggers[loggerName]
            if(logger.file && this.config.activate !== false){
                let filePath = path.join(__dirname, "../../logs", logger.file)
                // Create files
                if(!fs.existsSync(path.dirname(filePath))) fs.mkdirSync(path.dirname(filePath), { recursive: true })
                if(!LogService.LOG_FILES[loggerName]) LogService.LOG_FILES[loggerName] = fs.createWriteStream(filePath, {flags : 'a'})
                this.logFile = LogService.LOG_FILES[loggerName]
                // Tail files
                this.logFile.on('open', () => {
                    LogService.TAIL_FILES[loggerName] = new Tail(filePath, "\n", {}, true)
                    LogService.TAIL_FILES[loggerName].on("line", line => {
                        //console.log("test: " + line)
                    })
                })
            }
        })
    }

    stop(){
        super.stop()
        Object.keys(this.config.loggers).forEach(loggerName => {
            LogService.TAIL_FILES[loggerName].unwatch()
        })
    }

    getLogger(name = ""){
        return Logger.getLogger(name)
    }

}