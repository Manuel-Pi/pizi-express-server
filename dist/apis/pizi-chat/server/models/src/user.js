"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
class User {
    constructor(options) {
        if (!options.name && !options.socketId)
            throw new Error("User need a name or socket Id!");
        this.name = options.name;
        this.socketId = options.socketId;
    }
    getJson() {
        return {
            name: this.name,
            socketId: this.socketId
        };
    }
}
exports.User = User;
//# sourceMappingURL=user.js.map