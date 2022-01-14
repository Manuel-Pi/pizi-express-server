"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const LogService_1 = require("./LogService");
const ServiceManager_1 = require("./ServiceManager");
ServiceManager_1.ServiceManager.register(new LogService_1.LogService(null));
ServiceManager_1.ServiceManager.startAll();
//# sourceMappingURL=test.js.map