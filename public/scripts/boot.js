let spritesheet; // Holds the spritesheet image
let tiles = []; // Stores individual tiles cut from the spritesheet
const TILE_WIDTH = 20;
const TILE_HEIGHT = 15;
const CANVAS_COLS = 65; // Number of cells horizontally
const CANVAS_ROWS = 60; // Number of cells vertically
let baseColor; // Holds the randomly generated base color
let colors = []; // Array to hold the base color and its complements
let selectedTiles = [];
let wave1;
let wave2;
let reloads = 0;
let colorChangeFrameInterval = 120; // Number of frames between color changes

function setup() {
  socket = io.connect(window.location.origin);
  createCanvas(CANVAS_COLS * TILE_WIDTH, CANVAS_ROWS * TILE_HEIGHT);
  frameRate(30); // Set frame rate

  extractTilesFromSpritesheet(); 
  selectBoxDrawingTiles();
  selectPatternTiles(); 

  generateBaseAndComplementaryColors();
  wave1 = new p5.Oscillator();
  wave1.setType('triangle');
  wave2 = new p5.Oscillator();
  wave2.setType('sine');
  reverb = new p5.Reverb();
}

function preload() {

  spritesheet = loadImage('assets/spritesheets/libuse40x30-cp437.png');
  spritesheetData = loadJSON('assets/spritesheets/spriteData.json');
  backgroundImage = loadImage('assets/images/boot.png');
  
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
  
  let chance = floor(random(1, 5));
  
  
  reloads++;
  if (reloads > 1000) {
    if (socket.connected) {
      socket.emit('requestSketchChange', { nextSketch: 'abyss' });
    } else {
      window.location.href = 'abyss.html';
    }
  }
}


function drawColorPattern() {
    let chance = floor(random(1, 5));
    let offset = floor(frameCount / colorChangeFrameInterval + chance)  % 2; // Alternate color starting index
    for (let y = 0; y < CANVAS_ROWS; y++) {
        let colorIndex = (y + offset) % 2; // Change starting index every interval
        for (let x = 0; x < CANVAS_COLS; x++) { // Loop for columns added here
            fill(colors[colorIndex % colors.length]);
            noStroke();
            rect(x * TILE_WIDTH, y * TILE_HEIGHT, TILE_WIDTH, TILE_HEIGHT);
            
            
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


let boxDrawingTiles = {};

function selectBoxDrawingTiles() {
    // Extract the box-drawing tiles based on the provided indices
    const boxDrawingKeys = ["BOX_VERTICAL", "BOX_LEFT_VERTICAL", "BOX_UP_HORIZONTAL", "BOX_DOWN_HORIZONTAL", "BOX_RIGHT_VERTICAL", "BOX_HORIZONTAL", "BOX_VERTICAL_HORIZONTAL", "BOX_BOTTOM_RIGHT", "FULL_BLOCK", "BOX_TOP_LEFT", "BOX_DRAWING_HEAVY_LEFT_LIGHT_RIGHT"];
    boxDrawingKeys.forEach(key => {
        const [col, row] = spritesheetData.tiles[key];
        let tile = spritesheet.get(col * spritesheetData.tilePixelWidth, row * spritesheetData.tilePixelHeight, spritesheetData.tilePixelWidth, spritesheetData.tilePixelHeight);
        // Store the tile with its key for easy access
        boxDrawingTiles[key] = tile;
    });
}

function drawSerpentinePattern() {
  let direction = 'right'; // Initial direction
  let nextDirection = 'down'; // Next direction, initialized for logic purposes
  let nextChange = 10; // Change direction after a set number of tiles
  let counter = 0;

  for (let y = 0; y < CANVAS_ROWS; y++) {
    if (y != 51 && y != 52 && y != 53 ){
        for (let x = 0; x < CANVAS_COLS; x++) {
            let tile;
      
            // Before changing direction, select the appropriate corner or cross tile
            if (counter === nextChange - 1) { // If it's the last tile before changing direction
              // Conditions for corner tiles before a direction change
              if (direction === 'right' && nextDirection === 'down') {
                tile = boxDrawingTiles.BOX_BOTTOM_RIGHT;
              } else if (direction === 'down' && nextDirection === 'right') {
                tile = boxDrawingTiles.BOX_TOP_LEFT;
              }
              // Add more conditions as needed for other direction changes
            } else {
              // Introduce a small random chance of using the cross tile
              if (random() < 0.05) { // 10% chance
                tile = boxDrawingTiles.BOX_VERTICAL_HORIZONTAL;
              } else {
                // Standard direction tiles
                switch (direction) {
                  case 'right':
                    tile = boxDrawingTiles.BOX_HORIZONTAL;
                    break;
                  case 'down':
                    tile = boxDrawingTiles.BOX_VERTICAL;
                    break;
                  case 'up':
                    tile = boxDrawingTiles.BOX_UP_HORIZONTAL;
                    break;
                }
              }
            }
      
            // Draw the tile
            if (tile) {
              image(tile, x * TILE_WIDTH, y * TILE_HEIGHT, TILE_WIDTH, TILE_HEIGHT);

            }
      
            // Update direction and counter based on the serpentine logic
            counter++;
            if (counter >= nextChange) {
              counter = 0;
              if (direction === 'right') {
                direction = 'down';
                nextDirection = 'right';
              } else if (direction === 'down') {
                direction = 'right';
                nextDirection = 'down';
              }
              nextChange = floor(random(5, 15)); // Randomize for variety
            }
          }
    }
    
  }
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
  
  for (let y = 0; y < CANVAS_ROWS; y++) {
    for (let x = 0; x < CANVAS_COLS; x++) {
      let tile = random(selectedTiles);
      if (!tile) {
        console.error("Selected tile is undefined.");
        continue;
      }
      tint(colors[1], 127); // Apply a semi-transparent tint
      // Specify the display size to half the original size for sharp rendering
      image(tile, x * TILE_WIDTH, y * TILE_HEIGHT, spritesheetData.tileDisplayWidth, spritesheetData.tileDisplayHeight);
      noTint();
    }
  }
}

function unloadCurrentSketch() {
  if (currentSketch && currentSketch.cleanup) {
      currentSketch.cleanup();  // Call a cleanup method on the current sketch
  }
  // Clear the content container
  const sketchContainer = document.getElementById('sketch-container');
  sketchContainer.innerHTML = '';
}




