"use strict"
const express = require('express')

/* ERRORS */
const NotAuthorizedError = new Error("You are not authorized to proceed this operation!")
const EmailError = new Error("Cannot sent email!")

/**
 * pizi-email module
 * express middleware used to send email
 * @param config: the options to use
 * @param console: the console object
 * @returns: the express middleware
 */
module.exports = ({config, console, serverLibs = {}}) => express.Router().post('/sendEmail', (req, res) => {
    const email = serverLibs.email()
    if(email && config){
        if(!req.user){
            res.status(500).json({message: NotAuthorizedError.message})
            console.log("Unauthorized call to email!")
            return
        }
        email.sendMail({
            from: 'pizi-server@no-reply.com',
            to: req.body.email,
            subject: req.body.subject,
            html: req.body.html
        }, (err, result) => {
            if(err){
                res.status(500).json({message: EmailError.message})
                console.log(err)
            } else {
                email.close()
                res.json({ message: 'email sent!'})
            }
        })
    } else {
        res.status(500).json({message: EmailError.message})
        console.log(EmailError.message)
    }
})