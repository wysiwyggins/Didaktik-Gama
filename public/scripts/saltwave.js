                        
let spritesheet;
const TILE_WIDTH = 40;
const TILE_HEIGHT = 30;
const GRID_WIDTH = 51;
const GRID_HEIGHT = 40;
const SPRITESHEET_COLS = 23;
const SPRITESHEET_ROWS = 11;
let roomData = null;
let grid = [];
let sounds = [];
let season = 0;
let day = 0;
let year = 0;

let xoff = 0;
const xoffChange = 0.1; // Change in noise offset per frame
let boatLayerData = null;

const WAVE_TILE_VALUES = [142, 143, 165, 166]; 

const BLANK = xyToIndex(0, 0);
const OPAQUE_DARK_SMILING_FACE = xyToIndex(1, 0);
const OPAQUE_WHITE_SMILING_FACE = xyToIndex(2, 0);
const BLACK_HEART_SUITE = xyToIndex(3, 0);
const BLACK_DIAMOND_SUITE = xyToIndex(4, 0);
const BLACK_CLUB_SUITE = xyToIndex(5, 0);
const BLACK_SPADE_SUITE = xyToIndex(6, 0);
const BULLET = xyToIndex(7, 0);
const OPAQUE_INVERSE_DIAMOND_SUITE = xyToIndex(8, 0);
const INVERSE_BULLET = xyToIndex(9, 0);
const WHITE_KEY = xyToIndex(11, 0);
const BLACK_KEY = xyToIndex(12, 0);
const FEMALE_SYMBOL = xyToIndex(12, 0);
const BOW_AND_ARROW = xyToIndex(13, 0);
const BEAMED_EIGHTH_NOTES = xyToIndex(14, 0);
const PRISON_WINDOW = xyToIndex(15, 0);
const BLACK_RIGHT_POINTING_TRIANGLE = xyToIndex(16, 0);
const BLACK_LEFT_POINTING_TRIANGLE = xyToIndex(17, 0);
const ROLLING_ON_THE_FLOOR_LAUGHING = xyToIndex(18, 0);
const DOUBLE_EXCLAMATION_MARK = xyToIndex(19, 0);
const DOWNWARDS_ARROW_ON_LIGHT_SHADE = xyToIndex(20, 0);
const UPWARDS_ARROW_ON_LIGHT_SHADE = xyToIndex(21, 0);
const UNDERSCORE = xyToIndex(22, 0);
const UPWARDS_ARROW = xyToIndex(1, 1);
const DOWNWARDS_ARROW = xyToIndex(2, 1);
const LEFTWARDS_ARROW = xyToIndex(3, 1);
const RIGHTWARDS_ARROW = xyToIndex(4, 1);
const BOX_BOTTOM_LEFT = xyToIndex(5, 1);
const UPWARD_POINTING_TRIANGLE = xyToIndex(7, 1);
const DOWNWARD_POINTING_TRIANGLE = xyToIndex(8, 1);
const EXCLAMATION_MARK = xyToIndex(10, 1);
const QUOTATION_MARK = xyToIndex(11, 1);
const NUMBER_SIGN = xyToIndex(12, 1);
const DOLLAR_SIGN = xyToIndex(13, 1);
const PERCENT_SIGN = xyToIndex(14, 1);
const AMPERSAND = xyToIndex(15, 1);
const APOSTROPHE = xyToIndex(16, 1);
const LEFT_PARENTHESIS = xyToIndex(17, 1);
const RIGHT_PARENTHESIS = xyToIndex(18, 1);
const ASTERISK = xyToIndex(19, 1);
const PLUS_SIGN = xyToIndex(20, 1);
const COMMA = xyToIndex(21, 1);
const HYPHEN_MINUS = xyToIndex(22, 1);
const FULL_STOP = xyToIndex(0, 2);
const SOLIDUS = xyToIndex(1, 2);
const DIGIT_ZERO = xyToIndex(2, 2);
const DIGIT_ONE = xyToIndex(3, 2);
const DIGIT_TWO = xyToIndex(4, 2);
const DIGIT_THREE = xyToIndex(5, 2);
const DIGIT_FOUR = xyToIndex(6, 2);
const DIGIT_FIVE = xyToIndex(7, 2);
const DIGIT_SIX = xyToIndex(9, 2);
const DIGIT_SEVEN = xyToIndex(9, 2);
const DIGIT_EIGHT = xyToIndex(10, 2);
const DIGIT_NINE = xyToIndex(12, 2);
const COLON = xyToIndex(12, 2);
const SEMICOLON = xyToIndex(13, 2);
const LESS_THAN_SIGN = xyToIndex(14, 2);
const EQUALS_SIGN = xyToIndex(15, 2);
const GREATER_THAN_SIGN = xyToIndex(16, 2);
const QUESTION_MARK = xyToIndex(17, 2);
const COMMERCIAL_AT = xyToIndex(18, 2);
const LATIN_CAPITAL_LETTER_A = xyToIndex(19, 2);
const LATIN_CAPITAL_LETTER_B = xyToIndex(20, 2);
const LATIN_CAPITAL_LETTER_C = xyToIndex(21, 2);
const LATIN_CAPITAL_LETTER_D = xyToIndex(22, 2);
const LATIN_CAPITAL_LETTER_E = xyToIndex(0, 3);
const LATIN_CAPITAL_LETTER_F = xyToIndex(1, 3);
const LATIN_CAPITAL_LETTER_G = xyToIndex(2, 3);
const LATIN_CAPITAL_LETTER_H = xyToIndex(3, 3);
const LATIN_CAPITAL_LETTER_I = xyToIndex(4, 3);
const LATIN_CAPITAL_LETTER_J = xyToIndex(5, 3);
const LATIN_CAPITAL_LETTER_K = xyToIndex(6, 3);
const LATIN_CAPITAL_LETTER_L = xyToIndex(7, 3);
const LATIN_CAPITAL_LETTER_M = xyToIndex(8, 3);
const LATIN_CAPITAL_LETTER_N = xyToIndex(9, 3);
const LATIN_CAPITAL_LETTER_O = xyToIndex(10, 3);
const LATIN_CAPITAL_LETTER_P = xyToIndex(11, 3);
const LATIN_CAPITAL_LETTER_Q = xyToIndex(12, 3);
const LATIN_CAPITAL_LETTER_R = xyToIndex(13, 3);
const LATIN_CAPITAL_LETTER_S = xyToIndex(14, 3);
const LATIN_CAPITAL_LETTER_T = xyToIndex(15, 3);
const LATIN_CAPITAL_LETTER_U = xyToIndex(16, 3);
const LATIN_CAPITAL_LETTER_V = xyToIndex(17, 3);
const LATIN_CAPITAL_LETTER_W = xyToIndex(18, 3);
const LATIN_CAPITAL_LETTER_X = xyToIndex(19, 3);
const LATIN_CAPITAL_LETTER_Y = xyToIndex(20, 3);
const LATIN_CAPITAL_LETTER_Z = xyToIndex(21, 3);
const LEFT_SQUARE_BRACKET = xyToIndex(22, 3);
const REVERSE_SOLIDUS = xyToIndex(0, 4);
const RIGHT_SQUARE_BRACKET = xyToIndex(1, 4);
const CIRCUMFLEX_ACCENT = xyToIndex(2, 4);
const LOW_LINE = xyToIndex(3, 4);
const FLIPPED_SMALL_BLACK_LOWER_RIGHT_TRIANGLE = xyToIndex(4, 4);
const LATIN_SMALL_LETTER_A = xyToIndex(5, 4);
const LATIN_SMALL_LETTER_B = xyToIndex(6, 4);
const LATIN_SMALL_LETTER_C = xyToIndex(7, 4);
const LATIN_SMALL_LETTER_D = xyToIndex(8, 4);
const LATIN_SMALL_LETTER_E = xyToIndex(9, 4);
const LATIN_SMALL_LETTER_F = xyToIndex(10, 4);
const LATIN_SMALL_LETTER_G = xyToIndex(11, 4);
const LATIN_SMALL_LETTER_H = xyToIndex(12, 4);
const LATIN_SMALL_LETTER_I = xyToIndex(13, 4);
const LATIN_SMALL_LETTER_J = xyToIndex(14, 4);
const LATIN_SMALL_LETTER_K = xyToIndex(15, 4);
const LATIN_SMALL_LETTER_L = xyToIndex(16, 4);
const LATIN_SMALL_LETTER_M = xyToIndex(17, 4);
const LATIN_SMALL_LETTER_N = xyToIndex(18, 4);
const LATIN_SMALL_LETTER_O = xyToIndex(19, 4);
const LATIN_SMALL_LETTER_P = xyToIndex(20, 4);
const LATIN_SMALL_LETTER_Q = xyToIndex(21, 4);
const LATIN_SMALL_LETTER_R = xyToIndex(22, 4);
const LATIN_SMALL_LETTER_S = xyToIndex(0, 5);
const LATIN_SMALL_LETTER_T = xyToIndex(1, 5);
const LATIN_SMALL_LETTER_U = xyToIndex(2, 5);
const LATIN_SMALL_LETTER_V = xyToIndex(3, 5);
const LATIN_SMALL_LETTER_W = xyToIndex(4, 5);
const LATIN_SMALL_LETTER_X = xyToIndex(5, 5);
const LATIN_SMALL_LETTER_Y = xyToIndex(6, 5);
const LATIN_SMALL_LETTER_Z = xyToIndex(7, 5);
const QUADRANT_UPPER_LEFT_AND_LOWER_LEFT_AND_LOWER_RIGHT = xyToIndex(8, 5);
const VERTICAL_LINE = xyToIndex(9, 5);
const LEG = xyToIndex(10, 5);
const UPWARDS_ARROW_WITH_TIP_LEFTWARDS = xyToIndex(11, 5);
const BLACK_LOWER_LEFT_TRIANGLE_WITH_DARK_SHADE_UPPER_RIGHT_TRIANGLE = xyToIndex(12, 5);
const MEDIUM_SHADE = xyToIndex(13, 5);
const LIGHT_SHADE_LOWER_LEFT_TRIANGLE_WITH_DARK_SHADE_UPPER_RIGHT_TRIANGLE = xyToIndex(14, 5);
const LIGHT_SHADE_LOWER_RIGHT_TRIANGLE_WITH_MEDIUM_SHADE_UPPER_LEFT_TRIANGLE = xyToIndex(15, 5);
const MEDIUM_LIGHT_SHADE = xyToIndex(16, 5);
const WALL_TOP = xyToIndex(16, 5);
const BLACK_LOWER_LEFT_TRIANGLE = xyToIndex(17, 5);
const MEDIUM_SHADE_LOWER_LEFT_TRIANGLE = xyToIndex(18, 5);
const DOTTED_LIGHT_SHADE = xyToIndex(19, 5);
const LATIN_SMALL_LETTER_CARON = xyToIndex(20, 5);
const WHITE_LEG = xyToIndex(21, 5);
const OPAQUE_QUADRANT_UPPER_LEFT_AND_LOWER_LEFT_AND_LOWER_RIGHT = xyToIndex(22, 5);
const DARK_SMILING_FACE = xyToIndex(0, 6);
const EYE_OF_PROVIDENCE = xyToIndex(1, 6);
const INVERTED_EYE_OF_PROVIDENCE = xyToIndex(2, 6);
const BLACK_SQUARE = xyToIndex(3, 6);
const INVERTED_CHECKER_BOARD = xyToIndex(4, 6);
const CHECKER_BOARD = xyToIndex(5, 6);
const CANDLE_STICK = xyToIndex(6, 6);
const INVERSE_DIAMOND_SUITE = xyToIndex(7, 6);
const IMPERFECT_DOTTED_LIGHT_SHADE = xyToIndex(8, 6);
const OPQAQUE_DOOR_TOP = xyToIndex(10, 6);
const OPAQUE_DOOR_BOTTOM = xyToIndex(11, 6);
const BLACK_LOWER_RIGHT_TRIANGLE_WITH_DARK_SHADE_UPPER_LEFT_TRIANGLE = xyToIndex(12, 6);
const OPAQUE_PRISON_WINDOW = xyToIndex(13, 6);
const ROTATED_LATIN_CAPITAL_LETTER_F_ON_LIGHT_SHADE = xyToIndex(14, 6);
const SMALL_BLACK_LOWER_RIGHT_TRIANGLE = xyToIndex(15, 6);
const LIGHT_SHADE_UPPER_LEFT_TRIANGLE = xyToIndex(16, 6);
const LIGHT_SHADE_UPPER_RIGHT_TRIANGLE = xyToIndex(17, 6);
const LIGHT_SHADE_LOWER_RIGHT_TRIANGLE = xyToIndex(18, 6);
const FLOOR = xyToIndex(19, 6);
const IMPERFECT_DOTTED_LIGHT_SHADE_VARIATION = xyToIndex(20, 6);
const CYCLOPS_FACE = xyToIndex(21, 6);
const FLOATING_LEGS = xyToIndex(22, 6);
const LATIN_SMALL_LETTER_O_WITH_ACUTE = xyToIndex(0, 7);
const LATIN_SMALL_LETTER_I_WITH_ACUTE = xyToIndex(1, 7);
const BOX_TOP_RIGHT = xyToIndex(6, 8);
const LEFT_HALF_BLOCK_WITH_LIGHT_SHADE_UPPER_RIGHT_AND_MEDIUM_SHADE_LOWER_RIGHT = xyToIndex(7, 7);
const SKELETON_LEGS = xyToIndex(8, 7);
const SKULL = xyToIndex(9, 7);
const DOOR_TOP = xyToIndex(10, 7);
const DOOR_BOTTOM = xyToIndex(11, 7);
const EMPHASIZED_LATIN_CAPITAL_LETTER_X = xyToIndex(12, 7);
const EMPHASIZED_EXCLAMATION_MARK = xyToIndex(13, 7);
const LIGHT_SHADE = xyToIndex(14, 7);
const WALL = xyToIndex(16, 7);
const BOX_VERTICAL = xyToIndex(17, 7);
const BOX_LEFT_VERTICAL = xyToIndex(18,7);
const BOX_BOTTOM_RIGHT = xyToIndex(7, 9);
const BOX_UP_HORIZONTAL = xyToIndex(8,8);
const BOX_DOWN_HORIZONTAL = xyToIndex(9,8);
const BOX_RIGHT_VERTICAL = xyToIndex(10,8);
const BOX_HORIZONTAL = xyToIndex(11, 8);
const BOX_VERTICAL_HORIZONTAL = xyToIndex(12,8);
const FULL_BLOCK = xyToIndex(9, 9);
const BOX_TOP_LEFT = xyToIndex(8, 9);
const BOX_HORIZONTAL_HALF = xyToIndex(20,10);


