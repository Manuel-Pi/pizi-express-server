"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
class User {
    constructor(options) {
        if (options.name)
            throw new Error("USer need a name!");
        this.name = options.name;
        this.socketId = options.socketId;
    }
}
exports.User = User;
//# sourceMappingURL=user.js.map