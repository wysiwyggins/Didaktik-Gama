let currentSketch = 0;
const sketches = ['saltwave.js', 'abyss.js', 'game.js', 'keyboard.js']; 

let socket;  // Socket connection


function draw() {
  // Call the current sketch's draw function
  sketches[currentSketch].setup();
  sketches[currentSketch].draw();
}

// Listen for events from the server
socket.on('rotaryChange', (direction) => {
  if (direction === 'increment') {
    currentSketch = (currentSketch + 1) % sketches.length;
  } else if (direction === 'decrement') {
    currentSketch = (currentSketch - 1 + sketches.length) % sketches.length;
  }
  sketches[currentSketch].setup(); // Initialize the new sketch
});

socket.on('buttonPress', () => {
  // Handle button press if you need to do something specific
});
function setup() {
  socket = io.connect('http://localhost:3000');

  socket.on('potentiometer', (data) => {
    potentiometerValue = data;
  });
  socket.on('roomData', (data) => {
    roomData = data; // Store the room data
  });
  
  // Initialize grid with random values
}

