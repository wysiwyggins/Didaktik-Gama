let socket;
let spritesheet;
let tiles = [];
const tileWidth = 40; 
const tileHeight = 30; 
const columns = 23;
const rows = 11;
let gridWidth = 50;
let gridHeight = 45;
let abysses = 0;


const BOX_TILES = [215, 195, 178, 215, 28, 214, 196, 192, 179, 194, 193, 250];

let tiledData;

function preload() {
  // Load the spritesheet
  spritesheet = loadImage("assets/spritesheets/libuse40x30-cp437.png");
  //noLoop();
  // Load the Tiled data
  loadJSON("data/ruins.json", function (data) {
    tiledData = data;
  });
}

function isBoxTile(index) {
  return BOX_TILES.includes(index);
}

/* function windowResized() {
  // Adjust grid size based on new window dimensions
  gridWidth = floor(windowWidth / tileWidth) * 2;
  gridHeight = floor(windowHeight / tileHeight) * 2;
  // Resize the canvas
  resizeCanvas(gridWidth * tileWidth, gridHeight * tileHeight);

  // Optionally call redraw if you're not using a draw loop
  redraw();
} */

function setup() {
    socket = io.connect(window.location.origin);
    gridWidth = floor(windowWidth / tileWidth) * 2;
    gridHeight = floor(windowHeight / tileHeight) * 2;
    createCanvas(gridWidth * tileWidth, gridHeight * tileHeight);
    pixelDensity(1); // Avoid automatic scaling with displayDensity
    
    // Scale down the canvas with CSS
    let cnv = select('canvas'); // If using p5.js's select() function, or use document.querySelector in plain JS
    cnv.style('width', '100vw');
    cnv.style('height', '100vh');
    cnv.style('overflow', 'hidden');


    // Slice the spritesheet into individual tiles
    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < columns; x++) {
            let tile = spritesheet.get(
            x * tileWidth,
            y * tileHeight,
            tileWidth,
            tileHeight
            );
            // Scale the tile to the new size
            tile.resize(tileWidth, tileHeight);
            tiles.push(tile);
        }
    }
    wave1 = new p5.Oscillator();
    wave1.setType('triangle');
    wave2 = new p5.Oscillator();
    wave2.setType('sine');
    reverb = new p5.Reverb();
    //noLoop();
}
function generateColorPalette(baseColor) {
  wave1.start();
  wave2.start(); 
  // Generate two additional colors based on the base color
  let color1 = color(
    (baseColor.levels[0] + 50) % 256,
    baseColor.levels[1],
    baseColor.levels[2]
  );
  wave1.freq(baseColor.levels[1]);
  wave2.freq(baseColor.levels[2]);
  let color2 = color(
    baseColor.levels[0],
    (baseColor.levels[1] + 50) % 256,
    baseColor.levels[2]
  );

  let colors = []
  colors.push(baseColor);
  colors.push(color1);
  colors.push(color2);

  darkestColor = colors[0];
  lightestColor = colors[2];

  // Ensure that colors[2] is the brightest color
  colors.forEach((col, i) => {
    if (brightness(col) < brightness(darkestColor)) {
      darkestColor = col;
    }
    if (brightness(col) > brightness(lightestColor)) {
      lightestColor = col;
      if (i !== 2) {
        // Swap colors if necessary
        colors[i] = colors[2];
        colors[2] = lightestColor;
      }
    }
    reverb.process(wave1, i, 2);
    reverb.process(wave2, 3, i);
  });
  
  socket.emit('setDMXColor', baseColor);
  return colors;
}
function placeTiledLayer(grid, tiledData) {
 
  if (tiledData && tiledData.layers) {
    const layers = tiledData.layers;
    const layer = random(layers); // Randomly select a layer

    let placed = false;
    while (!placed) {
      const offsetX = floor(random(gridWidth - layer.width));
      const offsetY = floor(random(gridHeight - layer.height));

      let canPlace = true;
      for (let i = 0; i < layer.width && canPlace; i++) {
        for (let j = 0; j < layer.height && canPlace; j++) {
          const gridTile = grid[offsetX + i][offsetY + j];
          const tiledIndex = layer.data[j * layer.width + i] - 1; // Offset the index here

          if (
            tiledIndex !== -1 &&
            (gridTile === 127 || gridTile === 177 || gridTile === 216)
          ) {
            canPlace = false;
          }
        }
      }

      if (canPlace) {
        for (let i = 0; i < layer.width; i++) {
          for (let j = 0; j < layer.height; j++) {
            const tiledIndex = layer.data[j * layer.width + i] - 1; // Offset the index here
            if (tiledIndex !== -1) {
              grid[offsetX + i][offsetY + j] = tiledIndex;
              wave2.freq(tiledIndex - i);
            }
          }
        }
        placed = true;
      }
    }
  } else {
    console.error("Tiled data or layers not loaded properly.");
  }
  
}

function drawTile(tile, x, y, flipHorizontally, flipVertically) {
  wave1.freq((x * 100) % 400);
  push();
  translate(x + tileWidth / 2, y + tileHeight / 2); // Move origin to the center of the tile
  
  if (flipHorizontally) {
    scale(-1, 1);
  }

  if (flipVertically) {
    scale(1, -1);
  }

  // Draw the image offset by half its width and height to correct the position
  image(tile, -tileWidth / 2, -tileHeight / 2, tileWidth, tileHeight);
  pop();
}

