const CardManager = require('./pizi-moins-de-neuf-gameManager.js');
var mongoose = require('mongoose');

module.exports = function(server){
    /****************************** SOCKET IO *************************************/
    // Get io for a specific namespace
    const io = require('socket.io')(server).of('/pizi-moins-de-neuf');

    // Init state
    let CONNEXION_ON = true;
    let PLAYERS = {};
    let GAMES = {};
    let KICKABLE_PLAYERS = {};

    mongoose.connection.once('open', () => {
        CardManager.getGames( games => GAMES = games);
    });

    io.on('connection', function (socket) {
        socket.on('login', name => {

            PLAYERS[name] = {
                id: socket.id,
                name,
            };
            
            socket.player = name;
            console.log('Connexion of : ' + name);
            socket.emit('setGames', CardManager.getPublicGames(GAMES));
        });

        socket.on('join', gameName => {
            let game = GAMES[gameName];
            let player = PLAYERS[socket.player];
            if(!game || !player || game.action || game.players.length > 6) return;

            if(socket.game && GAMES[socket.game] && CardManager.updatePlayer(player, GAMES[socket.game])){
                CardManager.kickPlayer(CardManager.updatePlayer(player, GAMES[socket.game]), GAMES[socket.game], GAMES);
            }

            socket.game = gameName;
            game.players.push({
                ...player,
                score: 0,
                scoreStreak: 0,
                hand: [],
                ready: false
            });

            CardManager.saveGame(game);

            // Clean players
            
            let i = game.players.length;
            while(i--){
                if(!io.sockets[game.players[i].id]){
                    CardManager.kickPlayer(game.players[i], GAMES[socket.game], GAMES);
                    console.log("Kick " + game.players[i].name);
                    return;
                }
            }

            // QUICK FIX: Twice because of UI
            game.players.forEach(player => io.sockets[player.id].emit('gameInfo', CardManager.getPublicGameInfo(game)));
            game.players.forEach(player => io.sockets[player.id].emit('gameInfo', CardManager.getPublicGameInfo(game)));
            io.emit('setGames', CardManager.getPublicGames(GAMES));
        });

        socket.on('quit', () => {
            let game = GAMES[socket.game];
            let player = CardManager.updatePlayer(PLAYERS[socket.player], game);
            
            if(!player && !game) return;

            CardManager.kickPlayer(player, game, GAMES);
            game.players.forEach(player => io.sockets[player.id] && io.sockets[player.id].emit('gameInfo', CardManager.getPublicGameInfo(game)));
            CardManager.saveGame(game);
            io.emit('setGames', CardManager.getPublicGames(GAMES));
        });

        socket.on('createGame', gameProps => {
            if(Object.keys(GAMES).length > 9) return;
            CardManager.saveGame(CardManager.createGame(GAMES, gameProps));
            socket.emit('setGames', CardManager.getPublicGames(GAMES));
        });

        socket.on('removeGame', gameName => {
            let game = gameName && GAMES[gameName];
            if(!gameName || !game || game.players.length) return;
            CardManager.removeGame(GAMES[gameName]);
            delete GAMES[gameName];
            io.emit('setGames', CardManager.getPublicGames(GAMES));
        });

        socket.on('isReady', data => {
            let game = GAMES[socket.game];
            let player = CardManager.updatePlayer(PLAYERS[socket.player], game);
            if(!player) return;
            player = CardManager.updatePlayer({...player, ready: !player.ready}, game);


            // If all ready
            if(game.players.reduce((ready, player) => ready && player.ready, true)){
                CardManager.startGame(game);
                socket.emit('setGames', CardManager.getPublicGames(GAMES));
                game.players.forEach( player => {
                    io.sockets[player.id].emit('setHand', player.hand);
                });
                console.log(" pick length " + JSON.stringify(game.pickStack.length));
            }

            CardManager.saveGame(game);

            game.players.forEach(player => {
                if(io.sockets[player.id]){
                    io.sockets[player.id].emit('gameInfo', CardManager.getPublicGameInfo(game));
                }
            });
        });

        socket.on('selectPick', cards => {
            let game = GAMES[socket.game];
            let player = CardManager.updatePlayer(PLAYERS[socket.player], game);
            if(!player) return;

            // Not the good player, should not happen front-end should block!
            if(socket.player !== game.currentPlayer || game.action !== "pick") return;

            // Already have the maximum cards
            player = CardManager.updatePlayer(player, game);
            if(player.hand.length > 6) return;

            let card = null;
            if(cards && cards[0] && cards[0].value === "0" && cards[0].color === "heart") card = cards[0];
            // Pick card
            let lastPlayed = [...game.playedCards[game.playedCards.length - 2]];
            console.log("Last played " + JSON.stringify(lastPlayed));
            if(!card && cards && cards.length && CardManager.contains(cards[0], lastPlayed)){
                card = cards[0];
                lastPlayed = lastPlayed.filter(c => (c.value !== card.value) ||  (c.color !== card.color));
                console.log("Last played filtered" + JSON.stringify(lastPlayed));
            }

            CardManager.saveGame(game);
            
            console.log(player.name + " select pick " + JSON.stringify(card));
            console.log("pick length " + JSON.stringify(game.pickStack.length));
            socket.broadcast.emit('selectedPick', card);
        });

        socket.on('pick', cards => {
            let game = GAMES[socket.game];
            let player = CardManager.updatePlayer(PLAYERS[socket.player], game);
            if(!player) return;

            // Not the good player, should not happen front-end should block!
            if(socket.player !== game.currentPlayer || game.action !== "pick") return;

            // Already have the maximum cards
            player = CardManager.updatePlayer(player, game);
            if(player.hand.length > 6) return;

            let card = null;
            // Pick card
            let lastPlayed = game.playedCards[game.playedCards.length - 2];
            console.log("Last played " + JSON.stringify(lastPlayed));
            if(cards && cards.length && CardManager.contains(cards[0], lastPlayed)){
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
            CardManager.updatePlayer(player, game);
            CardManager.nextAction(game);
            game.quickPlay = CardManager.quickPlay(player, [card], game);
            CardManager.saveGame(game);
            socket.emit('setHand', player.hand);
            game.players.forEach(p => io.sockets[p.id].emit('gameInfo', CardManager.getPublicGameInfo(game)));
        });

        socket.on('play', cards => {
            let game = GAMES[socket.game];
            let player = CardManager.updatePlayer(PLAYERS[socket.player], game);
            if(!player || game.action !== "play") return;

            console.log(socket.player + " wants to play " + JSON.stringify(cards));
            var originalCards = [...cards];

            // Is it a quick play ?
            const qp = CardManager.quickPlay(player, originalCards, game);
            if(socket.player !== game.currentPlayer && !qp) return;

            // Check played cards
            if(!CardManager.checkPlayedCards(originalCards)){
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
                if(qp){
                    CardManager.updatePlayer(player, game);
                    let lastPlay = game.playedCards[game.playedCards.length - 1];
                    game.playedCards[game.playedCards.length - 1] = lastPlay.concat(originalCards);
                    game.players.forEach(player => io.sockets[player.id].emit('quickPlayed', player.name));
                } else {
                    CardManager.updatePlayer(player, game);
                    CardManager.nextAction(game);
                    game.playedCards.push(originalCards);
                }
                game.quickPlay = false;
                socket.emit('setHand', player.hand);
                CardManager.saveGame(game);
                game.players.forEach(player => io.sockets[player.id].emit('gameInfo', CardManager.getPublicGameInfo(game)));
                console.log(player.name + " played " + JSON.stringify(originalCards));
                console.log(" pick length " + JSON.stringify(game.pickStack.length));
            } else {
                console.error("Cards are not matching what server excpect! " + JSON.stringify(cards));
            }
        });

        socket.on('moinsDeNeuf', data => {
            let game = GAMES[socket.game];
            let player = CardManager.updatePlayer(PLAYERS[socket.player], game);
            if(!player) return;

            console.log(player.name + " call for 'moins de neuf' with " + JSON.stringify(player.hand));

            // Is less than nine
            const scores = CardManager.endGame(game, player.name);
            CardManager.saveGame(game);
            console.log("Scores: " + JSON.stringify(scores));
            if(scores.winners.names.length){
                let publiGame = CardManager.getPublicGameInfo(game, true);
                game.players.forEach(player => io.sockets[player.id].emit('gameEnd', scores));
                game.players.forEach(player => io.sockets[player.id].emit('gameInfo', publiGame));
            }
        });

        socket.on('reconnectUser', function(username){
            if(!username) return;

            console.log(username + ' try to reconnect!');

            PLAYERS[username] = {
                id: socket.id,
                name: username,
            };
            
            socket.player = username;
            socket.emit('setGames', CardManager.getPublicGames(GAMES));

            Object.keys(GAMES).forEach(name => {
                let g = GAMES[name];
                g.players.forEach(player => {
                    if(player.name === username){
                        socket.game = g.name;
                        player.id = socket.id;
                        socket.emit('gameInfo', CardManager.getPublicGameInfo(g));
                        socket.emit('gameInfo', CardManager.getPublicGameInfo(g));
                        socket.emit('setHand', player.hand);
                        CardManager.saveGame(g);
                        if(KICKABLE_PLAYERS[username]){
                            clearTimeout(KICKABLE_PLAYERS[username]);
                            delete KICKABLE_PLAYERS[username];
                        }
                        console.log(username + ' successfully reconnected!');
                        return;
                    }
                });
            });
            socket.emit('setGames', CardManager.getPublicGames(GAMES));
         });

        socket.on('disconnect', function(reason){
            console.log(socket.player + ' disconnected because ' + reason);
            let game = GAMES[socket.game];
            let player = CardManager.updatePlayer(PLAYERS[socket.player], game);
            if(!player) return;

            //KICKABLE_PLAYERS[player.name] = setTimeout( () => kickPlayer(player, game, GAMES), 30000, this);
            game.players.forEach(player => io.sockets[player.id] && io.sockets[player.id].emit('gameInfo', CardManager.getPublicGameInfo(game)));
            CardManager.saveGame(game);
            io.emit('setGames', CardManager.getPublicGames(GAMES));
         });
    });
}