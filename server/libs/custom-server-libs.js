const nodemailer = require('nodemailer')
const {google} = require('googleapis')
const config = require('../../config.json')
const serverLibs = require('./default-server-libs.js')
const GmailOauth = require('./gmailOauth.js')
const { listenerCount } = require('../database/models/game')

const console = serverLibs.logger.getLogger()

let email

try{
    const auth = process.env.EMAIL_USER ? {
            emailUser: process.env.EMAIL_USER,
            emailClientID: process.env.EMAIL_CLIENT_ID,
            emailClientSecret: process.env.EMAIL_CLIENT_SECRET,
            emailRefreshToken: process.env.EMAIL_REFRESH_TOKEN,
            emailService: process.env.EMAIL_SERVICE,
            emailRedirectUris: process.env.EMAIL_REDIRECT_URIS
    } : require("../../" + config.email.auth.json)
    
    GmailOauth.getAuth(auth.emailClientID, auth.emailClientSecret, auth.emailRedirectUris, gAuth => {
        email = nodemailer.createTransport({
            service: auth.emailService,
            auth: {
                type: config.email.auth.type,
                user: auth.emailUser,
                clientId: auth.emailClientID,
                clientSecret: auth.emailClientSecret,
                refreshToken: auth.emailRefreshToken
            }
        })
    })
} catch(err){
    console.error("Cannot configure email transport!", err.message)
}

module.exports = {
    ...serverLibs,
    email(){
        return (config.email.printToConsole || !email) ? serverLibs.email : email
    }
}