function draw() {
  if (abysses > 20) {
    if (socket.connected) {
      socket.emit('requestSketchChange', { nextSketch: 'keyboard' });
    } else {
      window.location.href = 'keyboard.html';
    }
  }
  background(255);
  noStroke();
  let baseColor = color(random(256), random(256), random(256));
  let colors = generateColorPalette(baseColor);

  let darkestColor = colors[0];
  let lightestColor = colors[2];

  let grid = []; // Create an empty grid

  // First loop to set the tile indices based on the rules
  for (let i = 0; i < gridWidth; i++) {

    grid[i] = [];
    for (let j = 0; j < gridHeight; j++) {
      let tileIndex = floor(random(tiles.length));
      grid[i][j] = tileIndex; // Store the tile index in the grid
      wave2.freq(i + tileIndex);
      if (tileIndex === 127) {
        if (i < gridWidth - 1 && grid[i + 1] !== undefined)
          grid[i + 1][j] = 177;
        if (j < gridHeight - 1 && grid[i][j + 1] !== undefined)
          grid[i][j + 1] = 216;
        if (
          i < gridWidth - 1 &&
          j < gridHeight - 1 &&
          grid[i + 1] !== undefined &&
          grid[i + 1][j + 1] !== undefined
        )
          grid[i + 1][j + 1] = 127;
      }
    }
    
    
  }
  for (let i = 0; i < gridWidth; i++) {
    for (let j = 0; j < gridHeight; j++) {
      if (grid[i][j] === 127) {
        let k = 0;
        
        // Create the diagonal stripe of tiles with index 127
        while (i + k < gridWidth && j + k < gridHeight) {
          grid[i + k][j + k] = 127;
          k++;
          wave2.freq(i + k);
        }

        // Fill the right side of the stripe with tiles of index 177
        for (let m = j + 1; m < gridHeight; m++) {
          grid[i][m] = 216;
          wave2.freq(i - m);
        }

        // Fill the left side of the stripe with tiles of index 216
        for (let n = i + 1; n < gridWidth; n++) {
          grid[n][j] = 177;
          wave2.freq(n - j);
        }
      }
    }
  }
  for (let i = 0; i < gridWidth; i++) {
    for (let j = 0; j < gridHeight; j++) {
      let tileIndex = grid[i][j];

      if (isBoxTile(tileIndex)) {
        let directions = [
          [0, 1],
          [1, 0],
          [0, -1],
          [-1, 0],
        ]; // Down, Right, Up, Left
        for (let [dx, dy] of directions) {
          let x = i + dx;
          let y = j + dy;
          if (x >= 0 && x < gridWidth && y >= 0 && y < gridHeight) {
            if (
              !isBoxTile(grid[x][y]) &&
              grid[x][y] !== 127 &&
              grid[x][y] !== 177 &&
              grid[x][y] !== 216
            ) {
              grid[x][y] = random(BOX_TILES); // Assign a random box-drawing tile
            }
          }
        }
      }
    }
  }
  // placeTiledLayer(grid, tiledData); // tiled stuff was responsible for the weirdness
  // Second loop to draw the tiles and the backgrounds
  wave1.start();
  wave2.start(); 
  for (let i = 0; i < gridWidth; i++) {
    for (let j = 0; j < gridHeight; j++) {
      let tileIndex = grid[i][j];

      if (tileIndex === 127 || tileIndex === 177 || tileIndex === 216) {
        fill(darkestColor); // Set the background to the darkest color for rule-based tiles
      } else if (tileIndex === 131) {
        fill(lightestColor);
      } else {
        let colorOffset = floor(i / 5); // Change the number 5 to adjust the width of the color blocks
        fill(colors[(j + colorOffset) % colors.length]);
      }

      rect(i * tileWidth, j * tileHeight, tileWidth, tileHeight);
      tint(lightestColor);

      let flipHorizontally = random() > 0.5;
      let flipVertically = random() > 0.5;

      if (tileIndex === 177 || tileIndex === 216) {
        drawTile(
          tiles[tileIndex],
          i * tileWidth,
          j * tileHeight,
          flipHorizontally,
          flipVertically
        );
      } else {
        image(tiles[tileIndex], i * tileWidth, j * tileHeight);
      }

      noTint();
    }
  }
  abysses++;
  
}

function unloadCurrentSketch() {
  const sketchContainer = document.getElementById('sketch-container');
  sketchContainer.innerHTML = '';  // Remove all child nodes
  socket.close();
  console.log('Socket closed');
}

function keyPressed(event) {
  if (event.key === '}') { 
    if (socket.connected) {
      socket.emit('requestSketchChange', { nextSketch: 'game' });
    } else { 
      window.location.href = 'dungeon.html';
    }
  } else if (event.key === '{') {
    if (socket.connected) {
      socket.emit('requestSketchChange', { nextSketch: 'home' });
    } else { 
      window.location.href = 'home.html';
    }
  }
}

// Add an event listener to the document to handle keydown events
document.addEventListener('keydown', keyPressed);
