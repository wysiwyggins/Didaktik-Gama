let grid = [];
let season = 0;
let day = 0;
let year = 0;
let thisJudgeName = "";
let soundPlaying = new Array(22).fill(false); // Array to track playing sounds


const judgeName = '';
const AUTOMATA_CANVAS_COLS = 50;
const AUTOMATA_CANVAS_ROWS = 40;
const MAX_YEAR = 10;
const MESSAGE_DISPLAY_DURATION_SECONDS = 1;



function preload() {
  auto2Spritesheet = loadImage('./assets/spritesheets/libuse40x30-cp437.png');
  for (let i = 1; i <= 22; i++) {
    sounds.push(loadSound('./assets/sound/' + i + '.wav'));
  }
}

function setup() {
  try {
    socket = io.connect('http://localhost:3000');
  } catch (error) {
    console.error('Socket connection failed.', error);
  }
  if (socket) {
    fetch('http://localhost:3000/judgeName')
        .then(response => response.json())
        .then(data => {
            const judgeName = data.judgeName;
            console.log('Judge name:', judgeName);
            if (judgeName != ""){
                console.log(`Your judge is ${judgeName}.`);
            }
        })
        .catch(error => console.error('Error fetching judge name:', error));
  } else {
      messageList.addMessage('You are not connected to the server.');
  }
  createCanvas(AUTOMATA_CANVAS_COLS * globalVars.TILE_WIDTH, AUTOMATA_CANVAS_ROWS * globalVars.TILE_HEIGHT);
  background(255);  // Initialize with white background
  initializeGrid();
}

function playSound(index) {
  if (!soundPlaying[index]) {
    soundPlaying[index] = true;
    sounds[index].play();
    sounds[index].onended(() => {
      soundPlaying[index] = false;
    });
  }
}


function displayMessage(message, seconds) {
  let messages = [message];  // Start with just the original message

  // Check if the message is longer than the grid width
  if (message.length > AUTOMATA_CANVAS_COLS) {
    const splitPoint = message.lastIndexOf(' ', AUTOMATA_CANVAS_COLS / 2);  // Find the last space before the midpoint
    messages = [
      message.substring(0, splitPoint),
      message.substring(splitPoint + 1)
    ];
  }

  // Blank the screen with tile 0
  for (let y = 0; y < AUTOMATA_CANVAS_ROWS; y++) {
    for (let x = 0; x < AUTOMATA_CANVAS_COLS; x++) {
      grid[x][y] = 0;
    }
  }

  for (let line = 0; line < messages.length; line++) {
    const msg = messages[line];
    const startX = Math.floor((AUTOMATA_CANVAS_COLS - msg.length) / 2);  // Center the message
    const startY = Math.floor(AUTOMATA_CANVAS_ROWS / 2) + line;  // Adjusted for multiple lines

    for (let i = 0; i < msg.length; i++) {
      const char = msg.charAt(i);
      const tileLocation = charToSpriteLocation(char);
      grid[startX + i][startY] = tileLocation.y * globalVars.SPRITESHEET_COLS + tileLocation.x;
    }
  }

  messageDisplayStart = frameCount;  // Store the frame when the message starts displaying
  displayDurationFrames = seconds * 24; 
}

function charToSpriteLocation(char) {
  let charCode = char.charCodeAt(0);
  let tileNumber = charCode; 
  let spriteColumn = tileNumber % globalVars.SPRITESHEET_COLS;
  let spriteRow = Math.floor(tileNumber / globalVars.SPRITESHEET_COLS);
  
  if(spriteColumn >= globalVars.SPRITESHEET_COLS) {
      spriteColumn = 0;
      spriteRow++;
  }

  return { x: spriteColumn, y: spriteRow };
}




function initializeGrid() {
  for (let i = 0; i < AUTOMATA_CANVAS_COLS; i++) {
    grid[i] = [];
    for (let j = 0; j < AUTOMATA_CANVAS_ROWS; j++) {
      grid[i][j] = floor(random(globalVars.SPRITESHEET_COLS * globalVars.SPRITESHEET_ROWS));
    }
  }
}

function reseedGrid() {
  for (let i = 0; i < AUTOMATA_CANVAS_COLS; i++) {
    for (let j = 0; j < AUTOMATA_CANVAS_ROWS; j++) {
      grid[i][j] = floor(random(globalVars.SPRITESHEET_COLS * globalVars.SPRITESHEET_ROWS));
    }
  }
}

function getTileIndex(tileName) {
  let coords = spritesheetData.tiles[tileName];
  if (!coords || coords.length !== 2) {
      console.error("Tile not found or invalid coordinates:", tileName, coords);
      return -1;
  }
  return coords[1] * globalVars.SPRITESHEET_COLS + coords[0];
}

