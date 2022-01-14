"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Namespace = exports.DEFAULT_ROOM__ID = void 0;
const room_1 = require("./room");
const user_1 = require("./user");
const NAMESPACES = {};
const EXPIRED_ROOMS = {};
exports.DEFAULT_ROOM__ID = "everyone";
class Namespace {
    constructor(options) {
        if (!options.name)
            throw new Error("Namespace need a name!");
        this.name = options.name;
        this.rooms = [new room_1.Room({ id: exports.DEFAULT_ROOM__ID, name: "Everyone", owner: null })];
    }
    /* -------------------------------------- STATIC -----------------------------------------*/
    static getDataFromSocket(socket, createNamespace = false) {
        const name = socket.nsp.name;
        let namespace = NAMESPACES[name];
        if (!namespace)
            NAMESPACES[name] = namespace = new Namespace({ name });
        if (!namespace)
            return [];
        const user = namespace.getUser({ name: socket.user });
        return [user, namespace];
    }
    /* ---------------------------------------------------------------------------------------*/
    connectUser(userOptions, callback) {
        let user = this.getUsers({ name: userOptions.name })[0];
        if (user && userOptions.socketId) {
            user.socketId = userOptions.socketId;
        }
        else {
            user = new user_1.User(userOptions);
        }
        callback(user);
        return user;
    }
    disconnectUser(user, callback, roomCallback) {
        if (!user)
            return;
        // Remove from rooms
        this.rooms.forEach(room => room.disconnectUser(user, roomCallback));
        callback();
    }
    joinRoom(roomId = exports.DEFAULT_ROOM__ID, user, roomCallback) {
        if (!user)
            return;
        this.rooms.forEach(room => {
            if (room.id === roomId) {
                room.addUser(user, roomCallback);
                if (EXPIRED_ROOMS[room.id])
                    delete EXPIRED_ROOMS[room.id];
                return;
            }
        });
    }
    updateRoom(roomOptions) {
        const room = this.getRoom(roomOptions.id);
        if (!room)
            return;
        room.update(roomOptions);
    }
    leaveRoom(roomId = exports.DEFAULT_ROOM__ID, user, roomCallback, roomDeleteCallback) {
        if (!user || !roomId || roomId === exports.DEFAULT_ROOM__ID)
            return;
        this.rooms.forEach(room => {
            if (room.id === roomId) {
                room.disconnectUser(user, roomCallback);
                // Timeout to delete room 
                if (!room.users.length)
                    EXPIRED_ROOMS[room.id] = setTimeout(() => {
                        this.deleteRoom(room.id);
                        roomDeleteCallback(room);
                    }, room_1.Room.ROOM_EXPIRATION);
                return;
            }
        });
    }
    deleteRoom(roomId) {
        this.rooms.splice(this.rooms.findIndex(r => r.id === roomId), 1);
    }
    createRoom(roomOptions, callback) {
        if (this.getRoom(roomOptions.id))
            return;
        const room = new room_1.Room(roomOptions);
        this.rooms.push(room);
        callback(room);
    }
    getUsers(options) {
        const defautRoom = this.getRoom();
        if (!options)
            return defautRoom.users;
        return defautRoom.users.filter(user => {
            const unmatched = Object.keys(options).filter(key => user[key] !== options[key]);
            return !unmatched.length;
        });
    }
    getAllUsers(users) {
        let returnedUsers = [];
        users.forEach(user => returnedUsers.push(...this.getUsers(user)));
        return returnedUsers;
    }
    getRoomsForUser(user) {
        if (!user)
            user = this.getUser({ name: user.name });
        return this.rooms.filter(room => room.isAllow(user.name));
    }
    getRoom(id = exports.DEFAULT_ROOM__ID) {
        return this.rooms.filter(room => room.id === id)[0];
    }
    getUser(options) {
        return this.getUsers({ name: options.name })[0];
    }
}
exports.Namespace = Namespace;
//# sourceMappingURL=namespace.js.map