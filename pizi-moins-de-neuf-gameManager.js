const CardGame = require('./pizi-card-game');
const mongoose = require('mongoose');
const GameModel = require('./database/models/game');

const getGames = (callback) => {
    let games = {};
    if(mongoose.connection.readyState === 1){
        // Check for db
        GameModel.find({}, (err, gameModels) => {
            if(err) console.log(JSON.stringify(err));
            gameModels.forEach(game => {
                console.log(JSON.stringify(game));
                games[game.name] = game;
            });
            callback(games);
        });
    } else {
        callback(games);
    }
}

const saveGame = (game) => {
    if(mongoose.connection.readyState === 1&& game && game.name){
        GameModel.findOneAndUpdate({name: game.name}, game, {upsert: true}, oldValue => {});
    }
}

const createGame = (games, {name, authorized = 'All'}, force = false) => {
    if(!name) throw new Error("No name specified for game");
    if(games[name] && !force) throw new Error("Game already exist!");

    return games[name] = {
        name,
        authorized,
        players: [],
        playedCards: [],
        pickStack: CardGame.generateCards(),
        currentPlayer: null,
        action: null,
        turn: 0,
        quikPlay: false
    }
}

const endGame = (game, callingPlayer) => {
    let winners = {
        score: 100,
        names:[]
    };
    const scores = {};
    game.players.forEach(player => { 
        let score = player.hand.reduce((total, card) => total + Math.min(CardGame.getValue(card), 10), 0);
        if(score < winners.score){
            winners.score = score;
            winners.names = [player.name];
        } else if(score === winners.score){
            winners.names.push(player.name);
        }
        scores[player.name] = score;
    });

    game.players.forEach(player => { 
        // ***** Multiple cards *****
        CardGame.sort(player.hand);
        let score = scores[player.name] || 0;
        const isWinner = winners.names.includes(player.name);
        const isCaller = player.name === callingPlayer;

        if(isWinner){
            if(isCaller){
                player.scoreStreak++;
                if(player.scoreStreak > 2){
                    player.score = player.score - 50;
                    player.scoreStreak = 0;
                }
            }
        } else {
            // Get jokers
            let jokers = 0;
            while(player.hand[jokers].value === "*") jokers++;
            score = score * (jokers + 1);
            // 
            if(isCaller) score = score * 3;
            player.score += score;
        }

        player.ready = false;

        scores[player.name] = {
            score: player.score,
            scoreStreak: player.scoreStreak
        };
    });

    game.action = null;
    game.currentPlayer = null;

    return {scores, winners};
}

const quickPlay = (player, cards, game) => {
    if(game.turn === 0) return false;
    let nextIndex = game.players.indexOf(player) + 1;
    nextIndex = nextIndex < game.players.length ? nextIndex : 0;
    const nextPlayer = game.players[nextIndex];

    if(nextPlayer.name === game.currentPlayer && checkPlayedCards([...game.playedCards[game.playedCards.length - 1], ...cards])){
        return true;
    }

    return false;
}

const startGame = (game) => {
    // Random player order
    game.players = CardGame.shuffle(game.players);
    game.currentPlayer = game.players[0].name;
    game.action = "play";
    // Distribute
    game.pickStack = CardGame.generateCards();
    game.players.forEach(player => player.hand = game.pickStack.splice(0,7));
    game.playedCards = [game.pickStack.splice(0,1)];
}

const kickPlayer = (player, game, games) => {
    console.log("Kick " + player.name);
    game.pickStack.concat(player.hand);
    const index = game.players.indexOf(player);
    if(game.currentPlayer === player.name) game.currentPlayer = index + 1 < game.players.length ? game.players[index + 1].name : 0;
    if(index !== -1) game.players.splice(index, 1);

    if(game.players.length === 0 && games) createGame(games, {name: game.name}, true);
}

const contains = (card, cards) => {
    for(let i = 0; i < cards.length; i++){
        if(card.value === cards[i].value && card.color === cards[i].color) return true;
    }
    return false;
}

