/* eslint-disable no-undef */

import { MongoMemoryServer } from 'mongodb-memory-server'
import dotenv from 'dotenv'
import path from 'path'

const rootDir = "/Users/pizi/Development/Pizi/pizi-express-server"
dotenv.config({ path: path.join(rootDir, "/configs/tests/pizi-server/.env") })


declare global {
    var __MONGO_INSTANCE: any
    var __MONGO_URI: any
}

export default async () => {
    const dbName = "test-db"
    const instance = await MongoMemoryServer.create({
        instance: {
            port: parseInt(process.env.MONGO_PORT!),
            dbName: process.env.MONGO_DB_NAME
        }
    })
    global.__MONGO_INSTANCE = instance
    global.__MONGO_URI= instance.getUri() + dbName
}