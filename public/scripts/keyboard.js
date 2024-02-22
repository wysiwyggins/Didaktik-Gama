let directionUpwards = false;
let spriteSheet;
let fileText;

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

// Tiles

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
const DIGIT_0 = xyToIndex(2, 2);
const DIGIT_1 = xyToIndex(3, 2);
const DIGIT_2 = xyToIndex(4, 2);
const DIGIT_3 = xyToIndex(5, 2);
const DIGIT_4 = xyToIndex(6, 2);
const DIGIT_5 = xyToIndex(7, 2);
const DIGIT_6 = xyToIndex(9, 2);
const DIGIT_7 = xyToIndex(9, 2);
const DIGIT_8 = xyToIndex(10, 2);
const DIGIT_9 = xyToIndex(12, 2);
const COLON = xyToIndex(12, 3);
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
const LATIN_SMALL_LETTER_C_WITH_CARON = xyToIndex(20, 5);
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
const LATIN_SMALL_LETTER_S_WITH_CARON = xyToIndex(2, 7);
const CARON = xyToIndex(3, 7);
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
const WHITE_FULL_BLOCK = xyToIndex(21,7);

const BOX_UP_HORIZONTAL = xyToIndex(8,8);
const BOX_DOWN_HORIZONTAL = xyToIndex(9,8);
const BOX_RIGHT_VERTICAL = xyToIndex(10,8);
const BOX_HORIZONTAL = xyToIndex(11, 8);
const BOX_VERTICAL_HORIZONTAL = xyToIndex(12,8);
const BOX_BOTTOM_RIGHT = xyToIndex(7, 9);
const FULL_BLOCK = xyToIndex(9, 9);
const BOX_TOP_LEFT = xyToIndex(8, 9);
const BOX_HORIZONTAL_HALF = xyToIndex(20,10);

function preload() {
  spriteSheet = loadImage('/public/assets/spritesheets/libuse40x30-cp437.png');
  fileText = loadStrings('/public/data/libuse.txt');
}

function setup() {
  createCanvas(CANVAS_COLS * TILE_WIDTH, CANVAS_ROWS * TILE_HEIGHT);
  for (let y = 0; y < CANVAS_ROWS; y++) {
    let currentRow = [];  // Renamed from 'row' to avoid name conflict
    for (let x = 0; x < CANVAS_COLS; x++) {
      currentRow.push(BLANK);
    }
    tileMap.push(currentRow);
  }
  if (fileText) {
    displayText();
  }
}

function draw() {
    background(255);
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
    tileMap[cursorY][cursorX] = { tile: tileIndex, bgColor: currentPenColor };
    advanceCursor();
}

