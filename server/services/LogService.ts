import { IServiceConfig, Service } from "./Service"
import Logger from "../libs/logger"
import path from "path"
import fs from "fs"
import Tail from "tail"

export interface ILogServiceConfig extends IServiceConfig{
    name: string
    loggers: {[loggerName: string]: {
        level: number,
        console: boolean,
        file: string
    }}
}

const TAIL_FILES: {[loggerName: string]: Tail} = {}
const LOG_FILES: {[loggerName: string]: Tail} = {}

export class LogService extends Service<ILogServiceConfig>{
    
    constructor(config){
        super("Log")
    }

    start(config){
        super.start(config)

        Logger.setConfig(this.config)

        // create files
        Object.keys(this.config.loggers).forEach(loggerName => {
            const loggerConfig = this.config.loggers[loggerName]
            if(loggerConfig.file && this.config.enabled !== false){
                let filePath = path.join(__dirname, "../../logs", loggerConfig.file)
                // Create files
                if(!fs.existsSync(path.dirname(filePath))) fs.mkdirSync(path.dirname(filePath), { recursive: true })
                if(!LOG_FILES[loggerName]) LOG_FILES[loggerName] = fs.createWriteStream(filePath, {flags : 'a'})
            }
        })

        // listen files
    }
}