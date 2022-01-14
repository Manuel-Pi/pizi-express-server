import path from 'path'

export interface IServiceConfig {
    name: string,
    enabled: boolean
}

export const SERVICE_DEFAULT_CONFIG: IServiceConfig = {
    name: 'default',
    enabled: false
}

export interface IService {
    start: (conf?: IServiceConfig) => void
    stop: () => void
    restart: (conf?: IServiceConfig) => void
}

export abstract class Service<T extends IServiceConfig = IServiceConfig> implements IService{
    protected config: T
    public name: string
    public status: string

    constructor(serviceName: string){
        this.name = serviceName
        this.status = "instanciated"
        console.log(this.name + " " + this.status)
    }

    start(config){
        console.debug("...starting service: " + this.name)
        this.config = {...config}
        if(config.enabled){
            this.status = "active"
        } else this.status = "disabled"
    }

    stop(){
        this.status = "stopped"
    }

    restart(conf){
        this.stop()
        this.start(conf)
    }
}