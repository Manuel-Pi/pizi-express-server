const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    id: Number,
    name: String,
});

module.exports = mongoose.model('Game', GameSchema);