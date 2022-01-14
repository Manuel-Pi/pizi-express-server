var mongoose = require("mongoose");
module.exports = ({ socketServer: e, console: o }) => { const n = e.of("/pizi-server"); mongoose.connection.once("open", (() => { o.debug("Database connected!"); })), n.on("connection", (e => { o.debug("Client connected to server"); })); };
//# sourceMappingURL=server.js.map