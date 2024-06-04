let hallwayFrames = []; // Initialize the frames array
let tmjData;
let tmjFile = './assets/maps/hallways.tmj';
let loopCounter = 0; 
let currentHallwayFrame = 0;
let stepSound;
let magicSound;
let startTime;
let secondaryColor;
let reverb;
let socket; // Declare socket variable
let fileText;
let lineIndex = 0; // Track current line index
let wordIndex = 0; // Track current word index within the line
let displayingWord = false;
let tilesDisplayed = 0; // Initialize tilesDisplayed
let textTiles = []; // Store text tiles to be drawn

reverb = new p5.Reverb();

function getTileIndexFromChar(char) {
  let tileName;
  if (char === ' ') {
    setCurrentTile(getTileIndex("BLANK"));
    return false;
  }
  else if (char >= '0' && char <= '9') {
    tileName = 'DIGIT_' + char;
  } else if (char >= 'A' && char <= 'Z') {
    tileName = 'LATIN_CAPITAL_LETTER_' + char;
  } else if (char >= 'a' && char <= 'z') {
    let uppercaseChar = char.toUpperCase();
    tileName = 'LATIN_SMALL_LETTER_' + uppercaseChar;
  } else if (char === '.') {
    tileName = 'PERIOD';
  } else if (char === ',') {
    tileName = 'COMMA';
  } else if (char === '!') {
    tileName = 'EXCLAMATION_MARK';
  } else if (char === '?') {
    tileName = 'QUESTION_MARK';
  } else if (char === "'") {
    tileName = 'APOSTROPHE';
  }
  if (tileName && spritesheetData.tiles[tileName]) {
    return getTileIndex(tileName);
  }
  return null;
}