let tmjFrames = [];

//let socket = io.connect('http://localhost:3000');
//let potentiometerValue = 0;

let audioSpriteData;
let sound;

function preload() {
  spritesheet = loadImage('assets/spritesheets/libuse40x30-cp437.png');
  tmjData = loadJSON('data/structures.tmj');

  // Load sounds
  for (let i = 1; i <= 22; i++) {
    sounds.push(loadSound('/public/assets/sound/' + i + '.wav'));
  }
}

fetch("/public/data/grottoAudiosprite.json")
  .then(response => response.json())
  .then(data => {
    audioSpriteData = data;
    initHowler();
  })
  .catch(error => {
    console.error("Error fetching sprite data:", error);
  });

function initHowler() {
// Correct the urls path as needed
  const correctUrls = audioSpriteData.urls.map(url => {
      return url.replace("~/Development/audiosprite-master/", "../assets/sound/");
  });

  sound = new Howl({
      src: correctUrls,
      sprite: audioSpriteData.sprite,
      volume: 1
  });

  // You can now use the sound object as needed
}

function setup() {
  /* socket = io.connect('http://localhost:3000');

  socket.on('potentiometer', (data) => {
    potentiometerValue = data;
  });
  socket.on('roomData', (data) => {
    roomData = data; // Store the room data
  }); */

  if (!tmjData || !tmjData.tilesets) {
    console.error("tmjData or tmjData.tilesets is not initialized");
    return;
  }
  createCanvas(GRID_WIDTH * TILE_WIDTH, GRID_HEIGHT * TILE_HEIGHT);
  background(255);  // Initialize with white background
  
  // Initialize grid with random values
  for (let i = 0 + season; i < GRID_WIDTH; i++) {
    grid[i] = [];
    let WAVE_PHASE = floor(WAVE_TILE_VALUES[random(WAVE_TILE_VALUES.length)])
    for (let j = 0; j < GRID_HEIGHT; j++) {
      grid[i][j] = WAVE_PHASE;
    }
  }
}

