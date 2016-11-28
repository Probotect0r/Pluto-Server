import net = require('net')

export class Connection {
    public socket: net.Socket
    public name: string
    constructor(socket: net.Socket){
        this.socket = socket
        this.socket.once("data", this.initHandler.bind(this))
        this.socket.on("error", this.errorHandler.bind(this))
    }

    protected initHandler(data: Buffer){
        let initMessage = JSON.parse(data.toString())
        this.name = initMessage.name
        this.socket.on("data", this.dataHandler.bind(this))
    }

    protected dataHandler(data: Buffer){}

    protected errorHandler(error: Error){
        console.log('Error in socket connection', this.name != null ? this.name + ":" : ": ",  error.message) 
    }
}