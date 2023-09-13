let spritesheet;
const TILE_WIDTH = 40;
const TILE_HEIGHT = 30;
const GRID_WIDTH = 51;
const GRID_HEIGHT = 40;
const SPRITESHEET_COLS = 23;
const SPRITESHEET_ROWS = 11;
let grid = [];
let sounds = [];
let season = 0;
let day = 0;
let year = 0;

function preload() {
  // Assuming the image is named 'spritesheet.png' and is in the same directory
  spritesheet = loadImage('spritesheet.png');
  // Load sounds
  for (let i = 1; i <= 22; i++) {
    sounds.push(loadSound('sounds/' + i + '.wav'));
  }
}

function setup() {
  createCanvas(GRID_WIDTH * TILE_WIDTH, GRID_HEIGHT * TILE_HEIGHT);
  background(255);  // Initialize with white background
  
  // Initialize grid with random values
  for (let i = 0 + season; i < GRID_WIDTH; i++) {
    grid[i] = [];
    for (let j = 0; j < GRID_HEIGHT; j++) {
      grid[i][j] = floor(random(SPRITESHEET_COLS * SPRITESHEET_ROWS));
    }
  }
}

function reseedGrid() {
  for (let i = 0; i < GRID_WIDTH; i++) {
    for (let j = 0; j < GRID_HEIGHT; j++) {
      grid[i][j] = floor(random(SPRITESHEET_COLS * SPRITESHEET_ROWS));
    }
  }
}

function charToSpriteLocation(char) {
  let charCode = char.charCodeAt(0);
  let tileNumber = charCode; 
  let spriteColumn = tileNumber % SPRITESHEET_COLS;
  let spriteRow = Math.floor(tileNumber / SPRITESHEET_COLS);
  
  if(spriteColumn >= SPRITESHEET_COLS) {
      spriteColumn = 0;
      spriteRow++;
  }

  return { x: spriteColumn, y: spriteRow };
}
let messageDisplayStart = -1;
let displayDurationFrames = 0;

function displayMessage(message, seconds) {
  let messages = [message];  // Start with just the original message

  // Check if the message is longer than the grid width
  if (message.length > GRID_WIDTH) {
    const splitPoint = message.lastIndexOf(' ', GRID_WIDTH / 2);  // Find the last space before the midpoint
    messages = [
      message.substring(0, splitPoint),
      message.substring(splitPoint + 1)
    ];
  }

  // Blank the screen with tile 0
  for (let y = 0; y < GRID_HEIGHT; y++) {
    for (let x = 0; x < GRID_WIDTH; x++) {
      grid[x][y] = 0;
    }
  }

  for (let line = 0; line < messages.length; line++) {
    const msg = messages[line];
    const startX = Math.floor((GRID_WIDTH - msg.length) / 2);  // Center the message
    const startY = Math.floor(GRID_HEIGHT / 2) + line;  // Adjusted for multiple lines

    for (let i = 0; i < msg.length; i++) {
      const char = msg.charAt(i);
      const tileLocation = charToSpriteLocation(char);
      grid[startX + i][startY] = tileLocation.y * SPRITESHEET_COLS + tileLocation.x;
    }
  }

  messageDisplayStart = frameCount;  // Store the frame when the message starts displaying
  displayDurationFrames = seconds * 30;  // Assuming frameRate is 30 fps
}

function drawTile(i, j, val) {
  // Clear the specific tile location based on tile value
  if (val % 2 === 0 && val !== 0) {
    fill(i*10 + season, val*10+ season, val*20+ season); 
  } else {
    fill(255);  // White color
  }
  noStroke();
  rect(i * TILE_WIDTH, j * TILE_HEIGHT, TILE_WIDTH, TILE_HEIGHT);
  
  // Draw the tile on the canvas
  // Calculate the position of the tile in the spritesheet
  let x = (val % SPRITESHEET_COLS) * TILE_WIDTH;
  let y = floor(val / SPRITESHEET_COLS) * TILE_HEIGHT;
  image(spritesheet, i * TILE_WIDTH, j * TILE_HEIGHT, TILE_WIDTH, TILE_HEIGHT, x, y, TILE_WIDTH, TILE_HEIGHT);
}

function is3x3BlockAllSix(x, y) {
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      if (grid[x + dx][y + dy] !== 6 + season) {
        return false;
      }
    }
  }
  return true;
}

function draw() {
  if (year < 1) {
    displayMessage('Photosensitive Epilepsy Warning, Flashing Images 10 minutes', 2);
  }
  if (year > 1 && year < 2) {
    displayMessage('Season: ' + season + ' Day: ' + day + ' Year: ' + year, 2);
  }
  if (messageDisplayStart !== -1 && (frameCount - messageDisplayStart) > displayDurationFrames) {
      reseedGrid();  // Reseed the grid to remove the message after its duration
      messageDisplayStart = -1;
  }
  

  day +=1;
  if (day > 30) {
    season += 1;
    day = 0;
  }
  if (season > 10) {
   season = 0;
   year += 1;
  }
  if (year > 10) {  
    year = 0;
  }


  // Create a copy of the grid to store updates, so we aren't reading and writing from the same grid simultaneously.
  let updatedGrid = [];
  for (let i = 0; i < GRID_WIDTH; i++) {
    updatedGrid[i] = grid[i].slice();
  }

  for (let i = 0; i < GRID_WIDTH; i++) {
    for (let j = 0; j < GRID_HEIGHT; j++) {
      let val = grid[i][j];

      // If the current tile has a value of 6, set all its neighbors to 6
      if (val == 6 - season) {
        for (let dx = -1; dx <= 1; dx++) {
          for (let dy = -1; dy <= 1; dy++) {
            let ni = i + dx;
            let nj = j + dy;

            if (ni >= 0 && nj >= 0 && ni < GRID_WIDTH && nj < GRID_HEIGHT) {
              updatedGrid[ni][nj] = 6;
            }
          }
        }
      }

      // Draw the tile on the canvas
      drawTile(i, j, val);
      
      // Increment the value for the next frame
      updatedGrid[i][j] = (val + 1) % (SPRITESHEET_COLS * SPRITESHEET_ROWS);
      if (i == 0 && j == 0 && (day == 1 || day == 4) ) {
        let soundIndex = val % 22;
        sounds[soundIndex].play();
      }
    }
  }

  // Check for the 3x3 blocks having all values as 6
  for (let i = 1; i < GRID_WIDTH - 1; i++) {
    for (let j = 1; j < GRID_HEIGHT - 1; j++) {
      if (is3x3BlockAllSix(i, j)) {
        updatedGrid[i][j] = floor(random(SPRITESHEET_COLS * SPRITESHEET_ROWS));
      }
    }
  }

  grid = updatedGrid;
  frameRate(30);
}