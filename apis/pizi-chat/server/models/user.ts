interface UserOptions{
    name: string
    socketId: any
}


export class User{
    name: string;
    socketId: string;

    constructor(options:UserOptions){
        if(options.name) throw new Error("USer need a name!");
        this.name = options.name;
        this.socketId = options.socketId;
    }
}