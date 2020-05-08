const mongoose = require('mongoose');

const GameSchema = new mongoose.Schema({
    name: String,
    players: Array,
    playedCards: Array,
    pickStack: Array,
    currentPlayer: String,
    action: String,
    turn: Number,
    quikPlay: Boolean
});

module.exports = mongoose.model('Game', GameSchema);