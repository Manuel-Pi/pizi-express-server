import { User } from "./user";

interface RoomOptions{
    name: string
    private: boolean
    users: User[]
    allowedUsers: User[]
}

export class Room{
    name: string
    users: User[]
    private: boolean
    allowedUsers: User[]

    constructor(options:RoomOptions){
        if(options.name) throw new Error("Namespace need a name!");
        this.name = options.name;
        this.private = options.private || false;
        if(options.users) this.users.push(...options.users)
    }
}