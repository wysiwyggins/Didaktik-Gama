let tintcolor;

let CANVAS_COLS;
let CANVAS_ROWS;
let shouldInvertColors = false;
let hoveredTile = null;
let figureName = '';
let figures = 0;

const tilePlacementDelayNormal = 50; 
const tilePlacementDelayInverted = 0; 

function preload() {
  spritesheet = loadImage(globalVars.SPRITESHEET_PATH);
  spritesheetData = loadJSON(globalVars.SPRITE_DATA_PATH);
  for (let i = 0; i < 23; i++) {
    sounds[i] = loadSound(`./assets/sound/${i}.wav`);
  }
  preloadCorporaFiles();
   
  let uniqueTiles = {};
  for (let key in spritesheetData.tiles) {
    let coords = spritesheetData.tiles[key].toString();
    if (!uniqueTiles[coords]) {
      uniqueTiles[coords] = key;
    }
  }
  spritesheetData.uniqueTiles = uniqueTiles;
}

function setup() {
    try {
        socket = io.connect('http://localhost:3000');
      } catch (error) {
        console.error('Socket connection failed.', error);
      }
  CANVAS_COLS = Math.floor(windowWidth / globalVars.TILE_WIDTH);
  CANVAS_ROWS = Math.floor(windowHeight / globalVars.TILE_HEIGHT);

  createCanvas(CANVAS_COLS * globalVars.TILE_WIDTH, CANVAS_ROWS * globalVars.TILE_HEIGHT);
  initializeSketch();
  reverb = new p5.Reverb();
  setupTraceryGrammar();
}

function draw() {
    if (figures > 20) {
        console.log('Figures:', figures);
        if (window.api) {
          window.api.navigate('patterns2.html');
        } else {
          console.error('api is not available');
        }
        return; // Stop further drawing after navigation
      }
  background(baseColor);
  for (let tile of tiles) {
    drawTile(tile);
  }
  if (hoveredTile) {
    drawName(hoveredTile.key, hoveredTile.flipH || hoveredTile.flipV);
  }
  if (figureName) {
    displayFigureName(figureName);
  }
  if (shouldInvertColors) {
    filter(INVERT);
  }
}

function initializeSketch() {
  randomizeBackgroundColor();
  
  tileKeys = Object.keys(spritesheetData.tiles);
  numTiles = int(random(2, 11));
  let centerX = Math.floor(CANVAS_COLS / 2) * globalVars.TILE_WIDTH;
  let centerY = Math.floor(CANVAS_ROWS / 2) * globalVars.TILE_HEIGHT;
  
  tiles = [];
  usedPositions = [];
  currentTileIndex = 0;

  let initialKey = random(tileKeys);
  let initialTile = {
    pos: createVector(centerX, centerY),
    key: initialKey,
    coords: spritesheetData.tiles[initialKey],
    flipH: random() > 0.8,  
    flipV: random() > 0.8  
  };
  tiles.push(initialTile);
  usedPositions.push(initialTile.pos);
  
  tintcolor = color(300 - red(baseColor), 300 - green(baseColor), 300 - blue(baseColor));
  
  if (random() < 0.1) { 
    shouldInvertColors = true;
  } else {
    shouldInvertColors = false;
  }
  
  placeNextTile();
}

function playRandomSound() {
  let randomIndex = int(random(sounds.length));
  let randomSound = sounds[randomIndex];
  let randomRate = random(0.5, 2.0); 
  randomSound.rate(randomRate);
  randomSound.play();
  reverb.process(randomSound, 1, 3);
}

function placeNextTile() {
  if (currentTileIndex < numTiles - 1) {
    currentTileIndex++;
    let delay = shouldInvertColors ? tilePlacementDelayInverted : tilePlacementDelayNormal;
    setTimeout(() => {
      let tileKey = random(tileKeys);
      let tilePos = spritesheetData.tiles[tileKey];
      
      let pos = findRandomAdjacentPosition(usedPositions);
      
      tiles.push({
        pos: pos,
        key: tileKey,
        coords: tilePos,
        flipH: random() > 0.8,
        flipV: random() > 0.8 
      });
      
      usedPositions.push(pos);
      placeNextTile();
    }, delay);
  } else {
    playRandomSound(); 
    figureName = generateFigureNameFromTiles(); 
    figures++;
  }
}

