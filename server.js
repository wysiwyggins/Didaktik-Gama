// npm install express http socket.io onoff open
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const open = require('open');
const DMX = require('dmx');
const dmx = new DMX();
const universe = dmx.addUniverse('demo', 'enttec-usb-dmx-pro', '/dev/ttyUSB1');



// Server setup
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Serve static files from the public directory
app.use(express.static('public'));

// Start server and automatically open the default browser
const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
    open(`http://localhost:${PORT}`);
});


// WebSocket connection setup
io.on('connection', (socket) => {
    console.log('New client connected');

    socket.on('requestSketchChange', (data) => {
        console.log('Request to change sketch to:', data.nextSketch);
        // Convert the sketch name to an index and broadcast to all clients
        io.emit('changeSketch', mapSketchNameToIndex(data.nextSketch));
    });

    socket.on('sendJudgeName', (data) => {
        console.log('Last figure name received:', data.name);
        judgeName = data.name;
      });

    socket.on('setRGBLight', (data) => {
        setRGBLight(data.red, data.green, data.blue);
    });

    socket.on('setBlackLight', (state) => {
        setBlackLight(state);
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

function setRGBLight(red, green, blue) {
    universe.update({1: red, 2: green, 3: blue});
}

function setBlackLight(state) {
    universe.update({4: state ? 255 : 0});
}

// Map sketch names to their corresponding indexes
function mapSketchNameToIndex(sketchName) {
    const sketchMap = {
        'boot.js' : 0,
        'geomancy.js' : 1,
        'home.js' : 2,
        'game.js' : 3, 
        'abyss.js' : 4,
        'keyboard.js' : 5,
        'patterns.js' : 6,
        'mirror.js' : 7,
        'automata.js' : 8,
    };
    return sketchMap[sketchName] || 0; // Default to first sketch if name not found
}
