

const SERVICES = new Map()

module.exports = {

    register(service){
        if(!service.name) return
        SERVICES.set(service.name, service)
    },

    unregister(serviceName){
        getService(serviceName).stop()
        SERVICES.delete(service.name)
    },

    startAll(){
        SERVICES.forEach(service => {
            service.start()
        })
    },

    stopAll(){
        SERVICES.forEach(service => {
            service.stop()
        })
    },

    get(serviceName){
        return SERVICES.get(serviceName)
    },

    getServices(){
        return Array.from(SERVICES.values())
    }
}