"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Room = void 0;
class Room {
    constructor(options) {
        if (!options.name)
            throw new Error("Namespace need a name!");
        this.name = options.name;
        this.private = options.private || false;
        if (options.users)
            this.users.push(...options.users);
    }
}
exports.Room = Room;
//# sourceMappingURL=room.js.map