function findRandomAdjacentPosition(usedPositions) {
  let validPositions = [];
  
  while (validPositions.length === 0) {
    let basePos = random(usedPositions);
    let adjacentPositions = [
      createVector(basePos.x + globalVars.TILE_WIDTH, basePos.y),
      createVector(basePos.x - globalVars.TILE_WIDTH, basePos.y),
      createVector(basePos.x, basePos.y + globalVars.TILE_HEIGHT),
      createVector(basePos.x, basePos.y - globalVars.TILE_HEIGHT)
    ];

    validPositions = adjacentPositions.filter(pos => 
      pos.x >= 0 && pos.x < CANVAS_COLS * globalVars.TILE_WIDTH && 
      pos.y >= 0 && pos.y < CANVAS_ROWS * globalVars.TILE_HEIGHT && 
      !usedPositions.some(p => p.equals(pos))
    );
  }
  
  return random(validPositions);
}

function drawTile(tile) {
  let sx = tile.coords[0] * globalVars.TILE_WIDTH;
  let sy = tile.coords[1] * globalVars.TILE_HEIGHT;
  let dx = tile.pos.x;
  let dy = tile.pos.y;
  push();
  translate(dx + globalVars.TILE_HALF_WIDTH, dy + globalVars.TILE_HALF_HEIGHT);
  if (tile.flipH) scale(-1, 1);
  if (tile.flipV) scale(1, -1);
  tint(tintcolor); // Apply tint before drawing the tile
  image(spritesheet, -globalVars.TILE_HALF_WIDTH, -globalVars.TILE_HALF_HEIGHT, globalVars.TILE_WIDTH, globalVars.TILE_HEIGHT, sx, sy, globalVars.TILE_WIDTH, globalVars.TILE_HEIGHT);
  pop();
}

function randomizeBackgroundColor() {
  baseColor = color(random(100, 255), random(100, 255), random(100, 255));
}

function mouseMoved() {
  let mouseXIndex = Math.floor(mouseX / globalVars.TILE_WIDTH);
  let mouseYIndex = Math.floor(mouseY / globalVars.TILE_HEIGHT);
  hoveredTile = null;
  
  for (let tile of tiles) {
    let tileXIndex = Math.floor(tile.pos.x / globalVars.TILE_WIDTH);
    let tileYIndex = Math.floor(tile.pos.y / globalVars.TILE_HEIGHT);
    if (mouseXIndex === tileXIndex && mouseYIndex === tileYIndex) {
      hoveredTile = tile;
      console.log(`Hovered over tile: ${tile.key}`); // Debugging
      break;
    }
  }
}

function drawName(name, isInverted) {
  displayText(name, height - 3 * globalVars.TILE_HEIGHT, isInverted);
}

function displayFigureName(name) {
  displayText(name, 0, false);
}

function displayText(name, startY, isInverted) {
  let displayText = name.replace(/_/g, " ");
  let displayWords = displayText.split(' ');
  let lineHeight = globalVars.TILE_HEIGHT;
  let maxCols = CANVAS_COLS;
  let currentLine = '';
  let lines = [];

  for (let word of displayWords) {
    if (currentLine.length + word.length + 1 > maxCols) { // +1 for space
      lines.push(currentLine.trim());
      currentLine = word + ' ';
    } else {
      currentLine += word + ' ';
    }
  }
  lines.push(currentLine.trim());

  if (isInverted) {
    let invertedText = "INVERTED";
    let invertedStartX = Math.floor((width - invertedText.length * globalVars.TILE_WIDTH) / 2);
    let invertedStartY = startY;

    for (let i = 0; i < invertedText.length; i++) {
      let tileChar = invertedText[i];
      let tilePos = spritesheetData.tiles[`LATIN_CAPITAL_LETTER_${tileChar}`];
      if (tilePos) {
        let sx = tilePos[0] * globalVars.TILE_WIDTH;
        let sy = tilePos[1] * globalVars.TILE_HEIGHT;
        image(spritesheet, invertedStartX + i * globalVars.TILE_WIDTH, invertedStartY, globalVars.TILE_WIDTH, globalVars.TILE_HEIGHT, sx, sy, globalVars.TILE_WIDTH, globalVars.TILE_HEIGHT);
      }
    }
    startY += lineHeight;
  }

  for (let line of lines) {
    let startX = Math.floor((width - line.length * globalVars.TILE_WIDTH) / 2);
    for (let i = 0; i < line.length; i++) {
      displayTile(line[i], startX + i * globalVars.TILE_WIDTH, startY);
    }
    startY += lineHeight;
  }
}

