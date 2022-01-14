import path from 'path'
import fs from 'fs'
import { IServiceConfig, Service } from './Service'

interface IServiceManager {
    getConfigPath: (service: Service) => string
    loadConfig: (service: Service) => void
    saveConfig: (config: IServiceConfig, service: Service) => void
    register: (service: Service) => void
    unregister: (serviceName: string) => void
    startAll: () => void
    stopAll: (serviceName: string) => void
    getService: (serviceName) => Service
    getServices: (serviceName) => Service[]
}

const SERVICES = new Map()
const SERVICE_ROOT_PATH = path.join(__dirname, "services")
const SERVICE_CONFIG_PATH = path.join(SERVICE_ROOT_PATH, "confs")

export const ServiceManager: IServiceManager = {

    register(service){
        if(!service.name) return
        SERVICES.set(service.name, service)
        service.status = "registered"
    },

    unregister(serviceName){
        const service = this.getService(serviceName)
        service.stop()
        service.status = "unregistered"
        SERVICES.delete(serviceName)
    },

    getConfigPath(service){
        return path.join(SERVICE_CONFIG_PATH, service.name.toLowerCase() + "-service.json")
    },

    loadConfig(service){
        let config: IServiceConfig = null
        if(!fs.existsSync(SERVICE_CONFIG_PATH)) fs.mkdirSync(SERVICE_CONFIG_PATH, { recursive: true })
        const configPath = this.getConfigPath(service)
        if(fs.existsSync(configPath)) config = JSON.parse(fs.readFileSync(configPath, 'utf8'))
        console.debug(service.name + "Service config: " + JSON.stringify(config))
        return config
    },

    saveConfig(config, service){
        const configPath = this.getConfigPath(service)
        fs.writeFileSync(configPath, JSON.stringify(config || this.constructor.DEFAULT_CONFIG, null, 4), { flag: 'w' })
    },

    startAll(){
        SERVICES.forEach(service => {
            try{
                const config = this.loadConfig(service)
                service.start(config)
                console.debug(service.status)
            } catch(e){
                service.status = "error"
                console.debug("cannot start service: " + service.name)
                console.debug(e)
            }
        })
    },

    stopAll(){
        SERVICES.forEach(service => {
            service.stop()
        })
    },

    getService(serviceName){
        return SERVICES.get(serviceName)
    },

    getServices(){
        return Array.from(SERVICES.values())
    }
}