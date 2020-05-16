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

const removeGame = (game) => {
    if(mongoose.connection.readyState === 1 && game && game.name){
        GameModel.findOneAndDelete({name: game.name}, oldValue => {});
    }
}

const createGame = (games, gameData = {name}, force = false) => {
    if(!gameData.name) {
        console.error("No name specified for game");
        return;
    }
    if(games[gameData.name] && !force){
        console.error("Game already exist!");
        return;
    }

    /*
    name: "",
    minPlayer: 3,
    maxPlayer: 6,
    allowQuickPlay: true,
    allowStreak: true,
    onlyOneWinnerStreak: false,
    bonusMultiple50: false,
    playerKickTimeout: "5min",
    gameKickTimeout: "5min",
    gameEndScore: 200
    */

    return games[gameData.name] = {
        lastTime: (new Date()).getTime(),
        name: gameData.name,
        authorized: gameData.authorized,
        players: [],
        playedCards: [],
        pickStack: CardGame.generateCards(),
        currentPlayer: null,
        action: null,
        turn: 0,
        quikPlay: false,
        conf: gameData
    }
}

const endRound = (game, callingPlayer) => {
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
    game.playedCards = [];

    game.players.forEach(player => { 
        // ***** Multiple cards *****
        CardGame.sort(player.hand);
        let score = 0;
        const isWinner = winners.names.includes(player.name);
        const isCaller = player.name === callingPlayer;
        let scoreStreak = 0;
        let handScore = scores[player.name] || 0;

        if(isWinner){
            score = 0;
            if(isCaller && game.conf.allowStreak && (!game.conf.onlyOneWinnerStreak || game.conf.onlyOneWinnerStreak && winners.names.length === 1)){
                player.scoreStreak++;
                scoreStreak = 1;
                if(player.scoreStreak > 2){
                    player.score = player.score - 50;
                    player.scoreStreak = 0;
                }
            }
        } else {
            // Get jokers
            let jokers = 0;
            while(player.hand[jokers].value === "*") jokers++;
            score = handScore * (jokers + 1);
            if(isCaller) score = score * 3;
            if(game.conf.bonusMultiple50 && score % 50 === 0) score = score - 50;
            player.score += score;

        }

        player.ready = false;

        scores[player.name] = {
            handScore,
            score,
            scoreStreak,
            hand: player.hand
        };

        player.hand = [];
    });

    game.action = null;
    game.currentPlayer = null;

    // End game
    game.players.forEach(player => {
        if(player.score >= game.conf.gameEndScore){
            game.endGame = {players: game.players.sort((first, second) => {
                if(first.score < second.score) return -1;
                if(first.score > second.score) return 1;
                if(first.score === second.score) {
                    if(first.scoreStreak < second.scoreStreak) return 1;
                    if(first.scoreStreak > second.scoreStreak) return -1;
                    return 0;
                }
            })};
            game.players.forEach(p => {
                p.score = 0;
                p.scoreStreak = 0;
            });
            return;
        }
    });

    return {scores, winners, announcer: callingPlayer};
}

const nextPlayer = (game) => {
    let currentPlayer = game.players.filter(player => player.name === game.currentPlayer)[0];
    let nextIndex = game.players.indexOf(currentPlayer) + 1;
    nextIndex = nextIndex < game.players.length ? nextIndex : 0;
    return game.players[nextIndex];
}

const previousPlayer = (game) => {
    let currentPlayer = game.players.filter(player => player.name === game.currentPlayer)[0];
    let previousIndex = game.players.indexOf(currentPlayer) - 1;
    previousIndex = previousIndex < 0 ? game.players.length - 1 : previousIndex;
    return game.players[previousIndex];
}

const quickPlay = (player, cards, game) => {
    if(!game.conf.allowQuickPlay || game.turn === 0 || cards.length > 1) return false;

    const isLastCard = player.hand[player.hand.length - 1].value === cards[0].value &&  player.hand[player.hand.length - 1].color === cards[0].color;

    if(isLastCard && previousPlayer(game).name === player.name && checkPlayedCards([...game.playedCards[game.playedCards.length - 1], ...cards])){
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
    if(!player) return;
    console.log("Kick " + player.name);
    game.pickStack.concat(player.hand);
    const index = game.players.indexOf(player);
    if(game.currentPlayer === player.name) game.currentPlayer = index + 1 < game.players.length ? game.players[index + 1].name : 0;
    if(index !== -1) game.players.splice(index, 1);

    if(game.players.length === 0 && games) createGame(games, game.conf, true);
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

const getPublicGames = (games) => {
    // Clean games
    let i = Object.keys(games).length;
    while(i--){
        let game = games[Object.keys(games)[i]];
        game.lastTime = game.lastTime || 0;
        if(game.conf.gameKickTimeout !== "Jamais" && (((new Date()).getTime() - game.lastTime) >  valueToMillisecond(game.conf.gameKickTimeout))){
            removeGame(game);
            console.info('Delete game: ' + game.name + ' after ' + Math.round(((new Date()).getTime() - game.lastTime) / 1000) + "s");
            delete games[Object.keys(games)[i]];
            
        }
    } 

    return Object.keys(games).map(name => {
        const gameInfo = getPublicGameInfo(games[name]);
        return {
            name,
            players: gameInfo.players,
            action: gameInfo.action,
            conf: gameInfo.conf
        }
    })
}

const getPublicGameInfo = (game, gameFinished = false, setTime = false)=> {
    if(setTime) game.lastTime = (new Date()).getTime();
    // Remove cards from data
    let players = game.players.map( player => {
        return {
            id: player.id,
            name: player.name,
            cardNumber: player.hand.length,
            score: player.score,
            scoreStreak: player.scoreStreak,
            ready: player.ready,
            hand: [],
            turn: game.turn
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
        scores: gameFinished ? null : game.score,
        quickPlay: game.quickPlay,
        conf: game.conf,
        endGame: game.endGame
    }
};

const checkPlayedCards = (originalcards) => {
    const cards = originalcards.map((card) => {return {...card}});

    // ***** No cards *****
    if(!cards || !cards.length) return false;
    
    // ***** One card *****
    if(cards.length === 1) return true;
        
    // ***** Multiple cards *****
    CardGame.sort(cards);

    // Get jokers
    let jokers = 0;
    while(cards[jokers] && cards[jokers].value === "*") jokers++;
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
            cards[0].value = "14";
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


const valueToMillisecond = (value) => {
    switch(value){
        case "30s":
            return 30 * 1000;
        case "1min":
            return 60 * 1000;
        case "2min":
            return 2 * 60 * 1000;
        case "5min":
            return 5 * 60 * 1000;
        case "10min":
            return 10 * 60 * 1000;
        case "30min":
            return 30 * 60 * 1000;
    }
}

module.exports = {
    getGames,
    saveGame,
    createGame,
    endRound,
    quickPlay,
    startGame,
    kickPlayer,
    contains,
    updatePlayer,
    nextAction,
    getPublicGames,
    getPublicGameInfo,
    checkPlayedCards,
    removeGame
}