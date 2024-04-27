let socket;
let spriteSheet;
let spriteData;
const CANVAS_COLS = 65;
const CANVAS_ROWS = 60;
const TILE_WIDTH = 20;   // Display size
const TILE_HEIGHT = 15;  // Display size
const SPRITESHEET_COLS = 23;
const SPRITESHEET_ROWS = 11;
let tileMap = [];  // Array to hold the tile data for the entire grid
let currentFigure = -1;
let toneStarted = false;
let soundPlayed = false; 
let sounds = [];

let geomancyBooleans = [];
let displayIndex = 0;  // Index for displaying symbols
let geomanticNames = ["Via", "Cauda Draconis", "Puer", "Fortuna Minor", "Puella", "Amissio", "Carcer", "Laetitia", "Caput Draconis", "Conjunctio", "Acquisitio", "Rubeus", "Fortuna Major", "Albus", "Tristitia", "Populus"];
let displayNames = false;
let nameIndex;
let finalFigureDisplayedTime = null; 

function preload() {
  spriteSheet = loadImage('assets/spritesheets/libuse40x30-cp437.png');
  spriteData = loadJSON('assets/spritesheets/spriteData.json');
  backgroundImage = loadImage('assets/images/geomancy_stage.png');
  for (let i = 1; i <= 10; i++) {
    sounds.push(loadSound('assets/sound/' + i + '.wav'));
  }
}

function setup() {
  socket = io.connect(window.location.origin);
  createCanvas(CANVAS_COLS * TILE_WIDTH, CANVAS_ROWS * TILE_HEIGHT);
  frameRate(30); // Set the frame rate so that draw() is called once per second
  generateGeomancyBooleans();
  initializeTileMap();  // Initialize the tile map with default values
  wave1 = new p5.Oscillator();
  wave1.amp(0.5);
  wave1.setType('triangle');
  wave2 = new p5.Oscillator();
  wave2.amp(0.5);
  wave2.setType('triangle');
  reverb = new p5.Reverb();
}

function initializeTileMap() {
  for (let y = 0; y < CANVAS_ROWS; y++) {
      tileMap[y] = [];
      for (let x = 0; x < CANVAS_COLS; x++) {
          tileMap[y][x] = 0; 
      }
  }
}


function booleansToNameIndex(booleans) {
  let binaryString = booleans.map(bool => bool ? '1' : '0').join('');
  return parseInt(binaryString, 2);
}

function draw() {
  background(255);
  image(backgroundImage, 0, 0, width, height);

  if (frameCount > 30) {
    for (let i = 0; i <= currentFigure; i++) {
      let pos = getPositionForFigure(i);
      let booleansIndex = i * 4;
      let booleansForFigure = geomancyBooleans.slice(booleansIndex, booleansIndex + 4);
      nameIndex = booleansToNameIndex(booleansForFigure);

      for (let j = 0; j < 4; j++) {
        displayGeomanticTile(booleansForFigure[j], pos.x, pos.y + j);
      }
      if (i >= 8) {
        displayGeomanticName(nameIndex, pos.x, pos.y + 4);
      }
    }

    if (frameCount % 30 === 0 && currentFigure < 14) {
      currentFigure++;
      let soundIndex = floor(random(2, 7));
      sounds[soundIndex].play();
      if (currentFigure == 14) {  // Check if the last figure was just displayed
        finalFigureDisplayedTime = millis();
      } else if (currentFigure == 15) {  
        console.log("Final figure ", geomanticNames[nameIndex]);
        socket.emit('sendJudgeName', { name: geomanticNames[nameIndex] });
      }
    }
  }

  // Check if 10 seconds have passed since the last figure was displayed
  if (finalFigureDisplayedTime && millis() - finalFigureDisplayedTime > 12000) {
    if (socket.connected) {
      socket.emit('requestSketchChange', { nextSketch: 'home' });
    } else { 
      window.location.href = 'home.html';
    }
  }
}


