// npm install express http socket.io onoff open
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const { Gpio } = require('onoff');
const open = require('open');

// GPIO setup for the rotary encoder
const encoderA = new Gpio(17, 'in', 'both');
const encoderB = new Gpio(18, 'in', 'both');
let lastEncoded = 0;
let encoderValue = 0;

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

    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

// Map sketch names to their corresponding indexes
function mapSketchNameToIndex(sketchName) {
    const sketchMap = {
        'boot': 1,
        'home': 2, 
        'game': 3,
        'mirror': 4,
        'knit': 5,
        'saltwave': 6,
        'keyboard': 7,
        'abyss': 8,
    };
    return sketchMap[sketchName] || 0; // Default to first sketch if name not found
}

// Rotary encoder event handling
function updateEncoder() {
    const MSB = encoderA.readSync();
    const LSB = encoderB.readSync();
    const encoded = (MSB << 1) | LSB;
    const sum = (lastEncoded << 2) | encoded;
    const numberOfSketches = 7; // Total number of sketches including 'boot.js'

    if ([0b1101, 0b0100, 0b0010, 0b1011].includes(sum)) {
        encoderValue = (encoderValue + 1) % numberOfSketches;
    } else if ([0b1110, 0b0111, 0b0001, 0b1000].includes(sum)) {
        encoderValue = (encoderValue - 1 + numberOfSketches) % numberOfSketches;
    }

    lastEncoded = encoded;
    io.emit('changeSketch', encoderValue); // Emitting the change sketch event with the new value
}

// Watch for changes on encoder pins
encoderA.watch((err) => {
    if (err) {
        console.error('Error watching encoder A:', err);
        return;
    }
    updateEncoder();
});

encoderB.watch((err) => {
    if (err) {
        console.error('Error watching encoder B:', err);
        return;
    }
    updateEncoder();
});
