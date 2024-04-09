let directionUpwards = false;
let spriteSheet;
let fileText;
let toneStarted = false;

let tileMap = [];
let cursorX = 0;
let cursorY = 0;
currentPenColor = null;


// Constants
const CANVAS_COLS = 65;
const CANVAS_ROWS = 60;
const TILE_WIDTH = 20;   // Half size
const TILE_HEIGHT = 15;
const SPRITESHEET_COLS = 23;
const SPRITESHEET_ROWS = 11;

function preload() {
  spriteSheet = loadImage('/public/assets/spritesheets/libuse40x30-cp437.png');
  fileText = loadStrings('/public/data/mud_which_flows.txt');
  spriteData = loadJSON('/public/assets/spritesheets/spriteData.json');
}

function setup() {
  createCanvas(CANVAS_COLS * TILE_WIDTH, CANVAS_ROWS * TILE_HEIGHT);
  for (let y = 0; y < CANVAS_ROWS; y++) {
    let currentRow = [];  // Renamed from 'row' to avoid name conflict
    for (let x = 0; x < CANVAS_COLS; x++) {
      currentRow.push(getTileIndex("BLANK"));
    }
    tileMap.push(currentRow);
  }
  if (fileText) {
    displayText();
  }
  wave1 = new p5.Oscillator();
  wave1.setType('triangle');
  wave2 = new p5.Oscillator();
  wave2.setType('triangle');
  reverb = new p5.Reverb();
}

function draw() {
    if (!toneStarted){
      wave1.start();
      wave2.start();
      toneStarted = true;
      reverb.process(wave1, 1, 2);
    }
    background(225);
    for (let y = 0; y < CANVAS_ROWS; y++) {
      for (let x = 0; x < CANVAS_COLS; x++) {
        
        let tileData = tileMap[y][x];
        
        let sx = (tileData.tile % SPRITESHEET_COLS) * (TILE_WIDTH * 2);
        let sy = Math.floor(tileData.tile / SPRITESHEET_COLS) * (TILE_HEIGHT * 2);
  
        if (tileData.bgColor) {
          fill(tileData.bgColor);
          rect(x * TILE_WIDTH, y * TILE_HEIGHT, TILE_WIDTH, TILE_HEIGHT);
        }
        
        image(spriteSheet, x * TILE_WIDTH, y * TILE_HEIGHT, TILE_WIDTH, TILE_HEIGHT, sx, sy, TILE_WIDTH * 2, TILE_HEIGHT * 2);
      }
    }
    drawCursor();
}

function getTileCoords(tileName) {
  // Retrieve tile coordinates from JSON data
  let coords = spriteData.tiles[tileName];
  if (!coords) {
    console.error("Tile not found:", tileName);
    return [0, 0]; // Default to BLANK if not found
  }
  return coords;
}

function getTileIndex(tileName) {
  let [x, y] = getTileCoords(tileName);
  return xyToIndex(x, y);
}

function penColor(hexValue) {
if (hexValue) {
    currentPenColor = color(hexValue);
} else {
    currentPenColor = null; // Reset to no background color
}
}

function drawCursor() {
  stroke(255, 255, 0); // Red color for the cursor
  noFill();
  rect(cursorX * TILE_WIDTH, cursorY * TILE_HEIGHT, TILE_WIDTH, TILE_HEIGHT);
}

function setCurrentTile(tileIndex) {
  tileMap[cursorY][cursorX] = { tile: tileIndex, bgColor: null };
  advanceCursor();
}

function advanceCursor() {
  if (keyIsDown(CONTROL)) {
    // Move cursor to the right
    cursorX++;
    if (cursorX >= CANVAS_COLS) {
        cursorX = 0;
        cursorY++;
        if (cursorY >= CANVAS_ROWS) {
            cursorY = 0;  // Optional: Reset to start or stop at the end
        }
    }
} else if (keyIsDown(ALT)) {
  // Move cursor to the right
  cursorX--;
  if (cursorX <= 0) {
      cursorX = CANVAS_COLS - 1;
      cursorY--;
      if (cursorY >= CANVAS_ROWS) {
          cursorY = 0;  // Optional: Reset to start or stop at the end
      }
  }
} else if (directionUpwards) {
      // Move cursor upwards
      if (cursorY > 0) {
        cursorY--;
      } else {
        // If at the top row, move to the previous column or wrap around
        if (cursorX > 0) {
          cursorX--;
        } else {
          // Wrap around to the last column
          cursorX = CANVAS_COLS - 1;
        }
        cursorY = CANVAS_ROWS - 1; // Move to the bottom row
      }
    } else {
      // Move cursor downwards
      cursorY++;
      if (cursorY >= CANVAS_ROWS) {
        cursorY = 0;
        cursorX++;
        if (cursorX >= CANVAS_COLS) {
          cursorX = 0;  // Optional: Reset to start or stop at the end
        }
      }
    }
    wave1.freq((50 +cursorX * cursorY)% 260);
    wave2.freq((50 + cursorY - cursorX)%260);
        
    console.log("Cursor position:", cursorX, cursorY); // Debugging statement
}