function initializeGridFromTMJ(layerName) {
  // Find the desired layer by name
  let layerData;
  for (let layer of tmjData.layers) {
    if (layer.name === layerName) {
      layerData = layer.data;
      break;
    }
  }

  // If no layer with the given name is found, exit the function
  if (!layerData) {
    console.error("No layer found with the name: ", layerName);
    return;
  }

  // Process each tile value from layerData
  for (let i = 0; i < GRID_WIDTH; i++) {
    for (let j = 0; j < GRID_HEIGHT; j++) {
      let tileValue = layerData[j * GRID_WIDTH + i];  // Adjusted indexing here as it seems layerData is 1D.
      
      // Subtract 1 from tileValue to make it 0-based.
      grid[i][j] = tileValue - 1;
    }
  }
  if (layer.name === "boat") {
    boatLayerData = layer.data;
    // Optionally, you can process the boat layer data here if needed
}
}

function drawBoat() {
  if (!boatLayerData) return;

  // Calculate the starting position to center the boat
  const boatWidth = 19; // Assuming the boat is 10 tiles wide
  const boatHeight = 7;  // Assuming the boat is 5 tiles high
  const startX = Math.floor((GRID_WIDTH - boatWidth) / 2);
  const startY = Math.floor((GRID_HEIGHT - boatHeight) / 2);

  // Overlay the boat onto the grid
  for (let i = 0; i < boatWidth; i++) {
      for (let j = 0; j < boatHeight; j++) {
          let tileValue = boatLayerData[j * boatWidth + i];
          if (tileValue !== 0) { // Assuming 0 represents a transparent tile in the boat layer
              grid[startX + i][startY + j] = tileValue - 1; // Adjust for 0-based indexing
          }
      }
  }
}

