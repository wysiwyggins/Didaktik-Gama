const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const open = require('open');
const os = require('os');
const OSC = require('node-osc');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);
const oscClient = new OSC.Client('mosquittopi.local', 4560); 
let judgeName = '';
let universe;

// DMX setup only on Linux
if (os.platform() === 'linux') {
    const DMX = require('dmx');
    const dmx = new DMX();
    universe = dmx.addUniverse('demo', 'enttec-usb-dmx-pro', '/dev/ttyUSB1');
}

app.use(express.static('public'));

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
    open(`http://localhost:${PORT}`);
});

io.on('connection', (socket) => {
    console.log('New client connected');

    socket.on('sendJudgeName', (data) => {
        judgeName = data.name;
        io.emit('updateJudgeName', { judgeName });
        console.log('Judge name received and updated:', judgeName);
    });

    socket.on('baseColorChanged', (data) => {
        const { red, green, blue } = data;
        console.log(`Base color changed to Red: ${red}, Green: ${green}, Blue: ${blue}`);
        if (os.platform() === 'linux') {
            setRGBLight(red, green, blue);
        } else {
            oscClient.send('/setRGBLight', red, green, blue);
        }
    });

    socket.on('setRGBLight', (data) => {
        const { red, green, blue } = data;
        if (os.platform() === 'linux') {
            setRGBLight(red, green, blue);
        } else {
            oscClient.send('/setRGBLight', red, green, blue);
        }
    });

    socket.on('setBlackLight', (state) => {
        if (os.platform() === 'linux') {
            setBlackLight(state);
        } else {
            oscClient.send('/setBlackLight', state ? 255 : 0);
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

app.get('/judgeName', (req, res) => {
    res.send({ judgeName });
});

console.log('Server and WebSocket server running on port', PORT);
