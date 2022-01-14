const CardManager = require("./pizi-moins-de-neuf-gameManager.js"), CardGame = require("./pizi-card-game"), mongoose = require("mongoose"), ioClient = require("socket.io-client");
module.exports = function ({ socketServer: e, console: a, host: r }) { const n = e.of("/pizi-moins-de-neuf"), t = ioClient(r + "/pizi-chat/moinsdeneuf"); let l = {}, i = {}, o = {}; function d(e) { let a = i[e.game], r = CardManager.updatePlayer(l[e.player], a); return r ? [a, r] : []; } function s(e, r, t) { if (!r)
    return; l[r] = { id: e.id, name: r }, e.player = r, a.info("Connection: " + r); let o = { game: null, hand: null }; Object.keys(i).forEach((n => { let t = i[n]; t.players.forEach((n => { n.name === r && (e.game = t.name, e.join(t.name), CardManager.updatePlayer(l[e.player], t), CardManager.saveGame(t), o.game = t, o.hand = n.hand, a.info(r + " successfully retrieved game!")); })); })), e.emit("setGames", CardManager.getPublicGames(i)), n.emit("setPlayers", CardManager.getPublicPlayers(l, i)), o.game && (e.emit("gameInfo", CardManager.getPublicGameInfo(o.game)), e.emit("setHand", o.hand), c(o.game, e)), m(r); } function m(e) { o[e] && (clearTimeout(o[e]), delete o[e], a.info(e + " removed from timeouts!")); } mongoose.connection.once("open", (() => { CardManager.getGames((e => { i = e, Object.values(i).forEach((e => { t.emit("addRoom", { id: e.name, name: "[game] " + e.name, private: !0, allowedUsers: e.players.filter((e => !e.bot)).map((e => e.name)) }); })); })); })), n.on("connection", (function (e) { a.debug("connection of " + e.id), e.on("login", ((a, r) => s(e, a))), e.on("reconnectUser", ((a, r) => s(e, a))), e.on("disconnect", (function (r) { a.info(e.player + " disconnected because " + r); let [t, s] = d(e); s && ("Infini" === t.conf.playerKickTimeout || o[s.name] || (o[s.name] = setTimeout((() => { CardManager.kickPlayer(s, t, i), CardManager.saveGame(t), n.to(t.name).emit("gameInfo", CardManager.getPublicGameInfo(t)), n.emit("setGames", CardManager.getPublicGames(i)), n.emit("setPlayers", CardManager.getPublicPlayers(l, i)), e.leave(t.name); }), CardManager.valueToMillisecond(t.conf.playerKickTimeout), this))); })), e.on("join", (r => { let o = i[r], d = l[e.player]; const s = o.players.length + (o.spectators ? o.spectators.length : 0); if (!o || !d || s > 7 || s >= o.conf.maxPlayer)
    return; e.game && i[e.game] && CardManager.updatePlayer(d, i[e.game]) && CardManager.kickPlayer(CardManager.updatePlayer(d, i[e.game]), i[e.game], i), e.game = r, o.spectators = o.spectators || [], o.action ? CardManager.addSpectator(d, o) : CardManager.addPlayer(d, o), o.action && c(o, e), e.join(r), CardManager.saveGame(o), m(d.name), t.emit("updateRoom", { id: o.name, allowedUsers: [...o.players.filter((e => !e.bot)).map((e => e.name))] }); let g = o.players.length; for (; g--;)
    if (!o.players[g].bot && !n.sockets.get(o.players[g].id))
        return a.info("Clean player " + o.players[g].name), void CardManager.kickPlayer(o.players[g], i[e.game], i); n.to(o.name).emit("gameInfo", CardManager.getPublicGameInfo(o)), n.emit("setGames", CardManager.getPublicGames(i)), n.emit("setPlayers", CardManager.getPublicPlayers(l, i)); })), e.on("quit", (r => { const t = l[e.player]; if (!t)
    return; let [o, s] = d(e); if (o && (CardManager.kickPlayer(s, o, i), e.leave(o.name), e.broadcast.to(o.name).emit("gameInfo", CardManager.getPublicGameInfo(o)), e.emit("gameInfo", null), CardManager.saveGame(o), n.emit("setGames", CardManager.getPublicGames(i))), r) {
    e.disconnect();
    const r = delete l[t.name];
    a.log("Remove user from array = " + r);
} n.emit("setPlayers", CardManager.getPublicPlayers(l, i)); })), e.on("createGame", (r => { if (!r)
    return; const l = Object.keys(i).length; l > 10 || (CardManager.saveGame(CardManager.createGame(i, r)), Object.keys(i).length > l && (n.emit("setGames", CardManager.getPublicGames(i)), a.info("Game created: " + r.name), e.emit("gameCreated")), t.emit("addRoom", { id: r.name, name: "[game] " + r.name, private: !0 })); })), t.on("roomAdded", (e => { e.id.includes("[game]"); })), e.on("removeGame", (e => { let r = e && i[e]; const t = r.conf.bots || 0; !e || !r || r.players.length - t > 0 || (CardManager.removeGame(i[e]), delete i[e], n.emit("setGames", CardManager.getPublicGames(i)), a.info("Game removed: " + e)); })), e.on("isReady", (a => { let [r, t] = d(e); if (!t)
    return; t = CardManager.updatePlayer(Object.assign(Object.assign({}, t), { ready: !t.ready }), r); let l = 0, o = !0; r.players.forEach((e => { e.ready && l++, o = o && e.ready; })), m(t.name), o && r.conf.minPlayer <= l && (CardManager.startGame(r), e.emit("setGames", CardManager.getPublicGames(i)), r.players.forEach((e => n.sockets.get(e.id) && n.sockets.get(e.id).emit("setHand", e.hand))), c(r, e)), CardManager.saveGame(r), n.to(r.name).emit("gameInfo", CardManager.getPublicGameInfo(r, !1, !0)); })), e.on("selectPick", (r => { let [n, t] = d(e); if (!t)
    return; if (e.player !== n.currentPlayer || "pick" !== n.action)
    return; if (t = CardManager.updatePlayer(t, n), t.hand.length > 6)
    return; let l = null; r && r[0] && "0" === r[0].value && "heart" === r[0].color && (l = r[0]); let i = [...n.playedCards[n.playedCards.length - 2]]; a.debug("Last played " + JSON.stringify(i)), !l && r && r.length && CardManager.contains(r[0], i) && (l = r[0], i = i.filter((e => e.value !== l.value || e.color !== l.color)), a.debug("Last played filtered" + JSON.stringify(i))), CardManager.saveGame(n), a.debug(t.name + " select pick " + JSON.stringify(l)), e.broadcast.to(n.name).emit("selectedPick", l); })), e.on("pick", (r => { let t, [l, i] = d(e); if (!i)
    return; if (e.player !== l.currentPlayer || "pick" !== l.action)
    return; if (i.hand.length > 6)
    return; let o = l.playedCards[l.playedCards.length - 2]; a.debug("Last played " + JSON.stringify(o)), r && r.length && CardManager.contains(r[0], o) ? (t = r[0], o = o.filter((e => e.value !== t.value || e.color !== t.color)), a.debug("Last played filtered" + JSON.stringify(o))) : r || (t = l.pickStack.splice(0, 1)[0]), t ? (i.hand = [...i.hand, t], l.pickStack = l.pickStack.concat(o), a.debug(i.name + " pick " + JSON.stringify(t)), CardManager.updatePlayer(i, l), CardManager.nextAction(l), m(i.name), l.quickPlay = !!CardManager.quickPlay(i, [t], l), CardManager.saveGame(l), e.emit("setHand", i.hand), n.to(l.name).emit("gameInfo", CardManager.getPublicGameInfo(l, !1, !0)), c(l, e)) : a.error("Not card matching pick!"); })), e.on("play", (r => { let [t, l] = d(e); if (!l || "play" !== t.action)
    return; a.debug(e.player + " wants to play " + JSON.stringify(r)); var i = [...r]; const o = CardManager.quickPlay(l, i, t); if ("bash" === o && n.to(t.name).emit("bash", l.name), e.player === t.currentPlayer || o)
    if (CardManager.checkPlayedCards(i))
        if (m(l.name), l.hand = l.hand.filter((e => { let a = null; for (let n = 0; n < r.length; n++)
            if (r[n].value === e.value && r[n].color === e.color) {
                a = n;
                break;
            } return null !== a && r.length && r.splice(a, 1), null === a; })), r.length)
            a.error("Cards are not matching what server excpect! " + JSON.stringify(r));
        else {
            if ("quick" === o) {
                CardManager.updatePlayer(l, t);
                let e = t.playedCards[t.playedCards.length - 1];
                t.playedCards[t.playedCards.length - 1] = e.concat(i), n.to(t.name).emit("quickPlayed", l.name), t.players.filter((e => e.name === t.currentPlayer))[0].stats.quickplay.taken++, l.stats.quickplay.done++;
            }
            else
                CardManager.updatePlayer(l, t), CardManager.nextAction(t), t.playedCards.push(i);
            t.quickPlay = !1, e.emit("setHand", l.hand), CardManager.saveGame(t), n.to(t.name).emit("gameInfo", CardManager.getPublicGameInfo(t, !1, !0)), a.debug(l.name + " played " + JSON.stringify(i));
        }
    else
        n.to(t.name).emit("notAllowed", l.name); })), e.on("moinsDeNeuf", (r => { let [t, l] = d(e); if (!l || "play" !== t.action || e.player !== t.currentPlayer)
    return; a.debug(l.name + " call for 'moins de neuf' with " + JSON.stringify(l.hand)); const i = CardManager.endRound(t, l.name); CardManager.saveGame(t, !0), a.debug("Scores: " + JSON.stringify(i)), i.winners.names.length && (n.to(t.name).emit("roundEnd", i), n.to(t.name).emit("gameInfo", CardManager.getPublicGameInfo(t, !0, !0))); })), e.on("refresh", (r => { let [n, t] = d(e); if (!t)
    return e.emit("setGames", CardManager.getPublicGames(i)), void e.emit("setPlayers", CardManager.getPublicPlayers(l, i)); a.info(t.name + " call for refresh. "), e.emit("gameInfo", CardManager.getPublicGameInfo(n)), e.emit("setHand", t.hand); })); })); let g = !1; function c(e, r) { if (g || e.endGame)
    return; if (e.spectators = e.spectators || [], e.players.length + e.spectators.length <= e.conf.bots)
    return; let t, l = !1; if (e.players.forEach((a => { t || a.name !== e.currentPlayer ? !l && a.hand.length < 4 && (l = !0) : t = a; })), t && t.bot)
    switch (g = !0, a.debug(t.name + " hand: " + JSON.stringify(t.hand)), e.action) {
        case "pick":
            let i = null;
            const o = e.playedCards[e.playedCards.length - 2];
            let d = o.filter(((e, a) => 0 === a || a === o.length - 1));
            const s = d.filter((e => 0 !== t.hand.filter((a => CardGame.getValue(a) === CardGame.getValue(e))).length));
            s.sort(((e, a) => CardGame.getValue(e) - CardGame.getValue(a))), s.length && (i = s.splice(0, 1)[0]), i || (d.sort(((e, a) => CardGame.getValue(a) - CardGame.getValue(e))), CardGame.getValue(d[0]) < 3 && (i = d.splice(0, 1)[0]));
            let m = i;
            return i || (i = i || e.pickStack.splice(0, 1)[0], e.pickStack = e.pickStack.concat(o), m = { color: "heart", value: "0" }), t.hand.push(i), a.debug(t.name + " is picking: " + JSON.stringify(i)), void setTimeout((() => { CardManager.updatePlayer(t), n.to(e.name).emit("selectedPick", m), setTimeout((() => { CardManager.nextAction(e), n.to(e.name).emit("gameInfo", CardManager.getPublicGameInfo(e, !1, !0)), g = !1, c(e, r); }), 800); }), 2e3);
        case "play":
            let u = [];
            const f = [...t.hand].sort(((e, a) => CardGame.getValue(a) - CardGame.getValue(e)));
            if (f.reduce(((e, a) => e + CardGame.getValue(a)), 0) < 10)
                return void setTimeout((() => { const r = CardManager.endRound(e, t.name); CardManager.saveGame(e, !0), a.debug("Scores: " + JSON.stringify(r)), g = !1, r.winners.names.length && (n.to(e.name).emit("roundEnd", r), n.to(e.name).emit("gameInfo", CardManager.getPublicGameInfo(e, !0, !0))); }), 1e3);
            const y = e.playedCards[e.playedCards.length - 1].map((e => CardGame.getValue(e))), p = f.filter((e => "joker" === e.color)), C = {};
            for (let e = 0; e < f.length - 1; e++) {
                const a = f[e], r = f[e + 1];
                CardGame.getValue(a) === CardGame.getValue(r) && (C[CardGame.getValue(a)] ? C[CardGame.getValue(a)]++ : C[CardGame.getValue(a)] = 1);
            }
            let h = 0;
            if (Object.keys(C).forEach((e => { const a = parseInt(e); a > h && (h = a); })), h && !y.includes(h) && (u = f.filter((e => CardGame.getValue(e) === h)), u.length && p.length))
                for (; p.length;)
                    u.splice(1, 0, p.shift());
            u.length || f.forEach((e => { if (!u.length)
                if (y.includes(CardGame.getValue(e))) {
                    if (l && p.length)
                        for (; p.length;)
                            u.push(p.shift());
                }
                else
                    u.push(e); }));
            const M = [...u];
            return t.hand = t.hand.filter((e => { let a = null; for (let r = 0; r < u.length; r++)
                if (u[r].value === e.value && u[r].color === e.color) {
                    a = r;
                    break;
                } return null !== a && u.length && u.splice(a, 1), null === a; })), a.debug(t.name + " is playing: " + JSON.stringify(M)), void setTimeout((() => { CardManager.updatePlayer(t), e.playedCards.push(M), CardManager.nextAction(e), n.to(e.name).emit("gameInfo", CardManager.getPublicGameInfo(e, !1, !0)), g = !1, c(e, r); }), 2e3);
    } } };
//# sourceMappingURL=pizi-moins-de-neuf.js.map