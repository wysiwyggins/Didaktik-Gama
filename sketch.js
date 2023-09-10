let spritesheet;
const TILE_WIDTH = 40;
const TILE_HEIGHT = 30;
const GRID_WIDTH = 40;
const GRID_HEIGHT = 40;
const SPRITESHEET_COLS = 23;
const SPRITESHEET_ROWS = 11;
let grid = [];
let sounds = [];
let season = 0;
let day = 0;

const BOX_TOP_LEFT = xyToIndex(8, 9);
const BOX_HORIZONTAL = xyToIndex(11, 8);
const BOX_VERTICAL = xyToIndex(17, 7);
const BOX_TOP_RIGHT = xyToIndex(6, 8);  
const BOX_BOTTOM_LEFT = xyToIndex(5, 1);
const BOX_BOTTOM_RIGHT = xyToIndex(7, 9);
const BOX_VERTICAL_HORIZONTAL = xyToIndex(12,8);
const BOX_UP_HORIZONTAL = xyToIndex(8,8);
const BOX_LEFT_VERTICAL = xyToIndex(18,7);
const BOX_RIGHT_VERTICAL = xyToIndex(10,8);
const BOX_DOWN_HORIZONTAL = xyToIndex(9,8);
const BOX_HORIZONTAL_HALF = xyToIndex(20,10);



function preload() {
  // Assuming the image is named 'spritesheet.png' and is in the same directory
  spritesheet = loadImage('spritesheet.png');
  // Load sounds
  for (let i = 1; i <= 22; i++) {
    sounds.push(loadSound('sounds/' + i + '.wav'));
  }
}

function xyToIndex(x, y) {
  return y * SPRITESHEET_COLS + x;
}

function isBoxTile(val) {
  return [
    BOX_TOP_LEFT, BOX_HORIZONTAL, BOX_VERTICAL, 
    BOX_TOP_RIGHT, BOX_BOTTOM_LEFT, BOX_BOTTOM_RIGHT,
    BOX_VERTICAL_HORIZONTAL, BOX_UP_HORIZONTAL, BOX_LEFT_VERTICAL,
    BOX_RIGHT_VERTICAL, BOX_DOWN_HORIZONTAL, BOX_HORIZONTAL_HALF
  ].includes(val);
}

function addConnectingTile(i, j, updatedGrid) {
  let randChoice = (arr) => arr[floor(random(arr.length))];

  if (grid[i][j] === BOX_TOP_LEFT) {
    if (i+1 < GRID_WIDTH && !isBoxTile(grid[i+1][j])) {
      updatedGrid[i+1][j] = randChoice([BOX_HORIZONTAL, BOX_VERTICAL_HORIZONTAL,BOX_TOP_RIGHT,]);
    }
    if (j+1 < GRID_HEIGHT && !isBoxTile(grid[i][j+1])) {
      updatedGrid[i][j+1] = randChoice([BOX_VERTICAL, BOX_BOTTOM_LEFT, BOX_VERTICAL_HORIZONTAL]);
    }
  }

  if (grid[i][j] === BOX_HORIZONTAL) {
    if (i+1 < GRID_WIDTH && !isBoxTile(grid[i+1][j])) {
      updatedGrid[i+1][j] = randChoice([BOX_HORIZONTAL, BOX_TOP_RIGHT, BOX_BOTTOM_RIGHT, BOX_VERTICAL_HORIZONTAL]);
    }
    if (i-1 >= 0 && !isBoxTile(grid[i-1][j])) {
      updatedGrid[i-1][j] = randChoice([BOX_HORIZONTAL, BOX_TOP_LEFT, BOX_BOTTOM_LEFT, BOX_VERTICAL_HORIZONTAL]);
    }
  }

  if (grid[i][j] === BOX_VERTICAL) {
    if (j+1 < GRID_HEIGHT && !isBoxTile(grid[i][j+1])) {
      updatedGrid[i][j+1] = randChoice([BOX_VERTICAL, BOX_TOP_LEFT, BOX_TOP_RIGHT, BOX_VERTICAL_HORIZONTAL]);
    }
    if (j-1 >= 0 && !isBoxTile(grid[i][j-1])) {
      updatedGrid[i][j-1] = randChoice([BOX_VERTICAL, BOX_BOTTOM_LEFT, BOX_BOTTOM_RIGHT, BOX_VERTICAL_HORIZONTAL]);
    }
  }

  // ... Similar logic for BOX_TOP_RIGHT, BOX_BOTTOM_LEFT, and BOX_BOTTOM_RIGHT ...
  if (grid[i][j] === BOX_TOP_RIGHT) {
    if (i-1 >= 0 && !isBoxTile(grid[i-1][j])) {
      updatedGrid[i-1][j] = randChoice([BOX_HORIZONTAL, BOX_TOP_LEFT, BOX_VERTICAL_HORIZONTAL]);
    }
    if (j+1 < GRID_HEIGHT && !isBoxTile(grid[i][j+1])) {
      updatedGrid[i][j+1] = randChoice([BOX_VERTICAL, BOX_BOTTOM_LEFT, BOX_VERTICAL_HORIZONTAL]);
    }
  } 
  if (grid[i][j] === BOX_BOTTOM_LEFT) {
    if (i+1 < GRID_WIDTH && !isBoxTile(grid[i+1][j])) {
      updatedGrid[i+1][j] = randChoice([BOX_HORIZONTAL, BOX_TOP_RIGHT, BOX_VERTICAL_HORIZONTAL]);
    }
    if (j-1 >= 0 && !isBoxTile(grid[i][j-1])) {
      updatedGrid[i][j-1] = randChoice([BOX_VERTICAL, BOX_BOTTOM_RIGHT, BOX_VERTICAL_HORIZONTAL]);
    }
  }
  if (grid[i][j] === BOX_BOTTOM_RIGHT) { 
    if (i-1 >= 0 && !isBoxTile(grid[i-1][j])) {
      updatedGrid[i-1][j] = randChoice([BOX_HORIZONTAL, BOX_TOP_LEFT, BOX_VERTICAL_HORIZONTAL]);
    }
    if (j-1 >= 0 && !isBoxTile(grid[i][j-1])) {
      updatedGrid[i][j-1] = randChoice([BOX_VERTICAL, BOX_BOTTOM_LEFT, BOX_VERTICAL_HORIZONTAL]);
    }
  }

  if (grid[i][j] === BOX_VERTICAL_HORIZONTAL) {
    if (i+1 < GRID_WIDTH && !isBoxTile(grid[i+1][j])) {
      updatedGrid[i+1][j] = randChoice([BOX_HORIZONTAL, BOX_TOP_RIGHT, BOX_BOTTOM_RIGHT]);
    }
    if (i-1 >= 0 && !isBoxTile(grid[i-1][j])) {
      updatedGrid[i-1][j] = randChoice([BOX_HORIZONTAL, BOX_TOP_LEFT, BOX_BOTTOM_LEFT]);
    }
    if (j+1 < GRID_HEIGHT && !isBoxTile(grid[i][j+1])) {
      updatedGrid[i][j+1] = randChoice([BOX_VERTICAL, BOX_TOP_LEFT, BOX_TOP_RIGHT]);
    }
    if (j-1 >= 0 && !isBoxTile(grid[i][j-1])) {
      updatedGrid[i][j-1] = randChoice([BOX_VERTICAL, BOX_BOTTOM_LEFT, BOX_BOTTOM_RIGHT]);
    }
  }
}


