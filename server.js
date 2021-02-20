var http = require('http'),
    WebSocketServer = require('ws').Server,
    port = 3000,
    host = 'localhost';

class Room {
    constructor(id) {
        this.id = id;
        this.draw = [];
    }
}

// create a new HTTP server to deal with low level connection details (tcp connections, sockets, http handshakes, etc.)
var server = http.createServer();

let rooms = [new Room(1)];

// create a WebSocket Server on top of the HTTP server to deal with the WebSocket protocol
var wss = new WebSocketServer({
    server: server
});

// create a function to be able do broadcast messages to all WebSocket connected clients
wss.broadcast = function broadcast(message) {
    wss.clients.forEach(function each(client) {
        client.send(message);
    });
};

// Register a listener for new connections on the WebSocket.
wss.on('connection', function (client, request) {
    for (let room of rooms) {
        let message = {
            type: 'newRoom',
            roomId: room.id,
        };
        client.send(JSON.stringify(message));
    }

    // Register a listener on each message of each connection
    client.on('message', function (message) {
        let msg = JSON.parse(message);
        switch (msg.type) {
            case 'message':
                message = {
                    type: 'message',
                    data: msg.data
                };
                wss.broadcast(JSON.stringify(message));
                break;
            case 'createRoom':
                var room = new Room(rooms.length+1);
                rooms.push(room);
                message = {
                    type: 'newRoom',
                    roomId: room.id
                };
                wss.broadcast(JSON.stringify(message));
                client.send(JSON.stringify({type: 'changeRoom', roomId: room.id}));
                break;
            case 'clearRoom':
                rooms[msg.roomId-1].draw = [];
                wss.broadcast(JSON.stringify(msg));
                break;
            case 'drawing':
                rooms[msg.roomId-1].draw.push(
                    msg
                );
                wss.broadcast(JSON.stringify(msg));
                break;
            case 'getDrawing':
                rooms.forEach(room => {
                    room.draw.forEach(draw => {
                        client.send(JSON.stringify(draw));
                    });
                });
                break;
        }
    });
});


// http sever starts listening on given host and port.
server.listen(port, host, function () {
    console.log('Listening on ' + server.address().address + ':' + server.address().port);
});

process.on('SIGINT', function () {
    process.exit(0);
});
