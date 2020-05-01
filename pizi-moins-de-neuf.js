var cardGame = require('./pizi-card-game.js');

module.exports = function(server){

    // Get io for a specific namespace
    const io = require('socket.io')(server).of('/pizi-moins-de-neuf');

    
    let CONNEXION_ON = true;
    let PLAYERS = {};
    let GAMES = {};
    let KICKABLE_PLAYERS = {};

    // On connection
    io.on('connection', function (socket) {

        socket.on('login', name => {
            if(socket.player) return;

            PLAYERS[name] = {
                id: socket.id,
                name,
            };
            
            socket.player = name;
            console.log('Connexion of : ' + name);

            if(name === "pizi"){
                createGame(GAMES, {
                    name: "Les Potos"
                }, true);
            } 

            socket.emit('setGames', getPublicGames(GAMES));
        });

        socket.on('join', gameName => {
            let game = GAMES[gameName];
            let player = PLAYERS[socket.player];
            if(!game || !player || updatePlayer(player, game) || game.action) return;

            socket.game = gameName;
            game.players.push({
                ...player,
                score: 0,
                scoreStreak: 0,
                hand: [],
                ready: false
            });

            game.players.forEach(player => io.sockets[player.id].emit('gameInfo', getPublicGameInfo(game)));
            io.emit('setGames', getPublicGames(GAMES));
        });

        socket.on('isReady', data => {
            let game = GAMES[socket.game];
            let player = updatePlayer(PLAYERS[socket.player], game);
            if(!player) return;
            player = updatePlayer({...player, ready: !player.ready}, game);

            // If all ready
            if(game.players.reduce((ready, player) => ready && player.ready, true)){
                startGame(game);
                socket.emit('setGames', getPublicGames(GAMES));
                game.players.forEach( player => {
                    io.sockets[player.id].emit('setHand', player.hand);
                });
                console.log(" pick length " + JSON.stringify(game.pickStack.length));
            }

            game.players.forEach(player => io.sockets[player.id].emit('gameInfo', getPublicGameInfo(game)));
        });

        socket.on('pick', cards => {
            let game = GAMES[socket.game];
            let player = updatePlayer(PLAYERS[socket.player], game);
            if(!player) return;

            // Not the good player, should not happen front-end should block!
            if(socket.player !== game.currentPlayer || game.action !== "pick") return;

            // Already have the maximum cards
            player = updatePlayer(player, game);
            if(player.hand.length > 6) return;

            let card = null;
            // Pick card
            let lastPlayed = game.playedCards[game.playedCards.length - 2];
            console.log("Last played " + JSON.stringify(lastPlayed));
            if(cards && cards.length && contains(cards[0], lastPlayed)){
                card = cards[0];
                lastPlayed = lastPlayed.filter(c => (c.value !== card.value) ||  (c.color !== card.color));
                console.log("Last played filtered" + JSON.stringify(lastPlayed));
            } else if(!cards) {
                card = game.pickStack.splice(0,1)[0];
            }

            if(!card){
                console.error("Not card matching pick!");
                return;
            }
            
            player.hand =[...player.hand, card];
            game.pickStack = game.pickStack.concat(lastPlayed);
            console.log(player.name + " pick " + JSON.stringify(card));
            console.log("pick length " + JSON.stringify(game.pickStack.length));
            updatePlayer(player, game);
            nextAction(game);
            socket.emit('setHand', player.hand);
            game.players.forEach(player => io.sockets[player.id].emit('gameInfo', getPublicGameInfo(game)));
        });

        socket.on('play', cards => {
            let game = GAMES[socket.game];
            let player = updatePlayer(PLAYERS[socket.player], game);
            if(!player) return;

            console.log(socket.player + " wants to play " + JSON.stringify(cards));
            var originalCards = [...cards];

            // Not the good player, should not happen front-end should block!
            if(socket.player !== game.currentPlayer || game.action !== "play") return;

            // Check played cards
            if(!checkPlayedCards(originalCards)){
                socket.emit('notAllowed');
                return;
            } 

            // If validation succeed, set hand
            player.hand = player.hand.filter(userCard => {
                let found = null;
                
                for(let i = 0; i < cards.length; i++){
                    if(cards[i].value === userCard.value && cards[i].color === userCard.color){
                        found = i;
                        break;
                    }
                }
                if(found !== null && cards.length) cards.splice(found, 1);
                return found === null;
            });
            
            if(!cards.length){
                updatePlayer(player, game);
                nextAction(game);
                game.playedCards.push(originalCards);
                socket.emit('setHand', player.hand);
                game.players.forEach(player => io.sockets[player.id].emit('gameInfo', getPublicGameInfo(game)));
                console.log(player.name + " played " + JSON.stringify(originalCards));
                console.log(" pick length " + JSON.stringify(game.pickStack.length));
            } else {
                console.error("Cards are not matching what server excpect! " + JSON.stringify(cards));
            }
        });

        socket.on('moinsDeNeuf', data => {
            let game = GAMES[socket.game];
            let player = updatePlayer(PLAYERS[socket.player], game);
            if(!player) return;

            console.log(player.name + " call for 'moins de neuf' with " + JSON.stringify(player.hand));

            // Is less than nine
            const scores = endGame(game, player.name);
            console.log("Scores: " + JSON.stringify(scores));
            if(scores.winners.names.length){
                /*
                createGame(GAMES, {
                    name: game.name,
                    players: game.players
                }, true);*/
                game.players.forEach(player => io.sockets[player.id].emit('gameEnd', scores));
                game.players.forEach(player => io.sockets[player.id].emit('gameInfo', getPublicGameInfo(game, true)));
            }
        });

        socket.on('reconnectUser', function(username){
            if(!username) return;

            console.log(socket.username + ' try to reconnect!');

            PLAYERS[username] = {
                id: socket.id,
                name: username,
            };
            
            socket.player = username;

            if(username === "pizi" && !GAMES["Les Potos"]){
                createGame(GAMES, {
                    name: "Les Potos"
                }, true);
            }

            socket.emit('setGames', getPublicGames(GAMES));

            Object.keys(GAMES).forEach(name => {
                let g = GAMES[name];
                g.players.forEach(player => {
                    if(player.name === username){
                        socket.game = g;
                        player.id = socket.id;
                        io.sockets[player.id].emit('gameInfo', getPublicGameInfo(g));
                        io.sockets[player.id].emit('setHand', player.hand);
                        if(KICKABLE_PLAYERS[username]) delete KICKABLE_PLAYERS[username];
                        return;
                    }
                });

            });
         });

        socket.on('disconnect', function(reason){
            console.log(socket.player + ' disconnected because ' + reason);

            let game = GAMES[socket.game];
            let player = updatePlayer(PLAYERS[socket.player], game);
            if(!player) return;

            KICKABLE_PLAYERS[player.name] = setTimeout( () => kickPlayer(player, game), 1500000);
            game.players.forEach(player => io.sockets[player.id] && io.sockets[player.id].emit('gameInfo', getPublicGameInfo(game)));
         });
    });
}