function retreatCursor() {
    if (cursorY > 0) {
      cursorY--;
    } else if (cursorX > 0) {
      cursorY = CANVAS_ROWS - 1;
      cursorX--;
    }
    tileMap[cursorY][cursorX] = getTileIndex("BLANK");
}

function keyPressed() {
  if (keyCode === 33) { // Page Up key
      directionUpwards = true;
      return false;
  } else if (keyCode === 34) { // Page Down key
      directionUpwards = false;
      return false;
  }

  if (keyCode === BACKSPACE) {
      retreatCursor();
      return false;
  }
  if (key === ' ') {
      setCurrentTile(getTileIndex("WHITE_FULL_BLOCK"));
      return false;
  }

  // Handle alphanumeric characters
  if (!keyIsDown(CONTROL) && !keyIsDown(ALT)) {
      let tileName;
      if (key >= '0' && key <= '9') {
          tileName = 'DIGIT_' + key; // Assumes you have tiles named like DIGIT_1, DIGIT_2, etc.
      } else if (key >= 'A' && key <= 'Z') {
          tileName = 'LATIN_CAPITAL_LETTER_' + key; // Assumes tiles named like LATIN_CAPITAL_LETTER_A
      } else if (key >= 'a' && key <= 'z') {
          let uppercaseKey = key.toUpperCase();
          tileName = 'LATIN_SMALL_LETTER_' + uppercaseKey; // Assumes tiles named like LATIN_SMALL_LETTER_A
      }

      if (tileName && spriteData.tiles[tileName]) {
          setCurrentTile(getTileIndex(tileName));
          return false;
      }
    }
  
    // Ctrl + key for symbols
    if (keyIsDown(CONTROL)) {
      switch (key) {
        case '1': setCurrentTile(getTileIndex("BLACK_HEART_SUITE")); break; // Similar to ♥
        case '2': setCurrentTile(getTileIndex("BLACK_DIAMOND_SUITE")); break; // Similar to ♦
        case '3': setCurrentTile(getTileIndex("BLACK_CLUB_SUITE")); break; // Similar to ♣
        case '4': setCurrentTile(getTileIndex("BLACK_SPADE_SUITE")); break; // Similar to ♠
        case '5': setCurrentTile(getTileIndex("BULLET")); break; // Similar to •
        case '6': setCurrentTile(getTileIndex("OPAQUE_INVERSE_DIAMOND_SUITE")); break; // Custom, no direct equivalent
        case '7': setCurrentTile(getTileIndex("INVERSE_BULLET")); break; // Custom, similar to reverse •
        case '8': setCurrentTile(getTileIndex("WHITE_KEY")); break; // Custom, no direct equivalent
        case '9': setCurrentTile(getTileIndex("BLACK_KEY")); break; // Custom, no direct equivalent
        case '0': setCurrentTile(getTileIndex("DOUBLE_EXCLAMATION_MARK")); break; // Similar to ‼
        case '-': setCurrentTile(getTileIndex("DOWNWARDS_ARROW_ON_LIGHT_SHADE")); break; // Custom, no direct equivalent
        case '=': setCurrentTile(getTileIndex("UPWARDS_ARROW_ON_LIGHT_SHADE")); break; // Custom, no direct equivalent
        case 'q': setCurrentTile(getTileIndex("UPWARDS_ARROW")); break; // Similar to ↑
        case 'w': setCurrentTile(getTileIndex("DOWNWARDS_ARROW")); break; // Similar to ↓
        case 'e': setCurrentTile(getTileIndex("LEFTWARDS_ARROW")); break; // Similar to ←
        case 'r': setCurrentTile(getTileIndex("RIGHTWARDS_ARROW")); break; // Similar to →
        case 't': setCurrentTile(getTileIndex("UPWARD_POINTING_TRIANGLE")); break; // Custom, no direct equivalent
        case 'y': setCurrentTile(getTileIndex("DOWNWARD_POINTING_TRIANGLE")); break; // Custom, no direct equivalent
        case 'u': setCurrentTile(getTileIndex("BOX_TOP_RIGHT")); break; // Custom, similar to box drawing
        case 'i': setCurrentTile(getTileIndex("BOX_BOTTOM_RIGHT")); break; // Custom, similar to box drawing
        case 'o': setCurrentTile(getTileIndex("BOX_UP_HORIZONTAL")); break; // Custom, similar to box drawing
        case 'p': setCurrentTile(getTileIndex("BOX_DOWN_HORIZONTAL")); break; // Custom, similar to box drawing
        case '[': setCurrentTile(getTileIndex("BOX_LEFT_VERTICAL")); break; // Custom, similar to box drawing
        case ']': setCurrentTile(getTileIndex("BOX_RIGHT_VERTICAL")); break; // Custom, similar to box drawing
        case 'a': setCurrentTile(getTileIndex("BOX_HORIZONTAL")); break; // Custom, similar to box drawing
        case 's': setCurrentTile(getTileIndex("BOX_VERTICAL")); break; // Custom, similar to box drawing
        case 'd': setCurrentTile(getTileIndex("BOX_VERTICAL_HORIZONTAL")); break; // Custom, similar to box drawing
        case 'f': setCurrentTile(getTileIndex("FULL_BLOCK")); break; // Similar to █
        case 'g': setCurrentTile(getTileIndex("BOX_TOP_LEFT")); break; // Custom, similar to box drawing
        case 'h': setCurrentTile(getTileIndex("LIGHT_SHADE")); break; // Similar to ░
        case 'j': setCurrentTile(getTileIndex("MEDIUM_SHADE")); break; // Similar to ▒
        case 'k': setCurrentTile(getTileIndex("DARK_SHADE")); break; // Similar to ▓
        case 'l': setCurrentTile(getTileIndex("SKULL")); break; // Custom, no direct equivalent but similar to ☠
        case ';': setCurrentTile(getTileIndex("DOOR_TOP")); break; // Custom, no direct equivalent
        case '\'': setCurrentTile(getTileIndex("DOOR_BOTTOM")); break; // Custom, no direct equivalent
        case 'z': setCurrentTile(getTileIndex("LATIN_SMALL_LETTER_C_WITH_CARON")); break; // For "č", using Ctrl might not be standard but logical here
        case 'x': setCurrentTile(getTileIndex("LATIN_SMALL_LETTER_S_WITH_CARON")); break; // For "š", using Ctrl might not be standard but logical here
        case 'c': setCurrentTile(getTileIndex("LATIN_SMALL_LETTER_O_WITH_ACUTE")); break; // For "ó", using Ctrl might not be standard but logical here
        case 'v': setCurrentTile(getTileIndex("LATIN_SMALL_LETTER_I_WITH_ACUTE")); break; // For "í", using Ctrl might not be standard but logical here
       

      }
    }
  
    // Alt + key for other symbols
    if (keyIsDown(ALT)) {
      if (keyIsDown(ALT)) {
        switch (key) {
          case '1': setCurrentTile(getTileIndex("OPAQUE_DARK_SMILING_FACE")); break; // Custom, no direct equivalent
          case '2': setCurrentTile(getTileIndex("OPAQUE_WHITE_SMILING_FACE")); break; // Custom, no direct equivalent
          case '3': setCurrentTile(getTileIndex("FEMALE_SYMBOL")); break; // Similar to ♀
          case '4': setCurrentTile(getTileIndex("BOW_AND_ARROW")); break; // Custom, no direct equivalent
          case '5': setCurrentTile(getTileIndex("BEAMED_EIGHTH_NOTES")); break; // Similar to ♫
          case '6': setCurrentTile(getTileIndex("PRISON_WINDOW")); break; // Custom, no direct equivalent
          case '7': setCurrentTile(getTileIndex("BLACK_RIGHT_POINTING_TRIANGLE")); break; // Custom, no direct equivalent
          case '8': setCurrentTile(getTileIndex("BLACK_LEFT_POINTING_TRIANGLE")); break; // Custom, no direct equivalent
          case '9': setCurrentTile(getTileIndex("ROLLING_ON_THE_FLOOR_LAUGHING")); break; // Similar to 🤣
          case '0': setCurrentTile(getTileIndex("QUADRANT_UPPER_LEFT_AND_LOWER_LEFT_AND_LOWER_RIGHT")); break; // Custom, no direct equivalent
          case '-': setCurrentTile(getTileIndex("LEG")); break; // Custom, no direct equivalent
          case '=': setCurrentTile(getTileIndex("UPWARDS_ARROW_WITH_TIP_LEFTWARDS")); break; // Custom, no direct equivalent
          case 'q': setCurrentTile(getTileIndex("BLACK_LOWER_LEFT_TRIANGLE_WITH_DARK_SHADE_UPPER_RIGHT_TRIANGLE")); break; // Custom, no direct equivalent
          case 'w': setCurrentTile(getTileIndex("MEDIUM_SHADE")); break; // Similar to ▒
          case 'e': setCurrentTile(getTileIndex("MEDIUM_LIGHT_SHADE")); break; // Custom, no direct equivalent
          case 'r': setCurrentTile(getTileIndex("LIGHT_SHADE_LOWER_LEFT_TRIANGLE_WITH_DARK_SHADE_UPPER_RIGHT_TRIANGLE")); break; // Custom, no direct equivalent
          case 't': setCurrentTile(getTileIndex("LIGHT_SHADE_LOWER_RIGHT_TRIANGLE_WITH_MEDIUM_SHADE_UPPER_LEFT_TRIANGLE")); break; // Custom, no direct equivalent
          case 'y': setCurrentTile(getTileIndex("BLACK_LOWER_LEFT_TRIANGLE")); break; // Custom, no direct equivalent
          case 'u': setCurrentTile(getTileIndex("MEDIUM_SHADE_LOWER_LEFT_TRIANGLE")); break; // Custom, no direct equivalent
          case 'i': setCurrentTile(getTileIndex("OPAQUE_DOTTED_LIGHT_SHADE")); break; // Custom, no direct equivalent
          case 'o': setCurrentTile(getTileIndex("DARK_SMILING_FACE")); break; // Similar to 😐 but opaque
          case 'p': setCurrentTile(getTileIndex("EYE_OF_PROVIDENCE")); break; // Custom, no direct equivalent
          case '[': setCurrentTile(getTileIndex("INVERTED_EYE_OF_PROVIDENCE")); break; // Custom, no direct equivalent
          case ']': setCurrentTile(getTileIndex("INVERTED_CHECKER_BOARD")); break; // Custom, no direct equivalent
          case 'a': setCurrentTile(getTileIndex("CHECKER_BOARD")); break; // Similar to checkerboard patterns
          case 's': setCurrentTile(getTileIndex("CANDLE_STICK")); break; // Custom, no direct equivalent
          case 'd': setCurrentTile(getTileIndex("INVERSE_DIAMOND_SUITE")); break; // Custom, no direct equivalent
          case 'f': setCurrentTile(getTileIndex("IMPERFECT_DOTTED_LIGHT_SHADE")); break; // Custom, no direct equivalent
          case 'g': setCurrentTile(getTileIndex("OPAQUE_DOOR_TOP")); break; // Custom, no direct equivalent
          case 'h': setCurrentTile(getTileIndex("OPAQUE_DOOR_BOTTOM")); break; // Custom, no direct equivalent
          case 'j': setCurrentTile(getTileIndex("BLACK_LOWER_RIGHT_TRIANGLE_WITH_DARK_SHADE_UPPER_LEFT_TRIANGLE")); break; // Custom, no direct equivalent
          case 'k': setCurrentTile(getTileIndex("OPAQUE_PRISON_WINDOW")); break; // Custom, no direct equivalent
          case 'l': setCurrentTile(getTileIndex("ROTATED_LATIN_CAPITAL_LETTER_F_ON_LIGHT_SHADE")); break; // Custom, no direct equivalent
          case ';': setCurrentTile(getTileIndex("SMALL_BLACK_LOWER_RIGHT_TRIANGLE")); break; // Custom, no direct equivalent
          case '\'': setCurrentTile(getTileIndex("LIGHT_SHADE_UPPER_LEFT_TRIANGLE")); break; // Custom, no direct equivalent
          case 'z': setCurrentTile(getTileIndex("LIGHT_SHADE_UPPER_RIGHT_TRIANGLE")); break; // Custom, no direct equivalent
          case 'x': setCurrentTile(getTileIndex("LIGHT_SHADE_LOWER_RIGHT_TRIANGLE")); break; // Custom, no direct equivalent
          case 'c': setCurrentTile(getTileIndex("FLOOR")); break; // Custom, no direct equivalent
          case 'v': setCurrentTile(getTileIndex("IMPERFECT_DOTTED_LIGHT_SHADE_VARIATION")); break; // Custom, no direct equivalent
          case 'b': setCurrentTile(getTileIndex("CYCLOPS_FACE")); break; // Custom, no direct equivalent
        }

      }
    }
  
    return false; // Prevent default behavior
}
  

