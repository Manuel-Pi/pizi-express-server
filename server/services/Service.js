const path = require('path')
const fs = require('fs')

module.exports = class Service {

    static SERVICE_ROOT_PATH = path.join(__dirname, "configs")
    static DEFAULT_CONFIG = {activate: false}

    constructor(name = ""){
        if(!name) throw new Error("Service need a name")
        this.name = name
        this.configPath = path.join(Service.SERVICE_ROOT_PATH, this.name.toLowerCase() + "-service.json")
        this.config = this.loadConfig()
        this.status = ""
    }

    start(){

        this.config = this.loadConfig()
    }

    stop(){

    }

    restart(){
        stop()
        start()
    }

    loadConfig(){
        let config = this.constructor.DEFAULT_CONFIG
        if(!fs.existsSync(Service.SERVICE_ROOT_PATH)) fs.mkdirSync(Service.SERVICE_ROOT_PATH, { recursive: true })
        if(fs.existsSync(this.configPath)) config = {...config, ...JSON.parse(fs.readFileSync(this.configPath))}
        else this.saveConfig()
        return config
    }

    saveConfig(){
        fs.writeFileSync(this.configPath, JSON.stringify(this.config || this.constructor.DEFAULT_CONFIG, null, 4), { flag: 'w' })
    }
}