function advanceCursor() {
    if (directionUpwards) {
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
  
    console.log("Cursor position:", cursorX, cursorY); // Debugging statement
}

function retreatCursor() {
    if (cursorY > 0) {
      cursorY--;
    } else if (cursorX > 0) {
      cursorY = CANVAS_ROWS - 1;
      cursorX--;
    }
    tileMap[cursorY][cursorX] = BLANK;
}

function keyPressed() {
    // Toggle capsLockActive with Caps Lock key press
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
        setCurrentTile(WHITE_FULL_BLOCK);
        return false;
    }

    if (!keyIsDown(CONTROL) && !keyIsDown(ALT)) {
      // Check for alphanumeric characters
      if (key >= '0' && key <= '9') {
        setCurrentTile(eval('DIGIT_' + key));
        return false;
      }
      if (key >= 'A' && key <= 'Z') {
        setCurrentTile(eval('LATIN_CAPITAL_LETTER_' + key));
        return false;
      }
      if (key >= 'a' && key <= 'z') {
        let uppercaseKey = key.toUpperCase();
        setCurrentTile(eval('LATIN_SMALL_LETTER_' + uppercaseKey));
        return false;
      }
    }
  
    // Ctrl + key for symbols
    if (keyIsDown(CONTROL)) {
      switch (key) {
        case '1': setCurrentTile(BLACK_HEART_SUITE); break;
        case '2': setCurrentTile(BLACK_DIAMOND_SUITE); break;
        case '3': setCurrentTile(BLACK_CLUB_SUITE); break;
        case '4': setCurrentTile(BLACK_SPADE_SUITE); break;
        case '5': setCurrentTile(BULLET); break;
        case '6': setCurrentTile(OPAQUE_INVERSE_DIAMOND_SUITE); break;
        case '7': setCurrentTile(INVERSE_BULLET); break;
        case '8': setCurrentTile(WHITE_KEY); break;
        case '9': setCurrentTile(BLACK_KEY); break;
        case '0': setCurrentTile(DOUBLE_EXCLAMATION_MARK); break;
        case '-': setCurrentTile(DOWNWARDS_ARROW_ON_LIGHT_SHADE); break;
        case '=': setCurrentTile(UPWARDS_ARROW_ON_LIGHT_SHADE); break;
        case 'q': setCurrentTile(UPWARDS_ARROW); break;
        case 'w': setCurrentTile(DOWNWARDS_ARROW); break;
        case 'e': setCurrentTile(LEFTWARDS_ARROW); break;
        case 'r': setCurrentTile(RIGHTWARDS_ARROW); break;
        case 't': setCurrentTile(BOX_BOTTOM_LEFT); break;
        case 'y': setCurrentTile(UPWARD_POINTING_TRIANGLE); break;
        case 'u': setCurrentTile(DOWNWARD_POINTING_TRIANGLE); break;
        case 'i': setCurrentTile(BOX_TOP_RIGHT); break;
        case 'o': setCurrentTile(BOX_BOTTOM_RIGHT); break;
        case 'p': setCurrentTile(BOX_UP_HORIZONTAL); break;
        case '[': setCurrentTile(BOX_DOWN_HORIZONTAL); break;
        case ']': setCurrentTile(BOX_LEFT_VERTICAL); break;
        case '\\': setCurrentTile(BOX_RIGHT_VERTICAL); break;
        case 'a': setCurrentTile(BOX_HORIZONTAL); break;
        case 's': setCurrentTile(BOX_VERTICAL); break;
        case 'd': setCurrentTile(BOX_VERTICAL_HORIZONTAL); break;
        case 'f': setCurrentTile(FULL_BLOCK); break;
        case 'g': setCurrentTile(BOX_TOP_LEFT); break;
        case 'h': setCurrentTile(BOX_HORIZONTAL_HALF); break;
        case 'j': setCurrentTile(BOX_VERTICAL_HALF); break;
        case 'k': setCurrentTile(LEFT_HALF_BLOCK_WITH_LIGHT_SHADE_UPPER_RIGHT_AND_MEDIUM_SHADE_LOWER_RIGHT); break;
        case 'l': setCurrentTile(SKELETON_LEGS); break;
        case ';': setCurrentTile(SKULL); break;
        case '\'': setCurrentTile(DOOR_TOP); break;
        case 'z': setCurrentTile(DOOR_BOTTOM); break;
        case 'x': setCurrentTile(EMPHASIZED_LATIN_CAPITAL_LETTER_X); break;
        case 'c': setCurrentTile(EMPHASIZED_EXCLAMATION_MARK); break;
        case 'v': setCurrentTile(LIGHT_SHADE); break;
        case 'b': setCurrentTile(WALL); break;

      }
    }
  
    // Alt + key for other symbols
    if (keyIsDown(ALT)) {
      switch (key) {
        case '1': setCurrentTile(OPAQUE_DARK_SMILING_FACE); break;
        case '2': setCurrentTile(OPAQUE_WHITE_SMILING_FACE); break;
        case '3': setCurrentTile(FEMALE_SYMBOL); break;
        case '4': setCurrentTile(BOW_AND_ARROW); break;
        case '5': setCurrentTile(BEAMED_EIGHTH_NOTES); break;
        case '6': setCurrentTile(PRISON_WINDOW); break;
        case '7': setCurrentTile(BLACK_RIGHT_POINTING_TRIANGLE); break;
        case '8': setCurrentTile(BLACK_LEFT_POINTING_TRIANGLE); break;
        case '9': setCurrentTile(ROLLING_ON_THE_FLOOR_LAUGHING); break;
        case '0': setCurrentTile(QUADRANT_UPPER_LEFT_AND_LOWER_LEFT_AND_LOWER_RIGHT); break;
        case '-': setCurrentTile(VERTICAL_LINE); break;
        case '=': setCurrentTile(LEG); break;
        case 'q': setCurrentTile(UPWARDS_ARROW_WITH_TIP_LEFTWARDS); break;
        case 'w': setCurrentTile(BLACK_LOWER_LEFT_TRIANGLE_WITH_DARK_SHADE_UPPER_RIGHT_TRIANGLE); break;
        case 'e': setCurrentTile(MEDIUM_SHADE); break;
        case 'r': setCurrentTile(LIGHT_SHADE_LOWER_LEFT_TRIANGLE_WITH_DARK_SHADE_UPPER_RIGHT_TRIANGLE); break;
        case 't': setCurrentTile(LIGHT_SHADE_LOWER_RIGHT_TRIANGLE_WITH_MEDIUM_SHADE_UPPER_LEFT_TRIANGLE); break;
        case 'y': setCurrentTile(MEDIUM_LIGHT_SHADE); break;
        case 'u': setCurrentTile(BLACK_LOWER_LEFT_TRIANGLE); break;
        case 'i': setCurrentTile(MEDIUM_SHADE_LOWER_LEFT_TRIANGLE); break;
        case 'o': setCurrentTile(DOTTED_LIGHT_SHADE); break;
        case 'p': setCurrentTile(ROTATED_LATIN_CAPITAL_LETTER_F_ON_LIGHT_SHADE); break;
        case '[': setCurrentTile(WHITE_LEG); break;
        case ']': setCurrentTile(OPAQUE_QUADRANT_UPPER_LEFT_AND_LOWER_LEFT_AND_LOWER_RIGHT); break;
        case 'a': setCurrentTile(DARK_SMILING_FACE); break;
        case 's': setCurrentTile(LATIN_SMALL_LETTER_S_WITH_CARON); break;
        case 'd': setCurrentTile(INVERTED_EYE_OF_PROVIDENCE); break;
        case 'f': setCurrentTile(EYE_OF_PROVIDENCE); break;
        case 'g': setCurrentTile(INVERTED_CHECKER_BOARD); break;
        case 'h': setCurrentTile(CHECKER_BOARD); break;
        case 'j': setCurrentTile(CANDLE_STICK); break;
        case 'k': setCurrentTile(INVERSE_DIAMOND_SUITE); break;
        case 'l': setCurrentTile(IMPERFECT_DOTTED_LIGHT_SHADE); break;
        case ';': setCurrentTile(OPQAQUE_DOOR_TOP); break;
        case '\'': setCurrentTile(OPAQUE_DOOR_BOTTOM); break;
        case 'z': setCurrentTile(BLACK_LOWER_RIGHT_TRIANGLE_WITH_DARK_SHADE_UPPER_LEFT_TRIANGLE); break;
        case 'x': setCurrentTile(OPAQUE_PRISON_WINDOW); break;
        case 'c': setCurrentTile(LATIN_SMALL_LETTER_C_WITH_CARON); break;
        case 'v': setCurrentTile(SMALL_BLACK_LOWER_RIGHT_TRIANGLE); break;
        case 'b': setCurrentTile(LIGHT_SHADE_UPPER_LEFT_TRIANGLE); break;
        case 'n': setCurrentTile(LIGHT_SHADE_UPPER_RIGHT_TRIANGLE); break;
        case 'm': setCurrentTile(LIGHT_SHADE_LOWER_RIGHT_TRIANGLE); break;
        case ',': setCurrentTile(FLOOR); break;
        case '.': setCurrentTile(IMPERFECT_DOTTED_LIGHT_SHADE_VARIATION); break;
        case '/': setCurrentTile(CYCLOPS_FACE); break;


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

      setCurrentTile(WHITE_FULL_BLOCK);
      clearInterval(textTimer);
      setTimeout(() => { textTimer = setInterval(displayCharacter, 100); }, 500); // Pause for a space
    }
  } else {
    clearInterval(textTimer); // Clear interval when done
  }
}

