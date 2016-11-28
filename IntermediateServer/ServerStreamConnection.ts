import { Connection } from './Connection'
import { ServerMetaConnection } from './ServerMetaConnection'

import net = require('net')

export class ServerStreamConnection extends Connection {
    // Array of all meta connections
    private metaConnections: Array<ServerMetaConnection> = []

    // Associated Meta Connection
    private metaConnection: ServerMetaConnection;
    private reqID: string

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
        this.reqID = initMessage.reqID
        console.log("Init message received for stream connection:", this.name, this.reqID)

        // Find the MetaConnection with the same name
        // and add this to the streaming connections of that
        for(let metaConn of this.metaConnections) {
            if(metaConn.name === this.name){
                this.metaConnection = metaConn
                metaConn.setStreamingConnection(this, initMessage.start, initMessage.end, initMessage.reqID) 
            }
        }
    }

    public endConnection(){
        // End this connection
        console.log('Ending Streaming connection:', this.reqID)
        this.socket.destroy()
        this.metaConnection.removeStreamingConnection(this.reqID)
    }

}