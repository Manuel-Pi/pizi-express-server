const COLORS = ["club", "diamond", "spade", "heart"], VALUES = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"], shuffle = e => { let r, a, t = e.length; for (; 0 !== t;)
    a = Math.floor(Math.random() * t), t -= 1, r = e[t], e[t] = e[a], e[a] = r; return e; }, generateCards = () => { let e = []; return COLORS.forEach((r => { VALUES.forEach((a => e.push({ value: a, color: r }))); })), e.push({ value: "*", color: "joker" }), e.push({ value: "*", color: "joker" }), shuffle(e); }, sort = e => { e.sort(((e, r) => getValue(e) - getValue(r))); }, getValue = e => { switch (e.value) {
    case "J": return 11;
    case "Q": return 12;
    case "K": return 13;
    case "*": return 0;
    default:
        if (e.value.match(/^\d|10$/))
            return parseInt(e.value);
        throw new Error("Unknown card value: " + e.value);
} };
module.exports = { generateCards, shuffle, sort, getValue };
//# sourceMappingURL=pizi-card-game.js.map