function getTileCoords(tileName) {
  let coords = spritesheetData.tiles[tileName];
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

function setCurrentTile(tileIndex, isTextTile = false) {
  if (cursorY >= 0 && cursorY < globalVars.CANVAS_ROWS && cursorX >= 0 && cursorX < globalVars.CANVAS_COLS) {
    if (!tileMap[cursorY]) {
      tileMap[cursorY] = []; // Initialize the row if it doesn't exist
    }
    tileMap[cursorY][cursorX] = { tile: tileIndex, bgColor: null };
    if (isTextTile) {
      textTiles.push({ x: cursorX, y: cursorY, tileIndex });
    }
    console.log(`Set tile at (${cursorX}, ${cursorY}) to index ${tileIndex}`);
    advanceCursor();
    tilesDisplayed++;
    if (tilesDisplayed >= globalVars.MAX_TILES - 100) {
      window.api.navigate('automata.html');
    }
  } else {
    console.log("Cursor position out of bounds:", cursorX, cursorY);
  }
}

function advanceCursor() {
  cursorX++;
  if (cursorX >= globalVars.CANVAS_COLS) {
    cursorX = 0;
    cursorY++;
    if (cursorY >= globalVars.CANVAS_ROWS) {
      cursorY = 0;
    }
  }
}

function preload() {
  spriteSheet = loadImage(globalVars.SPRITESHEET_PATH);
  spritesheetData = loadJSON(globalVars.SPRITE_DATA_PATH);
  tmjData = loadJSON(tmjFile);
  stepSound = loadSound('./assets/sound/20.wav');
  magicSound = loadSound('./assets/sound/19.wav');
  let fileIndex = floor(random(1, 25));
  backgroundImage = loadImage(`./assets/images/${fileIndex}.png`);
  fileText = loadStrings(`./data/texts/${fileIndex}.txt`);
}

function setup() {
  baseColor = color(random(100, 256), random(100, 256), random(100, 256));
  
  let r = red(baseColor);
  let g = green(baseColor);
  let b = blue(baseColor);

  createCanvas(globalVars.CANVAS_COLS * globalVars.TILE_WIDTH / 2, globalVars.CANVAS_ROWS * globalVars.TILE_HEIGHT / 2);
  parseTMJ(tmjData);
  reverb.process(stepSound, 1, 2);

  // Initialize tileMap with the correct dimensions
  for (let y = 0; y < globalVars.CANVAS_ROWS; y++) {
    tileMap[y] = [];
    for (let x = 0; x < globalVars.CANVAS_COLS; x++) {
      tileMap[y][x] = { tile: null, bgColor: null };
    }
  }

  setTimeout(() => {
    draw(); // Call the draw function after the delay
  }, 600);

  setTimeout(() => {
    try {
      socket = io.connect('http://localhost:3000');
      socket.on('connect', () => {
        socket.emit('baseColorChanged', { red: r, green: g, blue: b });
      });
    } catch (error) {
      console.error('Socket connection failed.', error);
    }
  }, 2000);
}

function parseTMJ(tmj) {
  frames = [];
  tmj.layers.forEach((layer, index) => {
    let frame = [];
    for (let i = 0; i < layer.data.length; i++) {
      let col = i % layer.width;
      let row = Math.floor(i / layer.width);
      if (!frame[row]) {
        frame[row] = [];
      }
      frame[row][col] = layer.data[i];
    }
    frames.push(frame);
  });
}

function draw() {
  background(baseColor);
  drawFrame(frames[currentHallwayFrame] || []);
  
  if (frameCount % 12 === 0) {
    currentHallwayFrame = (currentHallwayFrame + 1) % frames.length;
    stepSound.play();
    if (currentHallwayFrame % 5 === 0 && !displayingWord) {
      console.log('Displaying word at frame', currentHallwayFrame);
      displayWord();
      displayingWord = true;
    } else if (currentHallwayFrame % 5 !== 0) {
      displayingWord = false;
    }
  }
  if (currentHallwayFrame %20 === 0){
    magicSound.play();
    baseColor = color(random(100, 256), random(100, 256), random(100, 256));
  }
  
  if (frameCount > 8000) {
    window.api.navigate('automata.html');
  }

  // Draw text tiles on top of everything else
  drawTextTiles();
}

function drawTextTiles() {
  for (const tile of textTiles) {
    let sx = (tile.tileIndex % globalVars.SPRITESHEET_COLS) * globalVars.TILE_WIDTH;
    let sy = Math.floor(tile.tileIndex / globalVars.SPRITESHEET_COLS) * globalVars.TILE_HEIGHT;
    let x = tile.x * globalVars.TILE_WIDTH / 2 + globalVars.TILE_WIDTH / 4;
    let y = tile.y * globalVars.TILE_HEIGHT / 2 + globalVars.TILE_HEIGHT / 4;
    image(spriteSheet, x, y, globalVars.TILE_WIDTH / 2, globalVars.TILE_HEIGHT / 2, sx, sy, globalVars.TILE_WIDTH, globalVars.TILE_HEIGHT);
  }
}

function displayWord() {
  if (fileText.length > 0) {
    let line = fileText[lineIndex];
    let words = line.split(' ');
    if (wordIndex >= words.length) {
      wordIndex = 0;
      lineIndex = (lineIndex + 1) % fileText.length;
      line = fileText[lineIndex];
      words = line.split(' ');
    }
    let word = words[wordIndex];
    displayCenteredWord(word);
    wordIndex++;
  } else {
    console.log('No file text found.');
  }
}

function displayCenteredWord(word) {
  let wordLength = word.length;
  let startX = Math.max(0, floor((globalVars.CANVAS_COLS - wordLength) / 2));

  cursorX = startX;
  cursorY = floor(globalVars.CANVAS_ROWS / 2);

  textTiles = []; // Clear previous text tiles

  for (let i = 0; i < word.length; i++) {
    let char = word[i];
    let tileIndex = getTileIndexFromChar(char);
    if (tileIndex !== null) {
      console.log(`Displaying character: ${char} at index ${tileIndex}`);
      setCurrentTile(tileIndex, true);
    } else {
      console.log(`No tile index found for character: ${char}`);
      advanceCursor(); // Skip to the next position if no tile index is found
    }
  }
}

function drawFrame(frame) {
  if (!frame) {
    frame = frames[1];
  }
  
  for (let y = 0; y < frame.length; y++) {
    for (let x = 0; x < frame[y].length; x++) {
      let tileCode = frame[y][x];
      let flippedH = (tileCode & 0x80000000) > 0;
      let flippedV = (tileCode & 0x40000000) > 0;
      let tileIndex = (tileCode & 0x1FFFFFFF) - 1;

      let sx = (tileIndex % globalVars.SPRITESHEET_COLS) * globalVars.TILE_WIDTH;
      let sy = Math.floor(tileIndex / globalVars.SPRITESHEET_COLS) * globalVars.TILE_HEIGHT;

      push();
      translate(x * globalVars.TILE_WIDTH / 2 + globalVars.TILE_WIDTH / 4, y * globalVars.TILE_HEIGHT / 2 + globalVars.TILE_HEIGHT / 4);
      if (flippedH && flippedV) {
        rotate(PI);
      } else {
        if (flippedH) {
          scale(-1, 1);
        }
        if (flippedV) {
          scale(1, -1);
        }
      }
      image(spriteSheet, -globalVars.TILE_WIDTH / 4, -globalVars.TILE_HEIGHT / 4, globalVars.TILE_WIDTH / 2, globalVars.TILE_HEIGHT / 2, sx, sy, globalVars.TILE_WIDTH, globalVars.TILE_HEIGHT);
      pop();
    }
  }
}

function keyPressed(event) {
  if (event.key === '}') { 
    window.location.href = 'automata.html';
  } else if (event.key === '{') {
    window.location.href = 'patterns.html';
  } else if (event.key === 'Escape') {
    if (window.api) {
      window.api.quitApp();
    }
  }
}

document.addEventListener('keydown', keyPressed);
