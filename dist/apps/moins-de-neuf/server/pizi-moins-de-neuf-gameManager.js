const CardGame = require("./pizi-card-game"), mongoose = require("mongoose"), GameModel = require("./database/models/game"), PlayerModel = require("./database/models/player"), addPlayer = (e, a) => { if (!e || !a)
    return; const r = a.round ? Math.round(a.players.reduce(((e, a) => e + a.score), 0) / a.players.length) : 0; a.players.push(Object.assign(Object.assign({}, e), { score: r, scoreStreak: 0, hand: [], ready: e.ready || !1, stats: { games: { played: 0, won: 0, lost: 0 }, moinsdeneuf: { call: 0, won: 0, lost: 0 }, quickplay: { done: 0, taken: 0 } } })), a.lastTime = (new Date).getTime(); }, addSpectator = (e, a) => { e && a && (a.spectators = a.spectators || [], a.spectators.filter((a => a.name === e.name)).length || a.spectators.push(e)); }, getGames = e => { let a = {}; 1 === mongoose.connection.readyState ? GameModel.find({}, ((r, t) => { r && console.error(JSON.stringify(r)), t.forEach((e => { a[e.name] = e; })), e(a); })) : e(a); }, saveGame = (e, a = !1) => { 1 === mongoose.connection.readyState && e && e.name && (GameModel.findOneAndUpdate({ name: e.name }, e, { upsert: !0 }, (e => { })), e.gameEnd && a && e.players.forEach((e => { PlayerModel.findOne({ user: e.name }, ((a, r) => { a && console.error(JSON.stringify(a)), r || (r = new PlayerModel({ user: e.name })), r.updateStats(e.stats), r.save(); })); })), e.gameEnd && e.gameEnd); }, removeGame = e => { 1 === mongoose.connection.readyState && e && e.name && GameModel.findOneAndDelete({ name: e.name }, (e => { })); }, createGame = (e, a = {}, r = !1) => { if (!a || !a.name)
    return void console.error("No name specified for game"); if (e[a.name] && !r)
    return void console.error("Game already exist!"); const t = e[a.name] = { lastTime: (new Date).getTime(), name: a.name, authorized: a.authorized, players: [], spectators: [], playedCards: [], pickStack: CardGame.generateCards(), currentPlayer: null, action: null, turn: 0, round: 0, quikPlay: !1, conf: a, gameEnd: null }; let n = ["Manu", "Fab", "Fresh", "Lucas", "Margeu", "Zaza", "Cé", "Nazim", "JC", "Digo"]; function s() { const e = Math.floor(Math.random() * n.length); return n.splice(e, 1)[0]; } if (a.bots)
    for (let e = 0; e < a.bots; e++)
        addPlayer({ name: "Bot-" + s(), bot: !0, ready: !0 }, t); return t; }, endRound = (e, a) => { let r = { score: 100, names: [] }; const t = {}; return e.players.forEach((e => { let a = e.hand.reduce(((e, a) => e + Math.min(CardGame.getValue(a), 10)), 0); a < r.score ? (r.score = a, r.names = [e.name]) : a === r.score && r.names.push(e.name), t[e.name] = a; })), !e.conf.allowWinEquality && r.names.includes(a) && r.names.length > 1 && r.names.splice(r.names.indexOf(a), 1), e.players.forEach((n => { CardGame.sort(n.hand); let s = 0; const l = r.names.includes(n.name), o = n.name === a; let c = 0, i = t[n.name] || 0; const m = n.score, d = n.scoreStreak; if (o && n.stats.moinsdeneuf.call++, l)
    s = 0, o && e.conf.allowStreak && (!e.conf.onlyOneWinnerStreak || e.conf.onlyOneWinnerStreak && 1 === r.names.length) && (n.scoreStreak++, c = 1, n.stats.moinsdeneuf.won++, n.scoreStreak > 2 && (n.score = n.score - 50, n.scoreStreak = 0));
else {
    let e = 0;
    for (; "*" === n.hand[e].value;)
        e++;
    s = i * (e + 1), o && (s = r.score === s ? 2 * s : 3 * s, n.stats.moinsdeneuf.lost++), n.score += s;
} const u = n.score !== m && n.scoreStreak === d && m % 50 != 0; e.conf.bonusMultiple50 && n.score % 50 == 0 && u && (n.score = n.score - 50), t[n.name] = { handScore: i, score: s, scoreStreak: c, hand: n.hand }, n.ready = n.bot || !1, n.hand = []; })), e.action = null, e.currentPlayer = null, e.playedCards = [], e.players.sort(((e, a) => e.score < a.score ? -1 : e.score > a.score ? 1 : e.score === a.score ? e.scoreStreak < a.scoreStreak ? 1 : e.scoreStreak > a.scoreStreak ? -1 : 0 : void 0)), e.players.forEach((a => { a.score >= e.conf.gameEndScore && (e.gameEnd = "score"); })), !e.gameEnd && "Infini" !== e.conf.gameEndTime && (new Date).getTime() - e.startTime > valueToMillisecond(e.conf.gameEndTime) && (e.gameEnd = "time"), e.gameEnd && e.players.forEach(((e, a) => { e.stats.score = e.score, e.stats.games.played++, 0 === a ? e.stats.games.won++ : e.stats.games.lost++; })), e.spectators && e.spectators.forEach((a => addPlayer(a, e))), e.spectators = [], { scores: t, winners: r, announcer: a }; }, nextPlayer = e => { let a = e.players.filter((a => a.name === e.currentPlayer))[0], r = e.players.indexOf(a) + 1; return r = r < e.players.length ? r : 0, e.players[r]; }, previousPlayer = (e, a = 1) => { let r = e.players.filter((a => a.name === e.currentPlayer))[0], t = e.players.indexOf(r) - a; for (; a > 0;)
    t = t < a - 1 ? e.players.length - a : t, a--; return e.players[t]; }, quickPlay = (e, a, r) => { if (!r.conf.allowQuickPlay || a.length > 1 || 1 === r.turn && r.players[0].name === r.currentPlayer)
    return null; if (e.hand[e.hand.length - 1].value === a[0].value && e.hand[e.hand.length - 1].color === a[0].color && previousPlayer(r).name === e.name && checkPlayedCards([...r.playedCards[r.playedCards.length - 1], ...a], !0)) {
    if (previousPlayer(r).name === e.name)
        return "quick";
    if (previousPlayer(r, 2).name === e.name)
        return "bash";
} return null; }, startGame = e => { e.gameEnd && (e.players.forEach((e => { e.score = 0, e.scoreStreak = 0, e.stats = { games: { played: 0, won: 0, lost: 0 }, moinsdeneuf: { call: 0, won: 0, lost: 0 }, quickplay: { done: 0, taken: 0 }, score: 0 }; })), e.gameEnd = null, e.round = 0, e.startTime = (new Date).getTime()), e.players = CardGame.shuffle(e.players), e.currentPlayer = e.players[0].name, e.action = "play", e.pickStack = CardGame.generateCards(), e.players.forEach((a => a.hand = e.pickStack.splice(0, 7))), e.playedCards = [e.pickStack.splice(0, 1)], e.startTime = e.startTime || (new Date).getTime(), e.roundStartTime = (new Date).getTime(), e.turn = 1, e.round++; }, kickPlayer = (e, a, r) => { if (!e)
    return; console.info("Kick " + e.name), a.pickStack.concat(e.hand); const t = a.players.indexOf(e); a.currentPlayer === e.name && (a.currentPlayer = t + 1 < a.players.length ? a.players[t + 1].name : 0), -1 !== t && a.players.splice(t, 1); const n = a.spectators.indexOf(e); -1 !== n && a.spectators.splice(n, 1), 0 === a.players.length && r && createGame(r, a.conf, !0); }, contains = (e, a) => { for (let r = 0; r < a.length; r++)
    if (e.value === a[r].value && e.color === a[r].color)
        return !0; return !1; }, updatePlayer = (e, a = null) => { if (e && a) {
    for (let r = 0; r < a.players.length; r++) {
        let t = a.players[r];
        if (t.name === e.name)
            return Object.assign(t, e), t;
    }
    for (let r = 0; r < a.spectators.length; r++) {
        let t = a.spectators[r];
        if (t.name === e.name)
            return Object.assign(t, e), t;
    }
} }, nextAction = e => { switch (e.action) {
    case "pick":
        for (let a = 0; a < e.players.length; a++)
            if (e.players[a].name === e.currentPlayer)
                return a + 1 < e.players.length ? e.currentPlayer = e.players[a + 1].name : (e.currentPlayer = e.players[0].name, e.turn++), void (e.action = "play");
        console.error("Error: an action should happen!");
        break;
    case "play":
        e.action = "pick";
        break;
    default: e.action = "play";
} e.lastTime = (new Date).getTime(); }, getPublicGames = e => { let a = Object.keys(e).length; for (; a--;) {
    let r = e[Object.keys(e)[a]];
    r.lastTime = r.lastTime || (new Date).getTime(), "Infini" !== r.conf.gameKickTimeout && (new Date).getTime() - r.lastTime > valueToMillisecond(r.conf.gameKickTimeout) && (removeGame(r), console.info("Delete game: " + r.name + " after " + Math.round(((new Date).getTime() - r.lastTime) / 1e3) + "s"), delete e[Object.keys(e)[a]]);
} return Object.keys(e).map((a => { const r = getPublicGameInfo(e[a]); return { name: a, players: r.players, action: r.action, conf: r.conf, spectators: r.spectators || [] }; })); }, getPublicGameInfo = (e, a = !1, r = !1) => { r && (e.lastTime = (new Date).getTime()); let t = e.players.map((e => ({ id: e.id, name: e.name, cardNumber: e.hand.length, score: e.score, scoreStreak: e.scoreStreak, ready: e.ready, stats: e.stats, bot: e.bot || !1, hand: [] }))), n = []; return "pick" === e.action && e.playedCards.length > 1 ? (n.push(e.playedCards[e.playedCards.length - 2]), n.push(e.playedCards[e.playedCards.length - 1])) : e.playedCards.length > 0 && n.push(e.playedCards[e.playedCards.length - 1]), { name: e.name, players: t, playedCards: n, currentPlayer: e.currentPlayer, action: e.action, scores: a ? null : e.score, quickPlay: e.quickPlay, conf: e.conf, gameEnd: e.gameEnd, startTime: e.startTime, turn: e.turn, roundStartTime: e.roundStartTime, round: e.round, spectators: e.spectators || [] }; }, checkPlayedCards = (e, a = !1) => { const r = e.map((e => (Object.assign({}, e)))); if (!r || !r.length)
    return !1; if (1 === r.length)
    return !0; CardGame.sort(r); let t = 0; for (; r[t] && "*" === r[t].value;)
    t++; if (r.splice(0, t), !r.length || 1 === r.length)
    return !0; if (r[0].value === r[1].value)
    return r.every((e => e.value === r[0].value)); if (e.length > 2) {
    let n, s;
    if (a) {
        1 === CardGame.getValue(r[0]) && CardGame.getValue(r[1]) > 4 && (r[0].value = "14", CardGame.sort(r));
        for (let e = 1; e < r.length; e++) {
            const a = CardGame.getValue(r[e - 1]);
            let n = CardGame.getValue(r[e]);
            e === r.length - 1 && 1 === n && (n = 14);
            const s = n - a;
            if (r[e - 1].color !== r[e].color)
                return !1;
            if (1 !== s && (t -= s - 1, t < 0))
                return !1;
        }
    }
    else
        for (let a = 0; a < e.length; a++) {
            const r = "joker" === e[a].color;
            if (n && n++, r)
                continue;
            if (s && e[a].color !== s)
                return !1;
            let t = CardGame.getValue(e[a]);
            if (n) {
                if (a === e.length - 1 && 1 === t && (t = 14), n !== t)
                    return !1;
            }
            else
                s = e[a].color, n = t;
        }
    return !0;
} return !1; }, valueToMillisecond = e => { switch (e) {
    case "30s": return 3e4;
    case "1min": return 6e4;
    case "2min": return 12e4;
    case "5min": return 3e5;
    case "10min": return 6e5;
    case "15min": return 9e5;
    case "20min": return 12e5;
    case "30min": return 18e5;
    case "45min": return 27e5;
    case "1h": return 36e5;
} }, getCurrentGameForPlayer = (e, a) => { let r = null; return Object.keys(a).forEach((t => { const n = a[t]; r = n.players.find((a => a.name === e.name)) ? n : r; })), r; }, getPublicPlayers = (e, a) => Object.entries(e).map((([e, r]) => ({ name: e, game: getCurrentGameForPlayer(r, a) || null })));
module.exports = { getGames, saveGame, createGame, endRound, quickPlay, startGame, kickPlayer, contains, updatePlayer, nextAction, nextPlayer, previousPlayer, getPublicGames, getPublicGameInfo, getPublicPlayers, checkPlayedCards, removeGame, getCurrentGameForPlayer, addPlayer, addSpectator, valueToMillisecond };
//# sourceMappingURL=pizi-moins-de-neuf-gameManager.js.map