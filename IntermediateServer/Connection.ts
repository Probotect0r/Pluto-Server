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

    protected dataHandler(data: Buffer){

    }

    protected errorHandler(error: Error){
        console.log('Error in socket connection', this.name != null ? this.name + ":" : ": ",  error.message) 
    }
}

export class ServerMetaConnection extends Connection {
    private files: Array<string> = []
    public streamConn: ServerStreamConnection
    private cb: Function

    constructor(socket: net.Socket){
        super(socket)

        console.log("New Meta connection. Requesting init_message.")
        // Request the init message
        let message = {
            type: "request_init_message"
        }
        this.socket.write(JSON.stringify(message))

    }

    protected initHandler(data: Buffer){
        let initMessage = JSON.parse(data.toString())
        this.name = initMessage.name
        this.files = initMessage.files
        console.log("Init message received for MetaConnection:", this.socket.address().address, this.name)
        this.socket.on("data", this.dataHandler.bind(this))
    }

    protected dataHandler(data: Buffer){

    }

    public requestStreamingConnection(file: string, start: number, end: number, cb: Function){
        console.log("Requesting streaming connection for file:", file)
        let message = {
            type: "request_streaming_connection",
            file,
            start,
            end
        }

        this.cb = cb
        this.socket.write(JSON.stringify(message))
    }

    public setStreamingConnection(streamConn: ServerStreamConnection, start: number, end: number){
        this.streamConn = streamConn
        this.cb(streamConn, start, end, () => {
            console.log("Requeting to start stream.")
            let message = {
                type: "start_stream"
            }

            streamConn.socket.write(JSON.stringify(message))

        })

    }
}

export class ServerStreamConnection extends Connection {
    private metaConnections: Array<ServerMetaConnection> = []

    constructor(socket: net.Socket, metaConnections: Array<ServerMetaConnection>){
        super(socket)
        this.metaConnections = metaConnections
        console.log("Requesting Stream init message.")
        // Request the init message
        let message = {
            type: "request_init_message"
        }
        this.socket.write(JSON.stringify(message))
    }

    protected initHandler(data: Buffer){
        let initMessage = JSON.parse(data.toString())
        this.name = initMessage.name
        console.log("Init message received for stream connection:", this.name)

        // Find the MetaConnection with the same name
        for(let metaConn of this.metaConnections) {
            if(metaConn.name === this.name){
                metaConn.setStreamingConnection(this, initMessage.start, initMessage.end) 
            }
        }
    }

}