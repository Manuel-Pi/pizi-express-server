import { z } from "zod";
import bcrypt from "bcrypt";
import { Model } from "./Model.js";
const SALT_ROUNDS = parseInt(process.env.PASSWORD_SALT_ROUNDS);
export class User extends Model {
    static Schema = {
        email: z.string().email().trim(),
        password: z.string(),
        username: z.string().min(3).max(40).trim()
    };
    static PrivateAttributes = ["password"];
    email;
    username;
    password;
    constructor(user) {
        super(user);
        this.assign(user);
    }
    checkPassword(password) {
        try {
            z.string().regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/).parse(password);
        }
        catch (e) {
            throw new Error(`invalid password: minimum eight characters, at least one uppercase letter, one lowercase letter, one number and one special character`);
        }
    }
    async encryptPassword() {
        this.checkPassword(this.password);
        this.password = await bcrypt.hash(this.password, SALT_ROUNDS);
    }
    async validatePassword(password) {
        return await bcrypt.compare(password, this.password);
    }
}
//# sourceMappingURL=User.js.map