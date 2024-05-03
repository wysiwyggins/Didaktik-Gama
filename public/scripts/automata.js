let socket;         
let spritesheet;
let grid = [];
let sounds = [];
let season = 0;
let day = 0;
let year = 0;


function preload() {
  spritesheet = loadImage('assets/spritesheets/libuse40x30-cp437.png');
  spritesheetData = loadJSON('assets/spritesheets/spriteData.json');
    
  
  //loadLayerFrames('bird'); // preload any tilemap frames by layer name
  // Load sounds
  for (let i = 1; i <= 22; i++) {
    sounds.push(loadSound('assets/sound/' + i + '.wav'));
  }
}

function setup() {
  socket = io.connect(window.location.origin);
  createCanvas(globalVars.CANVAS_COLS * globalVars.TILE_HALF_WIDTH, globalVars.CANVAS_ROWS * globalVars.TILE_HALF_HEIGHT);
  background(255);  // Initialize with white background
  
  // Initialize grid with random values
  for (let i = 0 + season; i < globalVars.CANVAS_COLS; i++) {
    grid[i] = [];
    for (let j = 0; j < globalVars.CANVAS_ROWS; j++) {
      grid[i][j] = floor(random(globalVars.SPRITESHEET_COLS * globalVars.SPRITESHEET_ROWS));
    }
  }
}

function isShadowEdgeTile(val) {
  return val === SHADOW_EDGE;
}
function isVoid(val) {
  return val === VOID;
}
function isWall(val){
  return val === WALL;
}
function xyToIndex(x, y) {
  return y * globalVars.SPRITESHEET_COLS + x;
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
    if (i+1 < globalVars.CANVAS_COLS && !isBoxTile(grid[i+1][j])) {
      updatedGrid[i+1][j] = randChoice([BOX_HORIZONTAL, BOX_VERTICAL_HORIZONTAL,BOX_TOP_RIGHT,]);
    }
    if (j+1 < globalVars.CANVAS_ROWS && !isBoxTile(grid[i][j+1])) {
      updatedGrid[i][j+1] = randChoice([BOX_VERTICAL, BOX_BOTTOM_LEFT, BOX_VERTICAL_HORIZONTAL]);
    }
  }

  if (grid[i][j] === BOX_HORIZONTAL) {
    if (i+1 < globalVars.CANVAS_COLS && !isBoxTile(grid[i+1][j])) {
      updatedGrid[i+1][j] = randChoice([BOX_HORIZONTAL, BOX_TOP_RIGHT, BOX_BOTTOM_RIGHT, BOX_VERTICAL_HORIZONTAL]);
    }
    if (i-1 >= 0 && !isBoxTile(grid[i-1][j])) {
      updatedGrid[i-1][j] = randChoice([BOX_HORIZONTAL, BOX_TOP_LEFT, BOX_BOTTOM_LEFT, BOX_VERTICAL_HORIZONTAL]);
    }
  }

  if (grid[i][j] === BOX_VERTICAL && season % 2 == 0) {
    if (j+1 < globalVars.CANVAS_ROWS && !isBoxTile(grid[i][j+1])) {
      updatedGrid[i][j+1] = randChoice([BOX_VERTICAL, BOX_TOP_LEFT, BOX_TOP_RIGHT, BOX_VERTICAL_HORIZONTAL]);
    }
    if (j-1 < globalVars.CANVAS_ROWS && !isBoxTile(grid[i][j+1])) {
      updatedGrid[i][j+1] = BOX_VERTICAL_HORIZONTAL;
    }
  }

  // ... Similar logic for BOX_TOP_RIGHT, BOX_BOTTOM_LEFT, and BOX_BOTTOM_RIGHT ...
  if (grid[i][j] === BOX_TOP_RIGHT) {
    if (i-1 >= 0 && !isBoxTile(grid[i-1][j])) {
      updatedGrid[i-1][j] = randChoice([BOX_HORIZONTAL, BOX_TOP_LEFT, BOX_VERTICAL_HORIZONTAL]);
    }
    if (j+1 < globalVars.CANVAS_ROWS && !isBoxTile(grid[i][j+1])) {
      updatedGrid[i][j+1] = randChoice([BOX_VERTICAL, BOX_BOTTOM_LEFT, BOX_VERTICAL_HORIZONTAL]);
    }
  } 
  if (grid[i][j] === BOX_BOTTOM_LEFT) {
    if (i+1 < globalVars.CANVAS_COLS && !isBoxTile(grid[i+1][j])) {
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
    if (i+1 < globalVars.CANVAS_COLS && !isBoxTile(grid[i+1][j])) {
      updatedGrid[i+1][j] = randChoice([BOX_HORIZONTAL, BOX_TOP_RIGHT, BOX_BOTTOM_RIGHT]);
    }
    if (i-1 >= 0 && !isBoxTile(grid[i-1][j])) {
      updatedGrid[i-1][j] = randChoice([BOX_HORIZONTAL, BOX_TOP_LEFT, BOX_BOTTOM_LEFT]);
    }
    if (j+1 < globalVars.CANVAS_ROWS && !isBoxTile(grid[i][j+1])) {
      updatedGrid[i][j+1] = randChoice([BOX_VERTICAL, BOX_TOP_LEFT, BOX_TOP_RIGHT]);
    }
    if (j-1 >= 0 && !isBoxTile(grid[i][j-1])) {
      updatedGrid[i][j-1] = randChoice([BOX_VERTICAL, BOX_BOTTOM_LEFT, BOX_BOTTOM_RIGHT]);
    }
  }
}


