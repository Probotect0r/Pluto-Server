import { Connection } from './Connection'
import { ServerStreamConnection } from './ServerStreamConnection'

import net = require('net')

export class ServerMetaConnection extends Connection {
    private files: Array<string> = []
    public streamConns: any = {}
    private cb: any = {}

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

    public requestStreamingConnection(file: string, start: number, end: number, reqID: string, cb: Function){
        console.log("Requesting streaming connection:", reqID)
        let message = {
            type: "request_streaming_connection",
            reqID,
            file,
            start,
            end
        }

        this.cb[reqID] = cb
        this.socket.write(JSON.stringify(message))
    }

    public setStreamingConnection(streamConn: ServerStreamConnection, start: number, end: number, reqID: string){
        //this.streamConns[reqID] = streamConn
        this.cb[reqID](streamConn, start, end, () => {
            console.log("Requesting to start stream.")
            let message = {
                type: "start_stream"
            }

            streamConn.socket.write(JSON.stringify(message))

        })
    }

    public removeStreamingConnection(reqID: string){
        // Clear the associated Streaming Connection and it's Callback
        //delete this.streamConns[reqID]
        delete this.cb[reqID]
    }
}