function displayGeomanticTile(isActive, x, y) {
  let tileName = isActive ? "TWO_BLACK_DIAMONDS" : "BLACK_DIAMOND_SUITE";
  let tileIndex = getTileIndex(tileName);
  if (tileIndex !== -1) {
    let sx = (tileIndex % SPRITESHEET_COLS) * 40;
    let sy = Math.floor(tileIndex / SPRITESHEET_COLS) * 30;
    let dx = x * TILE_WIDTH;
    let dy = y * TILE_HEIGHT;
    image(spriteSheet, dx, dy, TILE_WIDTH, TILE_HEIGHT, sx, sy, 40, 30);
    wave1.freq(100 + (isActive * 10) % random(1, 3));
    wave2.freq(100 - (isActive * 20) % random(1, 3));
  }
}

function displayGeomanticName(index, x, y) {
  let name = geomanticNames[index];
  // Calculate the centering offset
  
  let nameCenterOffset = Math.floor(name.length / 2);
  let startX = x * TILE_WIDTH - (nameCenterOffset * TILE_WIDTH);
  let startY = (y + 1) * TILE_HEIGHT;  // Adding one more TILE_HEIGHT for lowering the names

  for (let i = 0; i < name.length; i++) {
    let char = name[i];
    let tileIndex = getTileIndexFromChar(char);
    if (tileIndex !== -1) {
      let sx = (tileIndex % SPRITESHEET_COLS) * 40;
      let sy = Math.floor(tileIndex / SPRITESHEET_COLS) * 30;
      image(spriteSheet, startX + (i * TILE_WIDTH), startY, TILE_WIDTH, TILE_HEIGHT, sx, sy, 40, 30);
    } else {
      console.error("Invalid tile index for character", char);
    }
  }
  
}




function generateGeomancyBooleans() {
  geomancyBooleans = [];  // Reset the booleans array
  for (let i = 0; i < 60; i++) {  // Generate booleans for 15 figures
    geomancyBooleans.push(random([true, false]));
  }
}

function getPositionForFigure(index) {
  let x, y;
  if (index < 8) { // First row of 8 figures
    x = index * 8 + 4;  // Add offset of 4 tiles
    y = 4;  // Start 4 tiles down
  } else if (index < 12) { // Second row of 4 figures
    x = (index - 8) * 16 + 8; // Center these four in the grid, add offset
    y = 20;  // Move down to the 20th row
  } else if (index < 14) { // Third row of 2 figures
    x = (index - 12) * 32 + 16; // Larger spacing, add offset
    y = 36;
  } else { // Single figure in the last row
    x = 32;  // Center this figure, add offset
    y = 52;
  }
  
  return { x, y };
}



function getTileIndexFromChar(char) {
  let tileName = 'LATIN_CAPITAL_LETTER_' + char.toUpperCase();
  return spriteData.tiles[tileName] ? getTileIndex(tileName) : null;
}

function getTileIndex(tileName) {
  // Retrieve tile coordinates from JSON data
  let coords = spriteData.tiles[tileName];
  if (!coords || coords.length !== 2) {
      console.error("Tile not found or invalid coordinates:", tileName, coords);
      return -1; // Return -1 if the tile is not found or coordinates are invalid
  }
  return xyToIndex(coords[0], coords[1]);
}

function xyToIndex(x, y) {
  if (x === undefined || y === undefined) {
      console.error("Invalid tile coordinates:", x, y);
      return -1; // Return -1 for invalid coordinates
  }
  return y * SPRITESHEET_COLS + x;
}

function keyPressed(event) {
  if (event.key === '}') { 
    if (socket.connected) {
      socket.emit('requestSketchChange', { nextSketch: 'home' });
    } else { 
      window.location.href = 'home.html';
    }
  } else if (event.key === '{') {
    if (socket.connected) {
      socket.emit('requestSketchChange', { nextSketch: 'boot' });
    } else { 
      window.location.href = 'boot.html';
    }
  }
}