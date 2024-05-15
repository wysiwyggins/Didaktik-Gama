let selectedTiles = [];
let reloads = 0;
let colorChangeFrameInterval = 120; // Number of frames between color changes
let socket;

function setup() {
  setTimeout(() => {
    try {
      socket = io.connect('http://localhost:3000');
    } catch (error) {
      console.error('Socket connection failed.', error);
    }
  }, 1000);
  createCanvas(globalVars.CANVAS_COLS * globalVars.TILE_HALF_WIDTH, globalVars.CANVAS_ROWS * globalVars.TILE_HALF_HEIGHT);
  frameRate(30); // Set frame rate

  extractTilesFromSpritesheet(); 
  selectPatternTiles(); 

  generateBaseAndComplementaryColors();
  wave1 = new p5.Oscillator();
  wave1.setType('triangle');
  wave2 = new p5.Oscillator();
  wave2.setType('sine');
  reverb = new p5.Reverb();
}

function preload() {
  spritesheet = loadImage('./assets/spritesheets/libuse40x30-cp437.png');
  spritesheetData = loadJSON('./assets/spritesheets/spriteData.json');
  backgroundImage = loadImage('./assets/images/boot.png');
  console.log('boot loaded');
}

function generateBaseAndComplementaryColors() {
  colors = []; // Clear the previous colors
  baseColor = color(random(255), random(255), random(255));
  colors.push(baseColor);
  for (let i = 1; i <= 3; i++) {
    colors.push(complementColor(baseColor, i * 90)); // Generate and push complementary colors
  }
}

function draw() {
  let cyclePhase = frameCount % colorChangeFrameInterval;
  background(colors[0]);

  if (cyclePhase === 0) {
    generateBaseAndComplementaryColors();
    wave1.start();
    wave2.start();
  }

  if (cyclePhase < 5) {
    drawColorPattern();  // Show animated rows briefly at the beginning of each cycle
    wave1.freq(random(50, 100));
    wave2.freq(random(10, 100));
  } else {
    background(colors[0]);  // Fill screen with a single color for the rest of the cycle
  }

  image(backgroundImage, 0, 0, width, height);  // Display background image

  reloads++;
  if (reloads > 1000) {
    window.location.href = 'geomancy.html';
  }
}

function drawColorPattern() {
  let chance = floor(random(1, 5));
  let offset = floor(frameCount / colorChangeFrameInterval + chance) % 2; // Alternate color starting index
  for (let y = 0; y < globalVars.CANVAS_ROWS; y++) {
    let colorIndex = (y + offset) % 2; // Change starting index every interval
    for (let x = 0; x < globalVars.CANVAS_COLS; x++) {
      fill(colors[colorIndex % colors.length]);
      noStroke();
      rect(x * globalVars.TILE_HALF_WIDTH, y * globalVars.TILE_HALF_HEIGHT, globalVars.TILE_HALF_WIDTH, globalVars.TILE_HALF_HEIGHT);
    }
  }
}

function complementColor(c, angle) {
  // Convert RGB to HSB, adjust hue, then convert back to RGB
  let h = hue(c) + angle;
  let s = saturation(c);
  let b = brightness(c);
  // Ensure hue wraps around the color wheel
  h = h % 360;
  return color(h, s, b);
}

function selectPatternTiles() {
  let harmonyType = floor(random(3)); // Introduce a third type of harmony
  let selectedTileIndices = [0]; // Include blank tile

  switch (harmonyType) {
    case 0: // Adjacent tiles
      let startIndex = floor(random(tiles.length - 3));
      selectedTileIndices.push(startIndex, startIndex + 1, startIndex + 2);
      break;
    case 1: // Distance-based selection
      let step = floor(random(2, 6)); // Vary the step for more variety
      for (let i = step; i < tiles.length; i += step) {
        selectedTileIndices.push(i);
        if (selectedTileIndices.length == 5) break;
      }
      break;
    case 2: // Random selection from different rows
      while (selectedTileIndices.length < 5) {
        let randomIndex = floor(random(tiles.length));
        if (!selectedTileIndices.includes(randomIndex)) {
          selectedTileIndices.push(randomIndex);
        }
      }
      break;
  }

  // Ensure four unique tiles are selected
  selectedTiles = selectedTileIndices.map(index => tiles[index]);
}

function extractTilesFromSpritesheet() {
  for (let y = 0; y < spritesheetData.spritesheetRows; y++) {
    for (let x = 0; x < spritesheetData.spritesheetCols; x++) {
      // Extract each tile at its full original size
      let tile = spritesheet.get(x * spritesheetData.tilePixelWidth, y * spritesheetData.tilePixelHeight, spritesheetData.tilePixelWidth, spritesheetData.tilePixelHeight);
      // Do not resize here, keep the original resolution
      tiles.push(tile);
    }
  }
}

function drawSpritePattern() {
  console.log(`Drawing sprite pattern with ${selectedTiles.length} tiles.`);

  for (let y = 0; y < globalVars.CANVAS_ROWS; y++) {
    for (let x = 0; x < globalVars.CANVAS_COLS; x++) {
      let tile = random(selectedTiles);
      if (!tile) {
        console.error("Selected tile is undefined.");
        continue;
      }
      tint(colors[1], 127); // Apply a semi-transparent tint
      // Specify the display size to half the original size for sharp rendering
      image(tile, x * globalVars.TILE_HALF_WIDTH, y * globalVars.TILE_HALF_HEIGHT, spritesheetData.tileDisplayWidth, spritesheetData.tileDisplayHeight);
      noTint();
    }
  }
}

function keyPressed(event) {
  if (event.key === '}') {
    window.location.href = 'geomancy.html';
  } else if (event.key === '{') {
    window.location.href = 'boot.html';
  }
}

// Add an event listener to the document to handle keydown events
document.addEventListener('keydown', keyPressed);
