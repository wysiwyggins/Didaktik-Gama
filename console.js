const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const DMX = require('node-dmx');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Serve files from the public directory
app.use(express.static('public'));

// DMX setup
const dmx = new DMX();
const universe = dmx.addUniverse('demo', 'enttec-usb-dmx-pro', '/dev/ttyUSB0');

io.on('connection', (socket) => {
  console.log('New client connected');

  socket.on('setDMXColor', (color) => {
    console.log('Setting DMX color:', color);
    // Assuming channels 1, 2, 3 are for RGB respectively
    universe.update({ 1: color.r, 2: color.g, 3: color.b });
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
