
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = require('express')();
const server = http.createServer(app);
const io = socketIo(server);

const axios = require('axios');
const cors = require('cors');
app.use(cors());


const rpio = require('rpio');

// Define the API endpoint and the authorization token
const API_ENDPOINT = 'https://www.mudroom.rip/api/v1/game/tableau/';
const AUTH_TOKEN = '09ffd5502a88adff798a5299455c530ee9db6a48';  // Replace with your actual token

// Function to load data from the API
const loadDataFromAPI = async () => {
  try {
    const response = await axios.get(API_ENDPOINT, {
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`  // Use Bearer token for authorization
      }
    });
    // Here we log the JSON response, you can do other things with it
    console.log(response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching data from API:', error);
  }
};



app.use(express.static('public'));  // serves files from 'public' directory

io.on('connection', async (socket) => {
    console.log('a user connected');

    // Fetch the data from API
    const data = await loadDataFromAPI();
    
    // Emit the room data to the p5.js sketch
    if (data && data.room) {
        socket.emit('roomData', data.room);
        console.log(data.room);
    } else {
        socket.emit('error', 'Room data is not available');
    }

    // handle disconnection
    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

server.listen(3000, () => {
    console.log('Listening on port 3000');
});

