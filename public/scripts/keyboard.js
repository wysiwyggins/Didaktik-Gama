let socket;
let directionUpwards = false;
let fileText;
let toneStarted = false;
let soundFiles = [];

let cursorX = 0;
let cursorY = 0;
currentPenColor = null;
let tilesDisplayed = 0;


//input pause
let typingPaused = false;
let lastUserInputTime = 0;
const pauseDuration = 5000;


function mapAltCharacterToTileName(char) {
  return altCharToTileName[char]; 
}


function getTileIndexFromChar(char) {
  const tileName = mapAltCharacterToTileName(char);
  if (tileName) {
      return getTileIndex(tileName);
  }
  // Handle case where character does not have a mapping or fallback logic
  return null;
}


function preload() {
  spriteSheet = loadImage('./assets/spritesheets/libuse40x30-cp437.png');
  let fileIndex = floor(random(1, 20));
  backgroundImage = loadImage(`./assets/images/${fileIndex}.png`);
  fileText = loadStrings(`./data/texts/${fileIndex}.txt`);
  spritesheetData = loadJSON('./assets/spritesheets/spriteData.json');
  /* for (let i = 0; i <= 22; i++) { // Assuming sound files are named 0.wav through 22.wav
    let soundPath = `/public/assets/sound/${i}.wav`;
    soundFiles.push(loadSound(soundPath));
  } */
}


function setup() {
  try {
    socket = io.connect(window.location.origin);
  } catch (error) { 
    console.error('Socket connection failed.');
  }
  createCanvas(globalVars.CANVAS_COLS * globalVars.TILE_HALF_WIDTH, globalVars.CANVAS_ROWS * globalVars.TILE_HALF_HEIGHT);
  console.log(globalVars.CANVAS_COLS * globalVars.TILE_HALF_WIDTH, globalVars.CANVAS_ROWS * globalVars.TILE_HALF_HEIGHT);
  for (let y = 0; y < globalVars.CANVAS_ROWS; y++) {
    let currentRow = [];  // Renamed from 'row' to avoid name conflict
    for (let x = 0; x < globalVars.CANVAS_COLS; x++) {
      currentRow.push(getTileIndex("BLANK"));
    }
    tileMap.push(currentRow);
  }
  if (fileText) {
    displayText();
  }
  wave1 = new p5.Oscillator();
  wave1.amp(0.5);
  wave1.setType('triangle');
  wave2 = new p5.Oscillator();
  wave2.amp(0.5);
  wave2.setType('triangle');
  reverb = new p5.Reverb();
}

function draw() {
    if (!toneStarted){
      wave1.start();
      wave2.start();
      toneStarted = true;
      reverb.process(wave1, 2, 3);
    }
    background(255);
    image(backgroundImage, 0, 0, width, height);
    for (let y = 0; y < globalVars.CANVAS_ROWS; y++) {
      for (let x = 0; x < globalVars.CANVAS_COLS; x++) {
        
        let tileData = tileMap[y][x];
        
        let sx = (tileData.tile % globalVars.SPRITESHEET_COLS) * (globalVars.TILE_HALF_WIDTH * 2);
        let sy = Math.floor(tileData.tile / globalVars.SPRITESHEET_COLS) * (globalVars.TILE_HALF_HEIGHT * 2);
  
        if (tileData.bgColor) {
          fill(tileData.bgColor);
          rect(x * globalVars.TILE_HALF_WIDTH, y * globalVars.TILE_HALF_HEIGHT, globalVars.TILE_HALF_WIDTH, globalVars.TILE_HALF_HEIGHT);
        }
        
        image(spriteSheet, x * globalVars.TILE_HALF_WIDTH, y * globalVars.TILE_HALF_HEIGHT, globalVars.TILE_HALF_WIDTH, globalVars.TILE_HALF_HEIGHT, sx, sy, globalVars.TILE_HALF_WIDTH * 2, globalVars.TILE_HALF_HEIGHT * 2);
      }
    }
    if (!typingPaused) {
      drawCursor();
    }
}

function getTileCoords(tileName) {
  // Retrieve tile coordinates from JSON data
  let coords = spritesheetData.tiles[tileName];
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
  stroke(10, 10, 10);
  noFill();
  rect(cursorX * globalVars.TILE_HALF_WIDTH, cursorY * globalVars.TILE_HALF_HEIGHT, globalVars.TILE_HALF_WIDTH, globalVars.TILE_HALF_HEIGHT);
}

