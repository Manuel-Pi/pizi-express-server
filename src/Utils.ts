import HTTP_ERRORS from "http-errors"
import { ZodError } from "zod"
import crypto from "crypto"
import migrate from "migrate"
import { logger } from "./core/loggers.js"
import DBMigrationDbAdapter from "./adapters/mongo/DBMigrationDbAdapter.js"
import { DBMigration } from "./core/models/DBMigration.js"


export const HttpErrors = HTTP_ERRORS

export function formatZodError(error: ZodError){
    const errors = error.errors.map( (error: any) => {
        return `${error.message.toLowerCase()} '${error.path.join(",")}': expected ${error.expected} but received '${error.received}'`
    })
    return `[${errors.join(",")}]`
}

const algorithm = 'aes-256-cbc' //Using AES encryption

const key = Buffer.from(process.env.OAUTH_COOKIE_ENCRYPTION_KEY,'utf8')

export function encrypt(text: string) {
    const iv = crypto.randomBytes(12).toString('base64')
    const cipher = crypto.createCipheriv(algorithm, key, iv)
    let encrypted = cipher.update(text)
    encrypted = Buffer.concat([encrypted, cipher.final()])
    return `${encrypted.toString('hex')}:${iv}`
}

export function decrypt(text: string) {
    const [encrypted, iv] = text.split(":")
    const decipher = crypto.createDecipheriv(algorithm, key, iv)
    let decrypted = decipher.update(Buffer.from(encrypted, 'hex'))
    decrypted = Buffer.concat([decrypted, decipher.final()])
    return decrypted.toString()
}

export function runMigrations(migrationsDir = process.env.MIGRATIONS_DIR){

    function error(e: Error, reject: (reason?: any) => void){
        logger.error(`error on migration: ${e.message}`)
        reject(e)
    }

    return new Promise<void>((resolve, reject) => {
        try{
            (migrate as any).load({
                migrationsDirectory: "./server/adapters/mongo/migrations",
                filterFunction: (migration: any) => !migration.includes(".js.map"),
                stateStore: {
                    async load(callback: any){
                        const [lastMigration] = await DBMigrationDbAdapter.find({})
                        if(!lastMigration) logger.warn("cannot find previous migration")
                        return callback(null, lastMigration || {} as any)
                    },
                    async save(set: any, callback: any){
                        try{
                            const [lastMigration] = await DBMigrationDbAdapter.find({})
                            const migration = new DBMigration({
                                lastRun: set.lastRun!,
                                migrations: set.migrations
                            })
                            await DBMigrationDbAdapter.save(migration)
                            // Delete previous entry
                            if(lastMigration) await DBMigrationDbAdapter.delete(lastMigration.id)
                        } catch(e){
                            return callback(e)
                        }
                        return callback(null)
                    }
                }
            }, (e: any, set: any) => {
                if(e) return error(e, reject)
                set.up((e: any) => {
                    if(e) return error(e, reject)
                    logger.info('migrations successfully ran')
                    resolve()
                })
            })
        } catch(e){
            error(e, reject)
        }
    })
}

export function generateRandomString(length: number) {
    let text = ""
    const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
    for (var i = 0; i < length; i++) text += possible.charAt(Math.floor(Math.random() * possible.length))
    return text
}