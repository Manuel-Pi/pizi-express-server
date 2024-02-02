import HTTP_ERRORS from "http-errors"
import { ZodError } from "zod"
import crypto from "crypto"

export function YamlToJson(yamlPath: string){

    return {}
}


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