function displayTileForCharacter(char) {
    if (char >= '0' && char <= '9') {
        setCurrentTile(eval('DIGIT_' + char));
    } else if (char >= 'A' && char <= 'Z') {
        setCurrentTile(eval('LATIN_CAPITAL_LETTER_' + char));
    } else if (char >= 'a' && char <= 'z') {
        let uppercaseChar = char.toUpperCase();
        setCurrentTile(eval('LATIN_SMALL_LETTER_' + uppercaseChar));
    } else {
        // Map non-alphanumeric characters to their corresponding tiles
        switch (char) {
            case '!': setCurrentTile(EXCLAMATION_MARK); break;
            case '@': setCurrentTile(COMMERCIAL_AT); break;
            case '#': setCurrentTile(NUMBER_SIGN); break;
            case '$': setCurrentTile(DOLLAR_SIGN); break;
            case '%': setCurrentTile(PERCENT_SIGN); break;
            case '^': setCurrentTile(CIRCUMFLEX_ACCENT); break;
            case '&': setCurrentTile(AMPERSAND); break;
            case '*': setCurrentTile(ASTERISK); break;
            case 'š': setCurrentTile(LATIN_SMALL_LETTER_S_WITH_CARON); break;
            case ' ': setCurrentTile(WHITE_FULL_BLOCK); break;
            case '(': setCurrentTile(LEFT_PARENTHESIS); break;
            case ')': setCurrentTile(RIGHT_PARENTHESIS); break;
            case '-': setCurrentTile(HYPHEN_MINUS); break;
            case '_': setCurrentTile(LOW_LINE); break;
            case '+': setCurrentTile(PLUS_SIGN); break;
            case '=': setCurrentTile(EQUALS_SIGN); break;
            case '.': setCurrentTile(FULL_STOP); break;
            case ',': setCurrentTile(COMMA); break;
            case ':': setCurrentTile(COLON); break;
            case ';': setCurrentTile(SEMICOLON); break;
            case '\'': setCurrentTile(APOSTROPHE); break;
            case '"': setCurrentTile(QUOTATION_MARK); break;
            case '<': setCurrentTile(LESS_THAN_SIGN); break;
            case '>': setCurrentTile(GREATER_THAN_SIGN); break;
            case '?': setCurrentTile(QUESTION_MARK); break;
            case '/': setCurrentTile(SOLIDUS); break;
            case '\\': setCurrentTile(REVERSE_SOLIDUS); break;
            case '|': setCurrentTile(VERTICAL_LINE); break;
            case '[': setCurrentTile(LEFT_SQUARE_BRACKET); break;
            case ']': setCurrentTile(RIGHT_SQUARE_BRACKET); break;
            case '»': penColor('1111CC'); break;
            case '«': penColor(null); break;


            default: setCurrentTile(BLANK); // Fallback for unmapped characters
        }
    }
}