function hasBoxTiles() {
  for (let i = 0; i < GRID_WIDTH; i++) {
    for (let j = 0; j < GRID_HEIGHT; j++) {
      if (isBoxTile(grid[i][j])) {
        return true;
      }
    }
  }
  return false;
}

function reseedGrid() {
  for (let i = 0; i < GRID_WIDTH; i++) {
    for (let j = 0; j < GRID_HEIGHT; j++) {
      if (!isBoxTile(grid[i][j])) {
        grid[i][j] = floor(random(SPRITESHEET_COLS * SPRITESHEET_ROWS));
     }
    }
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

function draw() {
  day +=1;
  if (day > 30) {
    season += 1;
    day = 0;
  }
  if (season > 10) {
   season = 0;
  }
  // Create a copy of the grid to store updates, so we aren't reading and writing from the same grid simultaneously.
  
  let updatedGrid = [];
  for (let i = 0; i < GRID_WIDTH; i++) {
    updatedGrid[i] = grid[i].slice();
  }

  if (!hasBoxTiles()) {
    reseedGrid();
  }

  for (let i = 0; i < GRID_WIDTH; i++) {
    for (let j = 0; j < GRID_HEIGHT; j++) {
      let val = grid[i][j];
      if ((!isBoxTile(val) || (isBoxTile(val) && !canConnect(i, j))) && !isBoxTile(updatedGrid[i][j])) {
        updatedGrid[i][j] = (val + 1) % (SPRITESHEET_COLS * SPRITESHEET_ROWS);
      }
      // If the current tile has a value of 6, set all its neighbors to 6
      if (val == 8 - season) {
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
      if (!isBoxTile(val) || (isBoxTile(val) && !canConnect(i, j))) {
        updatedGrid[i][j] = (val + 1) % (SPRITESHEET_COLS * SPRITESHEET_ROWS);
        if (i == 0 && j == 0 && (day == 1 || day == 4) ) {
          let soundIndex = val % 22;
          sounds[soundIndex].play();
        }
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

function canConnect(i, j) {
  const directions = [
    {dx: 1, dy: 0},
    {dx: -1, dy: 0},
    {dx: 0, dy: 1},
    {dx: 0, dy: -1}
  ];
  for (const dir of directions) {
    let ni = i + dir.dx;
    let nj = j + dir.dy;
    if (ni >= 0 && nj >= 0 && ni < GRID_WIDTH && nj < GRID_HEIGHT && !isBoxTile(grid[ni][nj])) {
      return true;
    }
  }
  return false;
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

