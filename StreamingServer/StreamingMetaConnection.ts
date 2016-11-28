import net = require('net')
import os = require('os')
import fs = require('fs')

export class Connection {
    protected socket: net.Socket
    protected name: string
    protected files: Array<string>

    constructor(port: number) {
        this.name = os.hostname()    
        this.socket = net.connect({port})
        this.files = fs.readdirSync(__dirname + '/videos/')

        this.socket.on("connect", this.initHandler.bind(this))
        this.socket.on("data", this.dataHandler.bind(this))
        this.socket.on("error", this.errorHandler.bind(this))
    }

    protected initHandler(data: Buffer){}

    protected dataHandler(data: Buffer){}

    protected errorHandler(error: Error){
        console.log("Connection Error:", this.name, error.message)
    }
}

export class StreamingMetaConnection extends Connection{
    protected streamConns: Array<StreamingConnection> = []

    constructor(){
        super(8090)
    }

    protected initHandler(){
        // Connection established, send init message
        console.log("Established Meta Connection to Intermediate Server")
    }

    protected dataHandler(data: Buffer){
        let message = JSON.parse(data.toString())
        switch (message.type) {
            case "request_init_message":
                console.log("Request for meta_init_message received.")
                let sendMessage = {
                    type: "meta_init_message",
                    name: this.name,
                    files: this.files
                }

                console.log("Sending meta_init_message.")
                this.socket.write(JSON.stringify(sendMessage))
                break
            case "request_streaming_connection":
                console.log("Streaming connection requested:", message.file, message.start, message.end, message.reqID)
                this.streamConns.push(new StreamingConnection(message.file, message.start, message.end || undefined, message.reqID)) 
                break
        }
    }

}

export class StreamingConnection extends Connection {
    protected file: string
    protected start: number 
    protected end: number
    protected reqID: string

    constructor(file: string, start: number, end: number, reqID: string){
        super(8091)
        this.file = file
        this.start = start
        this.reqID = reqID

        // Determine the end
        if(end){
            this.end = end
        } else {
            let stats: fs.Stats = fs.statSync(__dirname + "/videos/" + this.file) 
            this.end = stats.size - 1
        }
    }

    protected initHandler(){   
        console.log("Established Streaming connection to intermediate server.")
    }

    protected dataHandler(data: Buffer){
        let message = JSON.parse(data.toString())
        switch (message.type) {
            case "request_init_message":
                console.log("stream_init_message requested.")
                // send init message
                let message = {
                    type: "stream_init_message",
                    name: this.name,
                    start: this.start,
                    end: this.end,
                    reqID: this.reqID
                }

                this.socket.write(JSON.stringify(message))
                break

            case "start_stream":
                console.log("start_stream requested.")
                // Start streaming
                let stream = fs.createReadStream(__dirname + "/videos/" + this.file, { start: this.start })
                    .on("open", () => {
                        console.log("Piping file stream to stream connection.")
                        stream.pipe(this.socket)
                    })
                    .on("error", (err: Error) => {
                        console.log("Error while opening file stream:", err.message)
                    })
                break
        }
    }

    protected startStreaming(){

    }
}