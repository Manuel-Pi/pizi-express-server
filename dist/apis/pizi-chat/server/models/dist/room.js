"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Room = void 0;
const user_1 = require("./user");
class Room {
    constructor(options) {
        if (!options.name)
            throw new Error("Namespace need a name!");
        this.id = options.id || options.name;
        this.name = options.name;
        this.owner = options.owner ? new user_1.User(options.owner) : null;
        this.private = options.private || false;
        this.users = options.users ? options.users.map(user => new user_1.User(user)) : [];
        this.allowedUsers = options.allowedUsers || [];
        if (this.owner && this.private && !this.allowedUsers.includes(this.owner.name) && this.owner.name !== "default")
            this.allowedUsers.push(this.owner.name);
        this.messages = options.messages || [];
        this.creation = new Date().getTime();
    }
    update(options, callback) {
        if (options.allowedUsers) {
            this.allowedUsers = options.allowedUsers;
            callback && callback(this);
        }
    }
    disconnectUser(user, callback) {
        let i = this.users.length;
        while (i--) {
            if (this.users[i].name === user.name) {
                this.users.splice(i, 1);
                callback(this);
                console.info("disconnect [" + user.name + "] from room: [" + this.id + "]");
            }
        }
    }
    addMessage(message) {
        this.messages.push(message);
        if (this.messages.length > 20)
            this.messages.shift();
    }
    addUser(user, callback) {
        // Check user is not already present
        if (this.getUsers({ name: user.name })[0]) {
            callback(this);
            return;
        }
        // Check user is allow if it's a private room
        if (this.private && !this.isAllow(user.name))
            return;
        this.users.push(user);
        callback(this);
        console.info("add [" + user.name + "] to room [" + this.id + "]");
    }
    isAllow(userName) {
        return !this.private || this.allowedUsers.includes(userName) || this.owner.name === userName;
    }
    getUsers(options) {
        if (!options)
            return this.users;
        return this.users.filter(user => {
            const unmatched = Object.keys(options).filter(key => user[key] !== options[key]);
            return !unmatched.length;
        });
    }
    getCleanName(socketUserName) {
        return this.name.replace(socketUserName, "").replace("-", "");
    }
    getJson() {
        return {
            id: this.id,
            name: this.name,
            users: this.users.map(user => user.getJson()),
            private: this.private,
            allowedUsers: this.allowedUsers,
            owner: this.owner && this.owner.getJson(),
            messages: this.messages
        };
    }
}
exports.Room = Room;
Room.ROOM_EXPIRATION = 0;
//# sourceMappingURL=room.js.map