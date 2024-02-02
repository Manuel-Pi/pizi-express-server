import { z } from "zod"

const STRING        = z.string()
const STRING_NUMBER = z.string().regex(/^\d+$/)
const STRING_ARRAY  = z.string().regex(/^\[(["'][^'"]*['"][\,]?[\s]?)+\]$/)
const STRING_PORT   = STRING.regex(/^([1-9][0-9]{0,3}|[1-5][0-9]{4}|6[0-4][0-9]{3}|65[0-4][0-9]{2}|655[0-2][0-9]|6553[0-5])$/)

// Env vars definitions
const ENV_VAR_MODEL = z.object({
    PORT:                   STRING_PORT,
    ROOT:                   STRING,
    APPS_DIR:               STRING,
    WEB_APP_DIR:            STRING,
    HTTPS_CERTIFICATES_DIR: STRING,
    PASSWORD_SALT_ROUNDS:   STRING_NUMBER,
    // Super Admin
    SUPER_ADMIN_ROLE:       STRING,
    SUPER_ADMIN_USERNAME:   STRING,
    SUPER_ADMIN_PASSWORD:   STRING,
    SUPER_ADMIN_EMAIL:      STRING.email(),
    // CORS
    CORS_ALLOWED_URIS:                  STRING_ARRAY,
    // Mongo
    MONGO_URL:              STRING,
    MONGO_DB_NAME:          STRING,
    // OAuth
    OAUTH_LOGIN_URL:        STRING,
    OAUTH_CLIENT_ID:        STRING,
    OAUTH_CLIENT_SECRET:    STRING,
    OAUTH_ACCESS_TOKEN_LIFETIME:        STRING_NUMBER,
    OAUTH_REFRESH_TOKEN_LIFETIME:       STRING_NUMBER,
    OAUTH_AUTHORIZATION_CODE_LIFETIME:  STRING_NUMBER,
    OAUTH_REDIRECT_URIS:                STRING_ARRAY,
    OAUTH_REDIRECT_GRANTS:              STRING_ARRAY,
    OAUTH_COOKIE_ENCRYPTION_KEY:        STRING
})

export function checkEnvVars(){
    try{
        ENV_VAR_MODEL.parse(process.env)
    } catch(e: any){
        if(e instanceof z.ZodError) throw new Error(`invalid env vars: ${e.errors.map( error => `\n"${error.path}" (${error.message})`)}`)
        else throw e
    }
}

// Declare types 
type ENV_VAR = z.infer<typeof ENV_VAR_MODEL>
declare global {
    namespace NodeJS {
      interface ProcessEnv extends ENV_VAR {}
    }
}