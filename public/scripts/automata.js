let grid = [];
let season = 0;
let day = 0;
let year = 0;

const judgeName = '';
const AUTOMATA_CANVAS_COLS = 50;
const AUTOMATA_CANVAS_ROWS = 40;
const MAX_YEAR = 10;
const MESSAGE_DISPLAY_DURATION_SECONDS = 1;

function preload() {
  spritesheet = loadImage('./assets/spritesheets/libuse40x30-cp437.png');
  for (let i = 1; i <= 22; i++) {
    sounds.push(loadSound('./assets/sound/' + i + '.wav'));
  }
}

function setup() {
  try {
    socket = io.connect(window.location.origin);
  } catch (error) { 
      console.error('Socket connection failed.');
  }
  createCanvas(AUTOMATA_CANVAS_COLS * globalVars.TILE_WIDTH, AUTOMATA_CANVAS_ROWS * globalVars.TILE_HEIGHT);
  background(255);  // Initialize with white background
  initializeGrid();
  if (socket) {
    fetch('/judgeName')
        .then(response => response.json())
        .then(data => {
            judgeName = data.judgeName;
        })
        .catch(error => console.error('Error fetching judge name:', error));
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
  fill((val % 2 === 0 && val !== 0) ? (i * 10 + season) : 100, (val % 2 === 1 && val !== 0) ? (j * 10 + judgeName.length) : 255, 100);
  noStroke();
  rect(i * globalVars.TILE_WIDTH, j * globalVars.TILE_HEIGHT, globalVars.TILE_WIDTH, globalVars.TILE_HEIGHT);
  let x = (val % globalVars.SPRITESHEET_COLS) * globalVars.TILE_WIDTH;
  let y = floor(val / globalVars.SPRITESHEET_COLS) * globalVars.TILE_HEIGHT;
  image(spritesheet, i * globalVars.TILE_WIDTH, j * globalVars.TILE_HEIGHT, globalVars.TILE_WIDTH, globalVars.TILE_HEIGHT, x, y, globalVars.TILE_WIDTH, globalVars.TILE_HEIGHT);
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
  if (year > MAX_YEAR) {  
    year = 0;
    window.location.href = 'patterns.html';
  }

  let updatedGrid = [];
  for (let i = 0; i < AUTOMATA_CANVAS_COLS; i++) {
    updatedGrid[i] = grid[i].slice();
  }

  for (let i = 0; i < AUTOMATA_CANVAS_COLS; i++) {
    for (let j = 0; j < AUTOMATA_CANVAS_ROWS; j++) {
      let val = grid[i][j];
      updatedGrid[i][j] = (val + 1) % (globalVars.SPRITESHEET_COLS * globalVars.SPRITESHEET_ROWS);

      if (year > 3 && year < 4){
        if (val == judgeName.length) {
          updateNeighbors(updatedGrid, i, j);
        }
      }

      if (year > 7 && year < 8){
        if (val > year && season % 2 == 0) {
          updateNeighbors(updatedGrid, i, j);
        }
      }

      if (year > 10 && year < 20){
        if (val == year && season % 2 == 0) {
          updateNeighbors(updatedGrid, i, j);
        }
      }

      if (val == 6 - judgeName.length && season % 2 == 0) {
        updateNeighbors(updatedGrid, i, j);
      }

      if (i == 0 && j == 0 && (day == 1 || day == 4) ) {
        let soundIndex = val % 22;
        sounds[soundIndex].play();
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
        grid[ni][nj] = (day % 2 == 0) ? 6 : judgeName.length;
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
    window.location.href = 'patterns.html';
  } else if (event.key === '{') {
    window.location.href = 'keyboard.html';
  }

}