interface NamespaceOptions{
    name: string
    rooms: any
}


export class Namespace{
    name: string;
    rooms: any;

    constructor(options:NamespaceOptions){
        if(options.name) throw new Error("Namespace need a name!");
        this.name = options.name;
        this.rooms
    }
}