function displayTile(char, col, row) {
  let tilePos;
  switch (char) {
    case 'š': tilePos = "LATIN_SMALL_LETTER_S_WITH_CARON"; break;
    case 'Š': tilePos = "LATIN_CAPITAL_LETTER_S_WITH_CARON"; break;
    case '!': tilePos = "EXCLAMATION_MARK"; break;
    case '@': tilePos = "COMMERCIAL_AT"; break;
    case '#': tilePos = "NUMBER_SIGN"; break;
    case '$': tilePos = "DOLLAR_SIGN"; break;
    case '%': tilePos = "PERCENT_SIGN"; break;
    case '^': tilePos = "CIRCUMFLEX_ACCENT"; break;
    case '&': tilePos = "AMPERSAND"; break;
    case '*': tilePos = "ASTERISK"; break;
    case ' ': tilePos = "BLANK"; break;
    case '(': tilePos = "LEFT_PARENTHESIS"; break;
    case ')': tilePos = "RIGHT_PARENTHESIS"; break;
    case '-': tilePos = "HYPHEN_MINUS"; break;
    case '_': tilePos = "LOW_LINE"; break;
    case '+': tilePos = "PLUS_SIGN"; break;
    case '=': tilePos = "EQUALS_SIGN"; break;
    case '.': tilePos = "FULL_STOP"; break;
    case ',': tilePos = "COMMA"; break;
    case ':': tilePos = "COLON"; break;
    case ';': tilePos = "SEMICOLON"; break;
    case '\'': tilePos = "APOSTROPHE"; break;
    case '"': tilePos = "QUOTATION_MARK"; break;
    case '<': tilePos = "LESS_THAN_SIGN"; break;
    case '>': tilePos = "GREATER_THAN_SIGN"; break;
    case '?': tilePos = "QUESTION_MARK"; break;
    case '/': tilePos = "SOLIDUS"; break;
    case '\\': tilePos = "REVERSE_SOLIDUS"; break;
    case '|': tilePos = "VERTICAL_LINE"; break;
    case '[': tilePos = "LEFT_SQUARE_BRACKET"; break;
    case ']': tilePos = "RIGHT_SQUARE_BRACKET"; break;
    default:
      if (char.match(/\d/)) {
        tilePos = `DIGIT_${char}`;
      } else if (char.match(/[a-zA-Z]/)) {
        tilePos = `LATIN_CAPITAL_LETTER_${char.toUpperCase()}`;
      } else {
        tilePos = "BLANK"; 
      }
  }

  if (tilePos && spritesheetData.tiles[tilePos]) {
    let sx = spritesheetData.tiles[tilePos][0] * globalVars.TILE_WIDTH;
    let sy = spritesheetData.tiles[tilePos][1] * globalVars.TILE_HEIGHT;
    image(spritesheet, col, row, globalVars.TILE_WIDTH, globalVars.TILE_HEIGHT, sx, sy, globalVars.TILE_WIDTH, globalVars.TILE_HEIGHT);
  } else {
    console.error(`No tile mapping found for character: ${char}`);
  }
}

function keyPressed() {
    if (event.key === '}') { 
        window.api.navigate('patterns2.html');
    } else if (event.key === '{') {
    window.api.navigate('hallways.html');
    } else if (event.key === 'Escape') {
        if (window.api) {
            window.api.quitApp();
        }
    } else {
    initializeSketch();
    }
}

function mousePressed() {
  initializeSketch();
}

function touchStarted() {
  initializeSketch();
}

function generateFigureNameFromTiles() {
  // Create a unique key based on the tiles' positions, keys, and flips
  let key = tiles.map(tile => `${tile.pos.x},${tile.pos.y},${tile.key},${tile.flipH},${tile.flipV}`).join(';');
  
  // Use the key to seed a deterministic random generator
  Math.seedrandom(key);
  
  // Generate the figure name using the seeded generator
  return generateFigureName();
}

// Simple hash function to convert a string to a seed
function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    let char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Convert to 32bit integer
  }
  return hash.toString();
}
