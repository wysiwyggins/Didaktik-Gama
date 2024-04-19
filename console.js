//npm install onoff
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

// Start server and open browser
const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
    open(`http://localhost:${PORT}`);  // Automatically opens the default browser
});

// WebSocket connection setup
io.on('connection', (socket) => {
  console.log('New client connected');

  socket.on('requestSketchChange', (data) => {
      console.log('Request to change sketch to:', data.nextSketch);
      // Broadcast or emit to all clients to change the sketch
      io.emit('changeSketch', mapSketchNameToIndex(data.nextSketch));
  });

  socket.on('disconnect', () => {
      console.log('Client disconnected');
  });
});

// Function to map sketch names to their corresponding indexes
function mapSketchNameToIndex(sketchName) {
  const sketchMap = {
      'knit': 1,
      'mirror': 2,
      'game': 3,
      'saltwave': 4,
      'keyboard': 5,
      'abyss': 6,
  };
  return sketchMap[sketchName] || 0; // Default to first sketch if name not found
}

// Rotary encoder event handling
function updateEncoder() {
    const MSB = encoderA.readSync();
    const LSB = encoderB.readSync();
    const encoded = (MSB << 1) | LSB;
    const sum = (lastEncoded << 2) | encoded;

    if (sum === 0b1101 || sum === 0b0100 || sum === 0b0010 || sum === 0b1011) {
        encoderValue++;
    } else if (sum === 0b1110 || sum === 0b0111 || sum === 0b0001 || sum === 0b1000) {
        encoderValue--;
    }

    lastEncoded = encoded;
    io.emit('changeSketch', encoderValue); // Emitting the change sketch event with the new value
}

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
