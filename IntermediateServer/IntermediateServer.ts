import net = require('net')
import http = require('http')

import { ServerMetaConnection, ServerStreamConnection } from './Connection'


// Keep track of all MetaConnections
let metaConnections: Array<ServerMetaConnection> = []

// Create tcp connection server
let metaConnServer: net.Server = net.createServer(metaConnHandler)
let streamConnServer: net.Server = net.createServer(streamConnHandler)

function metaConnHandler(s: net.Socket){
    metaConnections.push(new ServerMetaConnection(s))
}

function streamConnHandler(s: net.Socket){
    new ServerStreamConnection(s, metaConnections)
}

metaConnServer.listen({
    port: 8090,
    host: 'localhost'
})

streamConnServer.listen({
    port: 8091,
    host: 'localhost'
})

console.log("TCP servers started.");

// Set up http server
const httpServer: http.Server = http.createServer(httpHandler)

function httpHandler(req: http.IncomingMessage, res: http.ServerResponse){
    if(req.url !== "/video.mp4") return res.end("Please visit /video.mp4")

    let range = req.headers.range
    if (!range) {
       // 416 Wrong range
       res.statusCode = 416
       return res.end()
    }

    var positions = range.replace(/bytes=/, "").split("-");
    var start = parseInt(positions[0], 10);
    var end = positions[1] ? parseInt(positions[1], 10) : undefined

    // TODO: Add code for finding the correct MetaConnection based on the file being requested.

    // Request the streaming connection on the MetaConnection
    metaConnections[0].requestStreamingConnection("video.mp4", start, end, (streamConn: ServerStreamConnection, start: number, end: number, beginStream) => {
        let size = end + 1
         res.writeHead(206, {
            "Content-Range": "bytes " + start + "-" + end + "/" + size,
            "Accept-Ranges": "bytes",
            "Content-Length": (end - start) + 1,
            "Content-Type": "video/mp4"
        });
        streamConn.socket.pipe(res)
        beginStream()
    });

}

httpServer.listen(8080)

console.log("HTTP Server Started")