function hasBoxTiles() {
  for (let i = 0; i < globalVars.CANVAS_COLS; i++) {
    for (let j = 0; j < globalVars.CANVAS_ROWS; j++) {
      if (isBoxTile(grid[i][j])) {
        return true;
      }
    }
  }
  return false;
}

function reseedGrid() {
  for (let i = 0; i < globalVars.CANVAS_COLS; i++) {
    for (let j = 0; j < globalVars.CANVAS_ROWS; j++) {
      grid[i][j] = floor(random(globalVars.SPRITESHEET_COLS * globalVars.SPRITESHEET_ROWS));
    }
  }
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
let messageDisplayStart = -1;
let displayDurationFrames = 0;

function displayMessage(message, seconds) {
  let messages = [message];  // Start with just the original message

  // Check if the message is longer than the grid width
  if (message.length > globalVars.CANVAS_COLS) {
    const splitPoint = message.lastIndexOf(' ', globalVars.CANVAS_COLS / 2);  // Find the last space before the midpoint
    messages = [
      message.substring(0, splitPoint),
      message.substring(splitPoint + 1)
    ];
  }

  // Blank the screen with tile 0
  for (let y = 0; y < globalVars.CANVAS_ROWS; y++) {
    for (let x = 0; x < globalVars.CANVAS_COLS; x++) {
      grid[x][y] = 0;
    }
  }

  for (let line = 0; line < messages.length; line++) {
    const msg = messages[line];
    const startX = Math.floor((globalVars.CANVAS_COLS - msg.length) / 2);  // Center the message
    const startY = Math.floor(globalVars.CANVAS_ROWS / 2) + line;  // Adjusted for multiple lines

    for (let i = 0; i < msg.length; i++) {
      const char = msg.charAt(i);
      const tileLocation = charToSpriteLocation(char);
      grid[startX + i][startY] = tileLocation.y * globalVars.SPRITESHEET_COLS + tileLocation.x;
    }
  }

  messageDisplayStart = frameCount;  // Store the frame when the message starts displaying
  displayDurationFrames = seconds * 30; 
}

function drawTile(i, j, val) {
  // Clear the specific tile location based on tile value
  if (val % 2 === 0 && val !== 0) {
    fill(i*10 + season, val*10+ season, val*20+ season); 
  } else {
    fill(255);  // White color
  }
  noStroke();
  rect(i * globalVars.TILE_HALF_WIDTH, j * globalVars.TILE_HALF_HEIGHT, globalVars.TILE_HALF_WIDTH, globalVars.TILE_HALF_HEIGHT);
  
  // Draw the tile on the canvas
  // Calculate the position of the tile in the spritesheet
  let x = (val % globalVars.SPRITESHEET_COLS) * globalVars.TILE_HALF_WIDTH;
  let y = floor(val / globalVars.SPRITESHEET_COLS) * globalVars.TILE_HALF_HEIGHT;
  image(spritesheet, i * globalVars.TILE_HALF_WIDTH, j * globalVars.TILE_HALF_HEIGHT, globalVars.TILE_HALF_WIDTH, globalVars.TILE_HALF_HEIGHT, x, y, globalVars.TILE_HALF_WIDTH, globalVars.TILE_HALF_HEIGHT);
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
    if (ni >= 0 && nj >= 0 && ni < globalVars.CANVAS_COLS && nj < globalVars.CANVAS_ROWS && !isBoxTile(grid[ni][nj])) {
      return true;
    }
  }
  return false;
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
  console.log(year, season, day);
  if (year < 1 && season < 3) {
    displayMessage('Photosensitive Epilepsy Warning, Flashing Images', 1);
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
  if (year > 15) {  
    year = 0;
    if (socket.connected) {
      socket.emit('requestSketchChange', { nextSketch: 6 });
    } else {
      window.location.href = 'patterns.html';
    }
    
  }


  // Create a copy of the grid to store updates, so we aren't reading and writing from the same grid simultaneously.
  let updatedGrid = [];
  for (let i = 0; i < globalVars.CANVAS_COLS; i++) {
    updatedGrid[i] = grid[i].slice();
  }

  

  for (let i = 0; i < globalVars.CANVAS_COLS; i++) {
    for (let j = 0; j < globalVars.CANVAS_ROWS; j++) {
      let val = grid[i][j];
      if (year > 5 && year < 8){

        if ((!isBoxTile(val) || (isBoxTile(val) && !canConnect(i, j))) && !isBoxTile(updatedGrid[i][j])) {
          updatedGrid[i][j] = (val + 1) % (globalVars.SPRITESHEET_COLS * globalVars.SPRITESHEET_ROWS);
        } else if (isBoxTile(val)){
          addConnectingTile(i, j, updatedGrid);
        } else if (val > year && season % 2 == 0) {
          for (let dx = -1; dx <= 1; dx++) {
              for (let dy = -1; dy <= 1; dy++) {
                  let ni = i + dx;
                  let nj = j + dy;
                  if (ni >= 0 && nj >= 0 && ni < globalVars.CANVAS_COLS && nj < globalVars.CANVAS_ROWS) {
                      updatedGrid[ni][nj] = 6 + season;
                  } 
              }
          }
        } else {
          updatedGrid[i][j] = (val + 1) % (globalVars.SPRITESHEET_COLS * globalVars.SPRITESHEET_ROWS);
        }
      }
      // If the current tile has a value of 6, set all its neighbors to 6
      if (val == 6 - season) {
        for (let dx = -1; dx <= 1; dx++) {
          for (let dy = -1; dy <= 1; dy++) {
            let ni = i + dx;
            let nj = j + dy;

            if (ni >= 0 && nj >= 0 && ni < globalVars.CANVAS_COLS && nj < globalVars.CANVAS_ROWS) {
              updatedGrid[ni][nj] = 6;
            }
          }
        }
      }

      /* if (year > 2 && year < 4 && season < 6){
        initializeGridFromTMJ('box');
        if (val == season) {
          for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
              let ni = i + dx;
              let nj = j + dy;
  
              if (ni >= 0 && nj >= 0 && ni < GRID_WIDTH && nj < GRID_HEIGHT) {
                updatedGrid[ni][nj] = season;
              }
            }
          }
        }
      } */

      if (year > 15 && year < 20){
        if (val === WALL) {
          updatedGrid[i][j] = WALL; // Preserve the wall tile
          if (j + 1 < globalVars.CANVAS_ROWS && grid[i][j + 1] !== WALL) {
            updatedGrid[i][j + 1] = WALL; // Place shadow edge underneath
          }
          if (j + 2 < globalVars.CANVAS_ROWS && grid[i][j + 2] !== SHADOW_EDGE) {
            updatedGrid[i][j + 2] = SHADOW_EDGE; // Place shadow edge underneath
          }
          for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                let ni = i + dx;
                let nj = j + dy;
                if (ni >= 0 && nj >= 0 && ni < globalVars.CANVAS_COLS && nj < globalVars.CANVAS_ROWS) {
                  updatedGrid[ni][nj] = FLOOR;
              }
            }
          }
        }
        // If it's a shadow edge, add wall to its right and void tile underneath
        else if (isShadowEdgeTile(val)) {
          updatedGrid[i][j] = SHADOW_EDGE; // Preserve the shadow edge tile
          if (i + 1 < globalVars.CANVAS_COLS) {
            updatedGrid[i + 1][j] = WALL; // Place wall tile to the right
          }
          if (j + 1 < globalVars.CANVAS_ROWS) {
            updatedGrid[i][j + 1] = VOID;
          }
        } 
        if (val === VOID) {
          updatedGrid[i][j] = VOID;
          if (j + 1 < globalVars.CANVAS_ROWS && grid[i][j + 1] !== VOID) {
            updatedGrid[i][j + 1] = VOID; // Place void
          }
        }
        if (val == year && season % 2 == 0) {
          for (let dx = -1; dx <= 1; dx++) {
              for (let dy = -1; dy <= 1; dy++) {
                  let ni = i + dx;
                  let nj = j + dy;
                  if (ni >= 0 && nj >= 0 && ni < globalVars.CANVAS_COLS && nj < globalVars.CANVAS_ROWS) {
                      updatedGrid[ni][nj] = day % 2 == 0 ? 6 : 7;
                  }
              }
          }
        }
  
  
      }

      // Draw the tile on the canvas
      drawTile(i, j, val);
      
      // Increment the value for the next frame
      updatedGrid[i][j] = (val + 1) % (globalVars.SPRITESHEET_COLS * globalVars.SPRITESHEET_ROWS);
      
      if (i == 0 && j == 0 && (day == 1 || day == 4) ) {
        let soundIndex = val % 22;
        sounds[soundIndex].play();
      }
    }
  }

  // Check for the 3x3 blocks having all values as 6
  for (let i = 1; i < globalVars.CANVAS_COLS - 1; i++) {
    for (let j = 1; j < globalVars.CANVAS_ROWS - 1; j++) {
      if (is3x3BlockAllSix(i, j)) {
        updatedGrid[i][j] = floor(random(globalVars.SPRITESHEET_COLS * globalVars.SPRITESHEET_ROWS));
      }
    }
  }

  grid = updatedGrid;
  frameRate(24);
  
}


