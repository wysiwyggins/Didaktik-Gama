let directionUpwards = false;
let fileText;
let toneStarted = false;
let soundFiles = [];
let wordBuffer = "";
let fileIndex;
let cursorX = 0;
let cursorY = 0;
let currentPenColor = '#FFFFFF';
let tilesDisplayed = 0;
let typingPaused = false; 
let lastUserInputTime = 0;
const pauseDuration = 5000;

let textIndex = 0;
let textTimer;

let randomColor;
let complementaryColor;
let useRandomColor = true;

function mapAltCharacterToTileName(char) {
  return altCharToTileName[char]; 
}

function getTileIndexFromChar(char) {
  const tileName = mapAltCharacterToTileName(char);
  if (tileName) {
      return getTileIndex(tileName);
  }
  return null;
}

function preload() {
  spriteSheet = loadImage(globalVars.SPRITESHEET_PATH);
  fileIndex = floor(random(1, 20));
  backgroundImage = loadImage(`./assets/images/${fileIndex}.png`);
  fileText = loadStrings(`./data/texts/${fileIndex}.txt`);
  spriteData = loadJSON(globalVars.SPRITE_DATA_PATH);
}

function setup() {
  try {
    socket = io.connect('http://localhost:3000');
  } catch (error) {
    console.error('Socket connection failed.', error);
  }
  createCanvas(globalVars.CANVAS_COLS * globalVars.TILE_HALF_WIDTH, globalVars.CANVAS_ROWS * globalVars.TILE_HALF_HEIGHT);
  for (let y = 0; y < globalVars.CANVAS_ROWS; y++) {
    let currentRow = [];
    for (let x = 0; x < globalVars.CANVAS_COLS; x++) {
      currentRow.push(getTileIndex("BLANK"));
    }
    tileMap.push(currentRow);
  }
  if (fileText) {
    textArray = fileText.join('\n').split('');
    displayText();
  }
  wave1 = new p5.Oscillator();
  wave1.amp(0.5);
  wave1.setType('triangle');
  wave2 = new p5.Oscillator();
  wave2.amp(0.5);
  wave2.setType('triangle');
  reverb = new p5.Reverb();

  // Initialize colors
  randomColor = color(random(100,255), random(100,255), random(100,255));
  complementaryColor = color(255 - red(randomColor), 255 - green(randomColor), 255 - blue(randomColor));
}

function speak(text) {
  if (text.trim().length > 0) {
      let utterance = new SpeechSynthesisUtterance(text);
      if (fileIndex === 10) {
          utterance.lang = 'cs-CZ';
      }
      speechSynthesis.speak(utterance);
  }
}

