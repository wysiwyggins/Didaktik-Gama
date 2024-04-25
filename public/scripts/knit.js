let socket;
let spritesheet; // Holds the spritesheet image
let tiles = []; // Stores individual tiles cut from the spritesheet
const TILE_WIDTH = 20;
const TILE_HEIGHT = 15;
const CANVAS_COLS = 60; // Number of cells horizontally
const CANVAS_ROWS = 50; // Number of cells vertically
let baseColor; // Holds the randomly generated base color
let colors = []; // Array to hold the base color and its complements
let selectedTiles = [];
let wave1;
let wave2;
let reloads = 0;


function preload() {

  spritesheet = loadImage('assets/spritesheets/libuse40x30-cp437.png');
  spritesheetData = loadJSON('assets/spritesheets/spriteData.json');
  
}

function setup() {
  createCanvas(900, 600);
  //noLoop(); // Since we're not animating, no need to loop

  // Assuming spritesheetData correctly holds the metadata after preload
  extractTilesFromSpritesheet(); // Make sure this is called after spritesheet is loaded
  selectBoxDrawingTiles();
  selectPatternTiles(); // Select pattern tiles after all tiles have been extracted

  // Generate base and complementary colors
  generateBaseAndComplementaryColors();
  wave1 = new p5.Oscillator();
  wave1.setType('triangle');
  wave2 = new p5.Oscillator();
  wave2.setType('sine');
  reverb = new p5.Reverb();
}

function generateBaseAndComplementaryColors() {
  baseColor = color(random(255), random(255), random(255));
  colors.push(baseColor);
  for (let i = 1; i <= 3; i++) {
    colors.push(complementColor(baseColor, i * 90)); // Generate and push complementary colors
    
  }
}

function draw() {
  if (reloads > 40) {
    
    if (socket.connected) {
      socket.emit('requestSketchChange', { nextSketch: 'game' });
    } else {
      window.location.href = 'dungeon.html';
    }
    
  }

  drawColorPattern();
  
  wave1.start();
  wave2.start();
  let chance = floor(random(1, 5)); // Generates a number between 1 and 4
  if (chance === 1) {
    console.log("Drawing serpentine pattern");
    drawSerpentinePattern(); // Call your serpentine pattern function here
  } else {
    console.log("Drawing regular sprite pattern");
    drawSpritePattern(); // This is the existing function that draws regular patterns
  }
  wave1.freq(baseColor.levels[1] - 80 / chance);
  wave2.freq(baseColor.levels[2] -100 /chance);
  reverb.process(wave1, chance, 2);
  reverb.process(wave2, 3, chance);
  reloads++;
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

function drawColorPattern() {
    // Use the predefined tileWidth and tileHeight for drawing
    // No need to calculate tileWidth and tileHeight based on canvas size
    let chance = floor(random(1, 5));
    for (let y = 0; y < CANVAS_ROWS; y++) {
        for (let x = 0; x < CANVAS_COLS; x++) {
        // Alternate color pairs every row, not every two rows
        
        let colorPair = y % 2; // This will alternate 0, 1, 0, 1, ..., for each row
        // Alternate colors within the row
        
        let colorIndex = (x % 2) + (colorPair * 2); // This alternates colors within a row and switches pairs every row
        if (chance === 1) {
          y - 1 % 2 === 0 ? fill(colors[0]) : fill(colors[1]);
          colorIndex = (x % 2) + (colorPair * 3); // This alternates colors within a row and switches pairs every row
        } else if (chance === 2) {
          colorIndex = (x % 2) + (colorPair * 2); // This alternates colors within a row and switches pairs every row
        }
        fill(colors[colorIndex % colors.length]); // Use mod to cycle through colors array safely
        noStroke();
        

        rect(x * TILE_WIDTH, y * TILE_HEIGHT, TILE_WIDTH, TILE_HEIGHT);
        }
    }
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




