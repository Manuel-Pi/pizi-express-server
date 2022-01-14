const mongoose = require('mongoose')

// Connect to db
const dbUrl = process.env.MONGODB_URI_ATLAS_MDN || process.env.MONGODB_URI_ATLAS || process.env.MONGODB_URI || config.db
mongoose.connect(dbUrl).catch(error => {
    console.error('Database connection error!')
    console.debug(error)
    setServerState({db:  "error"})
})
const db = mongoose.connection;
db.on('error', e => {
    console.error('Database connection error!')
    console.debug(e)
    setServerState({db:  "error"})
})
db.once('open', () => {
    console.info('Database successfully connected!')
    const admin = new mongoose.mongo.Admin(mongoose.connection.db)
    admin.buildInfo((err, info) => {
        setServerState({dbVersion: info.version})
    })
    setServerState({db:  "connected"})
})