const nodemailer = require('nodemailer')
const {google} = require('googleapis')
const config = require('../../config.json')
const serverLibs = require('./default-server-libs.js')

const console = serverLibs.logger.getLogger()

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

module.exports = {
    ...serverLibs,
    email: (!email || config.email.printToConsole) ? serverLibs.email : email
}