function draw() {
  if (!toneStarted) {
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
  let coords = spriteData.tiles[tileName];
  if (!coords) {
    console.error("Tile not found:", tileName);
    return [0, 0];
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
      currentPenColor = null;
  }
}

function drawCursor() {
  noStroke();
  noFill();
  rect(cursorX * globalVars.TILE_HALF_WIDTH, cursorY * globalVars.TILE_HALF_HEIGHT, globalVars.TILE_HALF_WIDTH, globalVars.TILE_HALF_HEIGHT);
}

function setCurrentTile(tileIndex) {
  if (cursorY >= 0 && cursorY < tileMap.length && cursorX >= 0 && cursorX < tileMap[cursorY].length) {
      tileMap[cursorY][cursorX] = { tile: tileIndex, bgColor: useRandomColor ? randomColor : complementaryColor };
      useRandomColor = !useRandomColor;
      if (tileIndex === getTileIndex("BLANK") || tileIndex === getTileIndex("WHITE_FULL_BLOCK")) {
          if (wordBuffer.length > 0) {
              speak(wordBuffer);
              wordBuffer = "";
          }
      }
      advanceCursor();
      tilesDisplayed++;
      if (tilesDisplayed >= globalVars.MAX_TILES - 180) {
        window.api.navigate('automata2.html');
      }
  } else {
      console.log("Cursor position out of bounds:", cursorX, cursorY);
  }
}

function advanceCursor() {
  if (keyIsDown(CONTROL)) {
    cursorY++;
    if (cursorY >= globalVars.CANVAS_ROWS) {
      cursorY = 0;
      cursorX++;
      if (cursorX >= globalVars.CANVAS_COLS) {
        cursorX = 0;
      }
    }
  } else if (keyIsDown(ALT)) {
    cursorX--;
    if (cursorX <= 0) {
        cursorX = globalVars.CANVAS_COLS - 1;
        cursorY--;
        if (cursorY >= globalVars.CANVAS_ROWS) {
            cursorY = 0;
        }
    }
  } else if (directionUpwards) {
    if (cursorY > 0) {
      cursorY--;
    } else {
      if (cursorX > 0) {
        cursorX--;
      } else {
        cursorX = globalVars.CANVAS_COLS - 1;
      }
      cursorY = globalVars.CANVAS_ROWS - 1;
    }
  } else {
    cursorX++;
    if (cursorX >= globalVars.CANVAS_COLS) {
        cursorX = 0;
        cursorY++;
        if (cursorY >= globalVars.CANVAS_ROWS) {
            cursorY = 0;
        }
    }
  }
  wave1.freq((50 + cursorX * cursorY) % random(50, 260));
  wave2.freq((50 + cursorY - cursorX) / random(50, 260));
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
  lastUserInputTime = millis();
  typingPaused = true;
  if (keyCode === 33) {
      directionUpwards = true;
      return false;
  } else if (keyCode === 34) {
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

  if (!keyIsDown(CONTROL) && !keyIsDown(ALT)) {
      let tileName;
      if (key >= '0' && key <= '9') {
          tileName = 'DIGIT_' + key;
      } else if (key >= 'A' && key <= 'Z') {
          tileName = 'LATIN_CAPITAL_LETTER_' + key;
      } else if (key >= 'a' && key <= 'z') {
          let uppercaseKey = key.toUpperCase();
          tileName = 'LATIN_SMALL_LETTER_' + uppercaseKey;
      } else if (key == 'é') {
          tileName = 'LATIN_SMALL_LETTER_E_WITH_ACUTE';
      } else if (key == 'á') {
          tileName = 'LATIN_SMALL_LETTER_A_WITH_ACUTE';
      } else if (key == 'í') {
          tileName = 'LATIN_SMALL_LETTER_I_WITH_ACUTE';
      } else if (key == 'č') {
          tileName = 'LATIN_SMALL_LETTER_C_WITH_CARON';
      } else if (key == 'š') {
          tileName = 'LATIN_SMALL_LETTER_S_WITH_CARON';
      }

      if (tileName && spriteData.tiles[tileName]) {
          setCurrentTile(getTileIndex(tileName));
          return false;
      }
  }

  if (keyIsDown(CONTROL)) {
    switch (key) {
      case '1': setCurrentTile(getTileIndex("BLACK_HEART_SUITE")); break;
      case '2': setCurrentTile(getTileIndex("BLACK_DIAMOND_SUITE")); break;
      case '3': setCurrentTile(getTileIndex("BLACK_CLUB_SUITE")); break;
      case '4': setCurrentTile(getTileIndex("BLACK_SPADE_SUITE")); break;
      case '5': setCurrentTile(getTileIndex("BULLET")); break;
      case '6': setCurrentTile(getTileIndex("OPAQUE_INVERSE_DIAMOND_SUITE")); break;
      case '7': setCurrentTile(getTileIndex("INVERSE_BULLET")); break;
      case '8': setCurrentTile(getTileIndex("WHITE_KEY")); break;
      case '9': setCurrentTile(getTileIndex("BLACK_KEY")); break;
      case '0': setCurrentTile(getTileIndex("DOUBLE_EXCLAMATION_MARK")); break;
      case '-': setCurrentTile(getTileIndex("DOWNWARDS_ARROW_ON_LIGHT_SHADE")); break;
      case '=': setCurrentTile(getTileIndex("UPWARDS_ARROW_ON_LIGHT_SHADE")); break;
      case 'q': setCurrentTile(getTileIndex("UPWARDS_ARROW")); break;
      case 'w': setCurrentTile(getTileIndex("DOWNWARDS_ARROW")); break;
      case 'e': setCurrentTile(getTileIndex("LEFTWARDS_ARROW")); break;
      case 'r': setCurrentTile(getTileIndex("RIGHTWARDS_ARROW")); break;
      case 't': setCurrentTile(getTileIndex("UPWARD_POINTING_TRIANGLE")); break;
      case 'y': setCurrentTile(getTileIndex("DOWNWARD_POINTING_TRIANGLE")); break;
      case 'u': setCurrentTile(getTileIndex("BOX_TOP_RIGHT")); break;
      case 'i': setCurrentTile(getTileIndex("BOX_BOTTOM_RIGHT")); break;
      case '|': setCurrentTile(getTileIndex("BOX_UP_HORIZONTAL")); break;
      case 'p': setCurrentTile(getTileIndex("BOX_DOWN_HORIZONTAL")); break;
      case '[': setCurrentTile(getTileIndex("BOX_LEFT_VERTICAL")); break;
      case ']': setCurrentTile(getTileIndex("BOX_RIGHT_VERTICAL")); break;
      case 'a': setCurrentTile(getTileIndex("BOX_HORIZONTAL")); break;
      case 's': setCurrentTile(getTileIndex("BOX_VERTICAL")); break;
      case 'd': setCurrentTile(getTileIndex("BOX_VERTICAL_HORIZONTAL")); break;
      case 'f': setCurrentTile(getTileIndex("FULL_BLOCK")); break;
      case 'g': setCurrentTile(getTileIndex("BOX_TOP_LEFT")); break;
      case 'h': setCurrentTile(getTileIndex("LIGHT_SHADE")); break;
      case 'j': setCurrentTile(getTileIndex("MEDIUM_SHADE")); break;
      case 'k': setCurrentTile(getTileIndex("DARK_SHADE")); break;
      case 'l': setCurrentTile(getTileIndex("SKULL")); break;
      case ';': setCurrentTile(getTileIndex("DOOR_TOP")); break;
      case '\'': setCurrentTile(getTileIndex("DOOR_BOTTOM")); break;
      case 'c': setCurrentTile(getTileIndex("LATIN_SMALL_LETTER_C_WITH_CARON")); break;
      case 'x': setCurrentTile(getTileIndex("LATIN_SMALL_LETTER_S_WITH_CARON")); break;
      case 'o': setCurrentTile(getTileIndex("LATIN_SMALL_LETTER_O_WITH_ACUTE")); break;
      case 'v': setCurrentTile(getTileIndex("LATIN_SMALL_LETTER_I_WITH_ACUTE")); break;
    }
  }
  const tileIndex = getTileIndexFromChar(key);
  if (tileIndex !== null) {
      setCurrentTile(tileIndex);
      return false;
  }
  return false;
}

function xyToIndex(x, y) {
  return y * globalVars.SPRITESHEET_COLS + x;
}

function displayText() {
  textTimer = setInterval(displayCharacter, 100);
}

function displayCharacter() {
  if (typingPaused) {
    if (millis() - lastUserInputTime > pauseDuration) {
      typingPaused = false;
    } else {
      return;
    }
  }
  if (textIndex < textArray.length) {
    let char = textArray[textIndex++];
    if (char === '\n') {
      cursorY++;
      cursorX = 0;
      if (cursorY >= globalVars.CANVAS_ROWS) {
        cursorY = 0;
      }
    } else if (char !== ' ') {
      displayTileForCharacter(char);
    } else {
      setCurrentTile(getTileIndex("BLANK"));
    }
  } else {
    textIndex = 0;
    clearInterval(textTimer);
    setTimeout(() => { textTimer = setInterval(displayCharacter, 100); }, 500);
  }
}

function displayTileForCharacter(char) {
  let tileName;
  if (char >= '0' && char <= '9') {
      tileName = 'DIGIT_' + char;
  } else if (char >= 'A' && char <= 'Z') {
      tileName = 'LATIN_CAPITAL_LETTER_' + char;
  } else if (char >= 'a' && char <= 'z') {
      let uppercaseChar = char.toUpperCase();
      tileName = 'LATIN_SMALL_LETTER_' + uppercaseChar;
  } else if (char === 'é') {
      tileName = 'LATIN_SMALL_LETTER_E_WITH_ACUTE';
  } else if (char === 'á') {
      tileName = 'LATIN_SMALL_LETTER_A_WITH_ACUTE';
  } else if (char === 'í') {
      tileName = 'LATIN_SMALL_LETTER_I_WITH_ACUTE';
  } else if (char === 'č') {
      tileName = 'LATIN_SMALL_LETTER_C_WITH_CARON';
  } else if (char === 'š') {
      tileName = 'LATIN_SMALL_LETTER_S_WITH_CARON';
  }
  if (tileName && spriteData.tiles[tileName]) {
      if (![' ', '\n'].includes(char)) {
          wordBuffer += char;
      }
      setCurrentTile(getTileIndex(tileName));
  } else {
      handleSpecialCharacters(char);
  }
}

function handleSpecialCharacters(char) {
  switch (char) {
      case '!':
          setCurrentTile(getTileIndex("EXCLAMATION_MARK"));
          break;
      default:
          setCurrentTile(getTileIndex("BLANK"));
  }
}

function keyPressed(event) {
  if (event.key === '}') { 
    window.api.navigate('automata2.html');
  } else if (event.key === '{') {
    window.api.navigate('abyss.html');
  } else if (event.key === 'Escape') {
    if (window.api) {
      window.api.quitApp();
    }
  }
}

document.addEventListener('keydown', keyPressed);