function drawTile(i, j, val) {
  if (val % 2 === 0 && val !== 0 && i % 2 === 0 && j % 2 === 0) {
    fill(i*thisJudgeName.length + season, val*10+ season, val*20+ season); 
  } else {
    fill(255);  // White color
  }
  noStroke();
  rect(i * globalVars.TILE_WIDTH, j * globalVars.TILE_HEIGHT, globalVars.TILE_WIDTH, globalVars.TILE_HEIGHT);
  
  // Draw the tile on the canvas
  // Calculate the position of the tile in the spritesheet
  let x = (val % globalVars.SPRITESHEET_COLS) * globalVars.TILE_WIDTH;
  let y = floor(val / globalVars.SPRITESHEET_COLS) * globalVars.TILE_HEIGHT;
  image(auto2Spritesheet, i * globalVars.TILE_WIDTH, j * globalVars.TILE_HEIGHT, globalVars.TILE_WIDTH, globalVars.TILE_HEIGHT, x, y, globalVars.TILE_WIDTH, globalVars.TILE_HEIGHT);
}

function draw() {
  if (year < 1 && season < 3) {
    displayMessage('Photosensitive Epilepsy Warning, Flashing Images', MESSAGE_DISPLAY_DURATION_SECONDS);
  }
  if (messageDisplayStart !== -1 && (frameCount - messageDisplayStart) > displayDurationFrames) {
      reseedGrid();
      messageDisplayStart = -1;
  }

  day += 1;
  if (day > 30) {
    season += 1;
    day = 0;
  }
  if (season > 10) {
   season = 0;
   year += 1;
   console.log('Year:', year);
  }
  if (year >= MAX_YEAR) {  
    year = 0;
    window.location.href = 'home.html';
  }

  let updatedGrid = [];
  for (let i = 0; i < AUTOMATA_CANVAS_COLS; i++) {
    updatedGrid[i] = grid[i].slice();
  }

  for (let i = 0; i < AUTOMATA_CANVAS_COLS; i++) {
    for (let j = 0; j < AUTOMATA_CANVAS_ROWS; j++) {
      let val = grid[i][j];
      updatedGrid[i][j] = (val + 1) % (AUTOMATA_CANVAS_COLS * AUTOMATA_CANVAS_ROWS);

      if (val > year && season % 2 == 0) {
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                let ni = i + dx;
                let nj = j + dy;
                if (ni >= 0 && nj >= 0 && ni < AUTOMATA_CANVAS_COLS && nj < AUTOMATA_CANVAS_ROWS) {
                  updatedGrid[ni][nj] = 6 + season;
                } 
            }
        }
      }

      if (val == 6 - thisJudgeName.length && season % 2 == 0) {
        updatedGrid[i][j] = 4 + season;
        updateNeighbors(updatedGrid, i, j);
      }

      if (i == 0 && j == 0 && (day == 1 || day == 4)) {
        let soundIndex = val % 22;
        playSound(soundIndex);
      }

      drawTile(i, j, val);
    }
  }
  

  update3x3Blocks(updatedGrid);
  grid = updatedGrid;
  frameRate(24);
}

function updateNeighbors(grid, i, j) {
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      let ni = i + dx;
      let nj = j + dy;
      if (ni >= 0 && nj >= 0 && ni < AUTOMATA_CANVAS_COLS && nj < AUTOMATA_CANVAS_ROWS) {
        grid[ni][nj] = (day % 2 == 0) ? 6 : thisJudgeName.length;
      }
    }
  }
}

function update3x3Blocks(grid) {
  for (let i = 1; i < AUTOMATA_CANVAS_COLS - 1; i++) {
    for (let j = 1; j < AUTOMATA_CANVAS_ROWS - 1; j++) {
      if (is3x3BlockAllSix(grid, i, j)) {
        grid[i][j] = floor(random(globalVars.SPRITESHEET_COLS * globalVars.SPRITESHEET_ROWS));
      }
    }
  }
}

function is3x3BlockAllSix(grid, x, y) {
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      if (grid[x + dx][y + dy] !== 6 + season) {
        return false;
      }
    }
  }
  return true;
}
function keyPressed() {
  console.log("KeyPressed detected: Key = " + key + ", keyCode = " + keyCode);

  if (key === '}') { 
    window.location.href = 'home.html';
  } else if (event.key === '{') {
    window.location.href = 'hallways.html';
  } else if (event.key === 'Escape') {
    if (window.api) {
      window.api.quitApp();
    }
  }

}