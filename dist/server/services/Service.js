"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Service = exports.SERVICE_DEFAULT_CONFIG = void 0;
exports.SERVICE_DEFAULT_CONFIG = {
    name: 'default',
    enabled: false
};
class Service {
    constructor(serviceName) {
        this.name = serviceName;
        this.status = "instanciated";
        console.log(this.name + " " + this.status);
    }
    start(config) {
        console.debug("...starting service: " + this.name);
        this.config = Object.assign({}, config);
        if (config.enabled) {
            this.status = "active";
        }
        else
            this.status = "disabled";
    }
    stop() {
        this.status = "stopped";
    }
    restart(conf) {
        this.stop();
        this.start(conf);
    }
}
exports.Service = Service;
//# sourceMappingURL=Service.js.map