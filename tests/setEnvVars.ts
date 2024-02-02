import dotenv from 'dotenv'
import path from 'path'
import { checkEnvVars } from '../src/core/envVars.js'

const rootDir = "/Users/pizi/Development/Pizi/pizi-express-server"
dotenv.config({ path: path.join(rootDir, "/configs/tests/pizi-server/.env") })
checkEnvVars()