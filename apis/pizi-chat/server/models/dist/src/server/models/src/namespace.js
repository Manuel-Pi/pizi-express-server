"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Namespace = void 0;
class Namespace {
    constructor(options) {
        if (!options.name)
            throw new Error("Namespace need a name!");
        this.name = options.name;
        this.users = [];
    }
    addUser(user) {
        if (this.getUsers({ socketId: user.socketId })[0]) {
            console.debug("User already exist!");
            return;
        }
        this.users.push(user);
    }
    getUsers(options) {
        return this.users.filter(user => {
            const unmatched = Object.keys(options).map(key => user[key] !== options[key]);
            return !unmatched.length;
        });
    }
    getRooms(user) {
        return this.rooms.filter(room => room.allowedUsers.includes(user.name));
    }
}
exports.Namespace = Namespace;
//# sourceMappingURL=namespace.js.map