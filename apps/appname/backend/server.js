var mongoose = require('mongoose');
module.exports = (socketServer) => {
    // Get io for a specific namespace
    const io = socketServer.of('/appname');

    // Init game from DB
    mongoose.connection.once('open', () => {
        console.info("Database connected!")
    });

    io.on('connection', socket => {
        /*************** CONNECTIONS *****************/
        console.debug("Client connected to socket");
    });
}