const createGame = (games, {name, authorized = 'All'}, force = false) => {
    if(!name) throw new Error("No name specified for game");
    if(games[name] && !force) throw new Error("Game already exist!");

    games[name] = {
        name,
        authorized,
        players: [],
        playedCards: [],
        pickStack: cardGame.generateCards(),
        currentPlayer: null,
        action: null
    }
}

const endGame = (game, callingPlayer) => {
    let winners = {
        score: 100,
        names:[]
    };
    const scores = {};
    game.players.forEach(player => { 
        let score = player.hand.reduce((total, card) => total + Math.min(cardGame.getValue(card), 10), 0);
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
        cardGame.sort(player.hand);
        let score = scores[player.name] || 0;
        const isWinner = winners.names.includes(player.name);
        const isCaller = player.name === callingPlayer;

        if(isWinner){
            if(isCaller){
                player.scoreStreak++;
                if(player.scoreStreak > 2) player.score = player.score - 50;
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

const startGame = (game) => {
    // Random player order
    game.players = cardGame.shuffle(game.players);
    game.currentPlayer = game.players[0].name;
    game.action = "play";
    // Distribute
    game.pickStack = cardGame.shuffle(game.pickStack);
    game.players.forEach(player => player.hand = game.pickStack.splice(0,7));
    game.playedCards = [game.pickStack.splice(0,1)];
}

const kickPlayer = (player, game) => {
    game.pickStack.concat(player.hand);
    const index = game.players.indexOf(player);
    if(game.currentPlayer === player.name) game.currentPlayer = index + 1 < game.players.length ? game.players[index + 1].name : 0;
    if(index !== -1) game.players.splice(index, 1);
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
                    game.currentPlayer = i + 1 < game.players.length ? game.players[i + 1].name :  game.players[0].name;
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
            hand: gameFinished ? player.hand : []
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
    cardGame.sort(cards);

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
        
        // Change As value if needed
        if(cardGame.getValue(cards[0]) === 1 && cardGame.getValue(cards[1]) > 4){
            cards[0].value === "14";
            cardGame.sort(cards);
        }

        // Fluch
        for(let i = 1; i < cards.length; i++){
            // Check value order
            const card1Value = cardGame.getValue(cards[i - 1]);
            const card2Value = cardGame.getValue(cards[i]);
            const diff = card2Value - card1Value;

            // Check color
            if(cards[i - 1].color !== cards[i].color) return false;
            
            // Logic order
            if(diff === 1) continue;

            jokers = diff - jokers - 1;
            if(jokers < 0) return false;
        }
        return true;
    }
    return false;
};