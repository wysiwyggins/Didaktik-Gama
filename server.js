const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const open = require('open');
const os = require('os');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Define a variable to hold judgeName
let judgeName = '';

// DMX setup only on Linux
let universe;
if (os.platform() === 'linux') {
    const DMX = require('dmx');
    const dmx = new DMX();
    universe = dmx.addUniverse('demo', 'enttec-usb-dmx-pro', '/dev/ttyUSB1');
}

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

    socket.on('sendJudgeName', (data) => {
        console.log('Last figure name received:', data.name);
        // Store the received judge name in the variable
        judgeName = data.name;
    });

    socket.on('setRGBLight', (data) => {
        if (os.platform() === 'linux') {
            setRGBLight(data.red, data.green, data.blue);
        } else {
            console.log('DMX functionality not available on this platform.');
        }
    });

    socket.on('setBlackLight', (state) => {
        if (os.platform() === 'linux') {
            setBlackLight(state);
        } else {
            console.log('DMX functionality not available on this platform.');
        }
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

function setRGBLight(red, green, blue) {
    if (universe) {
        universe.update({1: red, 2: green, 3: blue});
    }
}

function setBlackLight(state) {
    if (universe) {
        universe.update({4: state ? 255 : 0});
    }
}
