const fs = require('fs')
const {google} = require('googleapis')

const SCOPES = ["https://mail.google.com/"]
const TOKEN_PATH = 'token.json'
let TOKEN = null
const CREDENTIALS = process.env.EMAIL_USER ? {
    emailUser: process.env.EMAIL_USER,
    emailClientID: process.env.EMAIL_CLIENT_ID,
    emailClientSecret: process.env.EMAIL_CLIENT_SECRET,
    emailRedirectUris: process.env.EMAIL_REDIRECT_URIS
} : require("../../../data/gmail.json")

const oAuth2Client = new google.auth.OAuth2(CREDENTIALS.emailClientID, CREDENTIALS.emailClientSecret, CREDENTIALS.emailRedirectUris)

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(callback = () => null) {
    if(TOKEN){
        oAuth2Client.setCredentials(TOKEN)
        callback(oAuth2Client)
    } else {
        // Check if we have previously stored a token.
        fs.readFile(TOKEN_PATH, (err, token) => {
            if(err) return getNewToken(oAuth2Client, callback)
            TOKEN = token
            oAuth2Client.setCredentials(JSON.parse(token))
            callback(oAuth2Client)
        })
    }
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getNewToken(oAuth2Client) {
    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
    })
    console.log('Authorize this app by visiting this url:', authUrl)
}

module.exports = {
    getConnectionData(callback){
        authorize(oAuth2Client => callback({
            service: "Gmail",
            auth: {
                type: "OAuth2",
                user: CREDENTIALS.emailUser,
                clientId: CREDENTIALS.emailClientID,
                clientSecret: CREDENTIALS.emailClientSecret,
                refreshToken: oAuth2Client.credentials.refresh_token
            }
        }))
    },
    getToken(code){
        oAuth2Client.getToken(code, (err, token) => {
            if(err) return console.error('Error retrieving access token', err)
            oAuth2Client.setCredentials(token)
            TOKEN = token
            // Store the token to disk for later program executions
            fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
                if (err) return console.error(err)
                console.log('Token stored to', TOKEN_PATH)
            })
        })
    }
}