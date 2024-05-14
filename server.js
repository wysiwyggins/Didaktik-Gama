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

app.use(express.static('public'));

const PORT = 3000;

function start() {
  server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
    if (!process.env.ELECTRON) {
      open(`http://localhost:${PORT}`);
    }
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

    socket.on('disconnect', () => {
      console.log('Client disconnected');
    });
  });

  app.get('/judgeName', (req, res) => {
    res.send({ judgeName });
  });

  console.log('Server and WebSocket server running on port', PORT);
}

module.exports = { start };