function setCurrentTile(tileIndex) {
  if (cursorY >= 0 && cursorY < tileMap.length && cursorX >= 0 && cursorX < tileMap[cursorY].length) {
    tileMap[cursorY][cursorX] = { tile: tileIndex, bgColor: null };
    if (tileIndex === getTileIndex("BLANK") || tileIndex === getTileIndex("WHITE_FULL_BLOCK")) {
     /*  let randomSoundIndex = Math.floor(Math.random() * soundFiles.length);
      soundFiles[randomSoundIndex].play();
      background(random(50, 255), random(50, 255), random(50, 255)); //it was kind of interesting to change the background color at the end of every word but too much after a while */
      wave1.freq(random(50, 160));
      wave2.freq(random(50, 160));
    }
    advanceCursor();
    tilesDisplayed++;
    if (tilesDisplayed >= globalVars.MAX_TILES) {
      window.location.href = 'automata.html';
    }
  } else {
    console.log("Cursor position out of bounds:", cursorX, cursorY);
  }
}

function advanceCursor() {
  if (keyIsDown(CONTROL)) {
    // Move cursor to the right
    cursorX++;
    if (cursorX >= globalVars.CANVAS_COLS) {
        cursorX = 0;
        cursorY++;
        if (cursorY >= globalVars.CANVAS_ROWS) {
            cursorY = 0;  // Optional: Reset to start or stop at the end
        }
    }
} else if (keyIsDown(ALT)) {
  // Move cursor to the left
  cursorX--;
  if (cursorX <= 0) {
      cursorX = globalVars.CANVAS_COLS - 1;
      cursorY--;
      if (cursorY >= globalVars.CANVAS_ROWS) {
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
          cursorX = globalVars.CANVAS_COLS - 1;
        }
        cursorY = globalVars.CANVAS_ROWS - 1; // Move to the bottom row
      }
    } else {
      // Move cursor downwards
      cursorY++;
      if (cursorY >= globalVars.CANVAS_ROWS) {
        cursorY = 0;
        cursorX++;
        if (cursorX >= globalVars.CANVAS_COLS) {
          cursorX = 0;  // Optional: Reset to start or stop at the end
        }
      }
    }
    wave1.freq((50 +cursorX * cursorY)% random(50, 260));
    wave2.freq((50 + cursorY - cursorX) / random(50, 260));
        
    //console.log("Cursor position:", cursorX, cursorY); // Debugging statement
}

function retreatCursor() {
    if (cursorY > 0) {
      cursorY--;
    } else if (cursorX > 0) {
      cursorY = globalVars.CANVAS_ROWS - 1;
      cursorX--;
    }
    tileMap[cursorY][cursorX] = getTileIndex("BLANK");
}

function keyPressed() {
  console.log("KeyPressed detected: Key = " + key + ", keyCode = " + keyCode);

  lastUserInputTime = millis();
  typingPaused = true;
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
  if (key === '}') { 
    window.location.href = 'automata.html';
  } else if (event.key === '{') {
    window.location.href = 'abyss.html';
  }
  // Handle alphanumeric characters
  if (!keyIsDown(CONTROL) && !keyIsDown(ALT)) {
      let tileName;
      if (key >= '0' && key <= '9') {
          tileName = 'DIGIT_' + key; // Assumes you have tiles named like DIGIT_1, DIGIT_2, etc.
          console.log(tileName);
      } else if (key >= 'A' && key <= 'Z') {
          tileName = 'LATIN_CAPITAL_LETTER_' + key; // Assumes tiles named like LATIN_CAPITAL_LETTER_A
          console.log(tileName);
      } else if (key >= 'a' && key <= 'z') {
          let uppercaseKey = key.toUpperCase();
          tileName = 'LATIN_SMALL_LETTER_' + uppercaseKey; // Assumes tiles named like LATIN_SMALL_LETTER_A
          console.log(tileName);
      }

      if (tileName && spritesheetData.tiles[tileName]) {
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
    const tileIndex = getTileIndexFromChar(key);
    if (tileIndex !== null) {
        setCurrentTile(tileIndex);
        return false;
    }
    return false; // Prevent default behavior
}
  

function xyToIndex(x, y) {
  return y * globalVars.SPRITESHEET_COLS + x;
}

let textIndex = 0;
let textTimer;
let textArray = [];

function displayText() {
  textArray = fileText.join('\n').split(''); // Combine lines and split into characters
  textTimer = setInterval(displayCharacter, 100); // 200ms for two characters per second
}

function displayCharacter() {
  if (typingPaused) {
    if (millis() - lastUserInputTime > pauseDuration) {
        // Enough time has passed, resume typing
        typingPaused = false;
    } else {
        // Still within the pause duration, skip this cycle
        return;
    }
  }
  if (textIndex < textArray.length) {
    let char = textArray[textIndex++];
    if (char !== ' ') {
      displayTileForCharacter(char);
    } else {
      setCurrentTile(getTileIndex("BLANK"));
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
  if (tileName && spritesheetData.tiles[tileName]) {
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
        case ' ': setCurrentTile(getTileIndex("BLANK")); break;
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



// Add an event listener to the document to handle keydown events
document.addEventListener('keydown', keyPressed);