function xyToIndex(x, y) {
  return y * SPRITESHEET_COLS + x;
}

let textIndex = 0;
let textTimer;
let textArray = [];

function displayText() {
  textArray = fileText.join('\n').split(''); // Combine lines and split into characters
  textTimer = setInterval(displayCharacter, 100); // 200ms for two characters per second
}

function displayCharacter() {
  if (textIndex < textArray.length) {
    let char = textArray[textIndex++];
    if (char !== ' ') {
      displayTileForCharacter(char);
    } else {
      setCurrentTile(getTileIndex("WHITE_FULL_BLOCK"));
    }
  } else {
    // Once we've reached the end of the textArray, reset textIndex to start over
    textIndex = 0;
    clearInterval(textTimer);
    setTimeout(() => { textTimer = setInterval(displayCharacter, 100); }, 500); // Restart the typing effect
  }
}

function displayTileForCharacter(char) {
  let tileName;
    
  // Handle numbers
  if (char >= '0' && char <= '9') {
      tileName = 'DIGIT_' + char; // Assumes tiles named like DIGIT_1, DIGIT_2, etc. in your JSON
  } 
  // Handle uppercase letters
  else if (char >= 'A' && char <= 'Z') {
      tileName = 'LATIN_CAPITAL_LETTER_' + char; // Assumes tiles named like LATIN_CAPITAL_LETTER_A
  } 
  // Handle lowercase letters
  else if (char >= 'a' && char <= 'z') {
      let uppercaseChar = char.toUpperCase();
      tileName = 'LATIN_SMALL_LETTER_' + uppercaseChar; // Assumes tiles named like LATIN_SMALL_LETTER_A
  }

  // If tileName was set, look it up and set the tile
  if (tileName && spriteData.tiles[tileName]) {
      setCurrentTile(getTileIndex(tileName));
  } else {
      // Map non-alphanumeric characters to their corresponding tiles
      switch (char) {
        case '!': setCurrentTile(getTileIndex("EXCLAMATION_MARK")); break;
        case '@': setCurrentTile(getTileIndex("COMMERCIAL_AT")); break;
        case '#': setCurrentTile(getTileIndex("NUMBER_SIGN")); break;
        case '$': setCurrentTile(getTileIndex("DOLLAR_SIGN")); break;
        case '%': setCurrentTile(getTileIndex("PERCENT_SIGN")); break;
        case '^': setCurrentTile(getTileIndex("CIRCUMFLEX_ACCENT")); break;
        case '&': setCurrentTile(getTileIndex("AMPERSAND")); break;
        case '*': setCurrentTile(getTileIndex("ASTERISK")); break;
        case 'š': setCurrentTile(getTileIndex("LATIN_SMALL_LETTER_S_WITH_CARON")); break;
        case ' ': setCurrentTile(getTileIndex("WHITE_FULL_BLOCK")); break;
        case '(': setCurrentTile(getTileIndex("LEFT_PARENTHESIS")); break;
        case ')': setCurrentTile(getTileIndex("RIGHT_PARENTHESIS")); break;
        case '-': setCurrentTile(getTileIndex("HYPHEN_MINUS")); break;
        case '_': setCurrentTile(getTileIndex("LOW_LINE")); break;
        case '+': setCurrentTile(getTileIndex("PLUS_SIGN")); break;
        case '=': setCurrentTile(getTileIndex("EQUALS_SIGN")); break;
        case '.': setCurrentTile(getTileIndex("FULL_STOP")); break;
        case ',': setCurrentTile(getTileIndex("COMMA")); break;
        case ':': setCurrentTile(getTileIndex("COLON")); break;
        case ';': setCurrentTile(getTileIndex("SEMICOLON")); break;
        case '\'': setCurrentTile(getTileIndex("APOSTROPHE")); break;
        case '"': setCurrentTile(getTileIndex("QUOTATION_MARK")); break;
        case '<': setCurrentTile(getTileIndex("LESS_THAN_SIGN")); break;
        case '>': setCurrentTile(getTileIndex("GREATER_THAN_SIGN")); break;
        case '?': setCurrentTile(getTileIndex("QUESTION_MARK")); break;
        case '/': setCurrentTile(getTileIndex("SOLIDUS")); break;
        case '\\': setCurrentTile(getTileIndex("REVERSE_SOLIDUS")); break;
        case '|': setCurrentTile(getTileIndex("VERTICAL_LINE")); break;
        case '[': setCurrentTile(getTileIndex("LEFT_SQUARE_BRACKET")); break;
        case ']': setCurrentTile(getTileIndex("RIGHT_SQUARE_BRACKET")); break;
        default: setCurrentTile(getTileIndex("BLANK")); // Fallback for unmapped characters
      }
    }
}