let tiles = []; 
let tileMap = [];
let spritesheet;
let spritesheetData;
let baseColor;
let colors = []; 
let sounds = [];
let videoCounter = 0;
// Function to convert x, y coordinates to an index
function xyToIndex(x, y) {
  return y * 23 + x;
}

const globalVars = {
  
  SPRITESHEET_PATH: './assets/spritesheets/libuse40x30-cp437.png',
  SPRITE_DATA_PATH: './assets/spritesheets/spriteData.json',
  TILE_WIDTH: 40,
  TILE_HEIGHT: 30,
  TILE_HALF_WIDTH: 20,
  TILE_HALF_HEIGHT: 15,
  CANVAS_COLS: 65,
  CANVAS_ROWS: 60,
  SPRITESHEET_COLS: 23,
  SPRITESHEET_ROWS: 11,
  MAX_TILES: 65 * 60 // CANVAS_COLS * CANVAS_ROWS
};

const altCharToTileName = {
  '¡': "DOUBLE_EXCLAMATION_MARK",
  '™': "LEFT_ONE_FIFTH_BLOCK",
  '£': "LEG",
  '¢': "UPWARDS_ARROW_WITH_TIP_LEFTWARDS",
  '∞': "BLACK_LOWER_LEFT_TRIANGLE_WITH_DARK_SHADE_UPPER_RIGHT_TRIANGLE",
  '§': "MEDIUM_SHADE",
  '¶': "MEDIUM_LIGHT_SHADE_LOWER_LEFT_TRIANGLE_WITH_DARK_SHADE_UPPER_RIGHT_TRIANGLE",
  '•': "MIDDLE_DOT",
  'ª': "MEDIUM_LIGHT_SHADE",
  'º': "WALL_TOP",
  '–': "BLACK_LOWER_LEFT_TRIANGLE",
  '≠': "MEDIUM_SHADE_LOWER_LEFT_TRIANGLE",
  'œ': "OPAQUE_DOTTED_LIGHT_SHADE",
  '∑': "LATIN_SMALL_LETTER_C_WITH_CARON",
  '´': "WHITE_LEG",
  '®': "OPAQUE_QUADRANT_UPPER_LEFT_AND_LOWER_LEFT_AND_LOWER_RIGHT",
  '†': "DARK_SMILING_FACE",
  '¥': "EYE_OF_PROVIDENCE",
  'ˆ': "CARON",
  'ø': "INVERTED_CHECKER_BOARD",
  'π': "FLOATING_LEGS",
  'å': "LIGHT_SHADE_LOWER_RIGHT_TRIANGLE",
  'ß': "CHAIN_LINK_VERTICAL",
  '∂': "CHAIN_LINK_HORIZONTAL",
  'ƒ': "IMPERFECT_DOTTED_LIGHT_SHADE_VARIATION",
  '©': "LATIN_SMALL_LETTER_S_WITH_CARON",
  '˙': "FULL_BLOCK",
  '∆': "INVERTED_EYE_OF_PROVIDENCE",
  '˚': "WHITE_FLORETTE",
  '¬': "BOX_TOP_RIGHT",
  '…': "BOX_DRAWING_LIGHT_HORIZONTAL",
  'æ': "CANDLE_STICK",
  'Ω': "DOOR_TOP",
  '≈': "DOOR_BOTTOM",
  'ç': "LATIN_SMALL_LETTER_O_WITH_ACUTE",
  '√': "BALLOT_BOX_WITH_X",
  '∫': "BOX_DRAWING_HEAVY_LEFT_LIGHT_RIGHT",
  '˜': "BOX_BOTTOM_RIGHT",
  'µ': "LOWER_ONE_HALF_BLOCK",
  '≤': "LEFT_ONE_HALF_BLOCK",
  '≥': "RIGHT_ONE_HALF_BLOCK",
  '÷': "BLACK_SQUARE",
  'é': "LATIN_SMALL_LETTER_E_WITH_ACUTE",
  'í': "LATIN_SMALL_LETTER_I_WITH_ACUTE",
  'á': "LATIN_SMALL_LETTER_A_WITH_ACUTE",
  'č': "LATIN_SMALL_LETTER_C_WITH_CARON",
  'š': "LATIN_SMALL_LETTER_S_WITH_CARON"
};

// Attach to window
window.myAppGlobals = globalVars;