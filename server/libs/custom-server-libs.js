const nodemailer = require('nodemailer')
const {google} = require('googleapis')
const config = require('../../config.json')
const serverLibs = require('./default-server-libs.js')
const GmailOauth = require('./gmailOauth.js')

const console = serverLibs.logger.getLogger()

let email
try{
    GmailOauth.getConnectionData(connectionData => email = nodemailer.createTransport(connectionData))
} catch(err){
    console.error("Cannot configure email transport!", err.message)
}

module.exports = {
    ...serverLibs,
    email(){
        return (config.email.printToConsole || !email) ? serverLibs.email : email
    }
}