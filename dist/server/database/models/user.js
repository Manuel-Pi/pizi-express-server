const mongoose = require('mongoose');
var UserSchema = new mongoose.Schema({
    id: Number,
    login: String,
    password: String,
    email: String
});
module.exports = mongoose.model('User', UserSchema);
//# sourceMappingURL=user.js.map