const updatePlayer = (newPlayerInfo, game = null)=> {
    if(!newPlayerInfo || !game) return;
    for(let i = 0; i < game.players.length; i++){
        let player = game.players[i];
        if(player.name === newPlayerInfo.name){
            Object.assign(player, newPlayerInfo);
            return player;
        } 
    }
}

const nextAction = (game)=> {
    switch(game.action){
        case "pick":
            for(let i = 0; i < game.players.length; i++){
                if(game.players[i].name === game.currentPlayer){
                    if(i + 1 < game.players.length ){
                        game.currentPlayer =  game.players[i + 1].name 
                        game.turn++;
                    } else {
                        game.currentPlayer = game.players[0].name;
                    } 
                    game.action = "play";
                    return;
                }
            }
            console.log("Error: an action should happen!");
        break;

        case "play":
            game.action = "pick";
        break;

        default:
            game.action = "play";
    }
}

const getPublicGames = (games) => Object.keys(games).map(name => {
    const gameInfo = getPublicGameInfo(games[name]);
    return {
        name,
        players: gameInfo.players,
        action: gameInfo.action
    }
})

const getPublicGameInfo = (game, gameFinished = false)=> {
    // Remove cards from data
    let players = game.players.map( player => {
        return {
            id: player.id,
            name: player.name,
            cardNumber: player.hand.length,
            score: player.score,
            scoreStreak: player.scoreStreak,
            ready: player.ready,
            hand: gameFinished ? player.hand : [],
            turn: game.turn,
            quikPlay: game.quikPlay
        }
    });

    // Return 2 last hands if player is picking
    let playedCards = [];
    if(game.action === "pick" && game.playedCards.length > 1){
        playedCards.push(game.playedCards[game.playedCards.length - 2]);
        playedCards.push(game.playedCards[game.playedCards.length - 1]);
    } else if(game.playedCards.length > 0){
        playedCards.push(game.playedCards[game.playedCards.length - 1]);
    }
  
    return {
        name: game.name,
        players,
        playedCards,
        currentPlayer: game.currentPlayer,
        action: game.action,
        scores: gameFinished ? null : game.score
    }
};

const checkPlayedCards = (originalcards) => {
    const cards = [...originalcards];

    // ***** No cards *****
    if(!cards || !cards.length) return false;
    
    // ***** One card *****
    if(cards.length === 1) return true;
        
    // ***** Multiple cards *****
    CardGame.sort(cards);

    // Get jokers
    let jokers = 0;
    while(cards[jokers].value === "*") jokers++;
    // Extract jokers
    cards.splice(0, jokers);

    if(!cards.length || cards.length === 1) return true;

    if(cards[0].value === cards[1].value){
        for(let i = 2; i < cards.length; i++){
            if(cards[i].value !== cards[0].value) return false;
        }
        return true;

    } else if(originalcards.length > 2){
        // Change As value if needed (only one 1 could be there)
        if(CardGame.getValue(cards[0]) === 1 && CardGame.getValue(cards[1]) > 4){
            cards[0].value === "14";
            CardGame.sort(cards);
        }

        // Fluch
        for(let i = 1; i < cards.length; i++){
            // Check value order
            const card1Value = CardGame.getValue(cards[i - 1]);
            const card2Value = CardGame.getValue(cards[i]);
            const diff = card2Value - card1Value;

            // Check color
            if(cards[i - 1].color !== cards[i].color) return false;

            // Logic order
            if(diff === 1) continue;

            // Use joker
            jokers = jokers - (diff - 1);
            if(jokers < 0) return false;
        }
        return true;
    }
    return false;
};

module.exports = {
    getGames,
    saveGame,
    createGame,
    endGame,
    quickPlay,
    startGame,
    kickPlayer,
    contains,
    updatePlayer,
    nextAction,
    getPublicGames,
    getPublicGameInfo,
    checkPlayedCards
}