function isShadowEdgeTile(val) {
  return val === SHADOW_EDGE;
}
function isVoid(val) {
  return val === FULL_BLOCK;
}
function isWall(val){
  return val === WALL;
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

  if (grid[i][j] === BOX_VERTICAL && season % 2 == 0) {
    if (j+1 < GRID_HEIGHT && !isBoxTile(grid[i][j+1])) {
      updatedGrid[i][j+1] = randChoice([BOX_VERTICAL, BOX_TOP_LEFT, BOX_TOP_RIGHT, BOX_VERTICAL_HORIZONTAL]);
    }
    if (j-1 < GRID_HEIGHT && !isBoxTile(grid[i][j+1])) {
      updatedGrid[i][j+1] = BOX_VERTICAL_HORIZONTAL;
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

function displayMessage(APIMessage, seconds) {
  let APIMessages = [APIMessage];  // Start with just the original message

  // Check if the message is longer than the grid width
  if (APIMessage.length > GRID_WIDTH) {
    const splitPoint = APIMessage.lastIndexOf(' ', GRID_WIDTH / 2);  // Find the last space before the midpoint
    APIMessages = [
      APIMessage.substring(0, splitPoint),
      APIMessage.substring(splitPoint + 1)
    ];
  }

  // Blank the screen with tile 0
  for (let y = 0; y < GRID_HEIGHT; y++) {
    for (let x = 0; x < GRID_WIDTH; x++) {
      grid[x][y] = 0;
    }
  }

  for (let line = 0; line < APIMessages.length; line++) {
    const msg = APIMessages[line];
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

const expansionChance = 0.3; // Chance for a column to expand
const randomTileChance = 0.05; // Chance for a random tile to appear


function draw() {
  background(255); // Clear background each frame

  // Temporary grid to store the updated state
  let tempGrid = [];
  for (let i = 0; i < GRID_WIDTH; i++) {
      tempGrid[i] = [];
      for (let j = 0; j < GRID_HEIGHT; j++) {
          tempGrid[i][j] = grid[i][j]; // Copy current state
      }
  }

  // Iterate over each column
  for (let i = 0; i < GRID_WIDTH; i++) {
      // Randomly decide whether to expand this column to its neighbors
      if (random() < expansionChance) {
          let waveTile = random(WAVE_TILE_VALUES);
          if (i > 0) tempGrid[i - 1].fill(waveTile); // Copy to left neighbor
          if (i < GRID_WIDTH - 1) tempGrid[i + 1].fill(waveTile); // Copy to right neighbor
      }

      // Randomly replace some tiles with random tiles
      for (let j = 0; j < GRID_HEIGHT; j++) {
          if (random() < randomTileChance) {
              tempGrid[i][j] = floor(random(SPRITESHEET_COLS * SPRITESHEET_ROWS));
          }
      }
  }

  // Update the grid with the new state
  grid = tempGrid;
  

  // Draw the grid
  for (let i = 0; i < GRID_WIDTH; i++) {
      for (let j = 0; j < GRID_HEIGHT; j++) {
          drawTile(i, j, grid[i][j]);
      }
  }
  drawBoat();

}


