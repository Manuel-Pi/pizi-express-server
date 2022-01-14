const nodemailer = require('nodemailer')
const {google} = require('googleapis')
const config = require('../../config.json')
const Logger = require('./logger.js')

const console = new Logger()

const email = (() => {
    try{
        const auth = require("../../" + config.email.auth.json)
        const OAuth2Client = new google.auth.OAuth2(auth.emailClientID, auth.emailClientSecret)
        OAuth2Client.setCredentials({ refresh_token: auth.emailRefreshToken })
        return nodemailer.createTransport({
                                            service: auth.emailService,
                                            auth: {
                                                type: config.email.auth.type,
                                                user: auth.emailUser,
                                                clientId: auth.emailClientID,
                                                clientSecret: auth.emailClientSecret,
                                                refreshToken: auth.emailRefreshToken,
                                                accessToken: OAuth2Client.getAccessToken().catch(error => {
                                                    console.error("Cannot get auth for email service:", error.message)
                                                })
                                            }
                                        })
    } catch(err){
        console.error("Cannot configure email transport!", err.message)
    }
})()

module.exports = (!email || config.email.printToConsole) ? {
    sendMail(emailObject, callback){
        logger.info("[email to console] => " + JSON.stringify(emailObject))
        callback(null, {})
    },
    close(){}
} : email