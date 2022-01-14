import { LogService } from "./LogService"
import { ServiceManager } from "./ServiceManager"

ServiceManager.register(new LogService(null))

ServiceManager.startAll()