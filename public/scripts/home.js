let colorFrames = [];
let homeFrames = []; // Initialize the frames array
let tmjData;
let tmjFile = './assets/maps/flipbooks.tmj';
let loopCounter = 0; 
let currentHomeFrame = 0;

let osc;
let melody = [53, 55, 57, 58, 62, 60, 57, 60, 58, 57, 58, 55, 57, 53, 55, 57, 58, 62,60, 57, 60, 58, 57, 58, 55, 53]; // MIDI notes for "Home! Sweet Home!"
let durations = [0.2, 0.2, 0.8, 0.5, 0.4, 0.8, 0.4, 0.5, 0.8, 0.2, 0.5, 0.5, 1.3, 0.2, 0.2, 0.8, 0.5, 0.4, 0.8, 0.4, 0.5, 0.8, 0.2, 0.5, 0.5, 1.5]; // Durations in seconds for each note
durations[durations.length - 1] = 0.8; // Last note held longer
let noteIndex = 0;
let noteDuration = 0;
let startTime;
reverb = new p5.Reverb();

function preload() {
  spriteSheet = loadImage(globalVars.SPRITESHEET_PATH);
  spritesheetData = loadJSON(globalVars.SPRITE_DATA_PATH);
  tmjData = loadJSON(tmjFile);
}

function setup() {
  setTimeout(() => {
    try {
      socket = io.connect('http://localhost:3000');
    } catch (error) {
      console.error('Socket connection failed.', error);
    }
  }, 2000);
  createCanvas(globalVars.CANVAS_COLS * globalVars.TILE_WIDTH / 2, globalVars.CANVAS_ROWS * globalVars.TILE_HEIGHT / 2);
  parseTMJ(tmjData);
  generateColors();
  osc = new p5.Oscillator('triangle');
  playNote();
  reverb.process(osc, loopCounter, loopCounter + 1);

  // Delay the execution of draw function by 600 milliseconds (adjust the delay time as needed)
  setTimeout(() => {
    draw(); // Call the draw function after the delay
  }, 600);
}

function playNote() {
  if (noteIndex >= melody.length) {
    noteIndex = 0; // Reset to start of melody for looping
  }
  let midiValue = melody[noteIndex + loopCounter];
  let freq = midiToFreq(midiValue - loopCounter * 12);
  osc.freq(freq);
  osc.start();
  startTime = millis();
  noteDuration = durations[noteIndex] * 1000; // Convert to milliseconds
  noteIndex++;
}

function parseTMJ(tmj) {
  frames = []; // Clear existing frames before parsing new ones
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
    if (layer.name === "color") {
      colorFrames.push(frame);
    } else {
      frames.push(frame);
    }
  });
}

function generateColors() {
  let baseHue = floor(random(360));
  colors.push(color(`hsl(${baseHue}, 100%, 75%)`));  // Brighter color for visibility
  colors.push(color(`hsl(${(baseHue + 120) % 360}, 100%, 75%)`));
  colors.push(color(`hsl(${(baseHue + 240) % 360}, 100%, 75%)`));
}

function draw() {
  background(0);
  drawColorLayer(colorFrames[0]); // Assume there's only one color layer
  
  drawFrame(frames[currentHomeFrame] || []); // Check if frames[currentFrame] exists, otherwise provide an empty array as default
  if (frameCount % 6 === 0) {
    currentHomeFrame = (currentHomeFrame + 1) % frames.length;
    if (currentHomeFrame === 0) {  // Check if a loop has completed
      loopCounter++;
      corruptTiles();  // Introduce corruption
    }
  }
  if (millis() - startTime > noteDuration) {
    osc.stop();
    playNote(); // Play the next note or loop back to the start
  }
  if (loopCounter > 3) {
    console.log('loops' + loopCounter);
    window.api.navigate('abyss.html');
  }

}

function corruptTiles() {
  frames.forEach(frame => {
    frame.forEach(row => {
      row.forEach((tile, index) => {
        if (random() < 0.1) { // 10% chance to corrupt each tile
          row[index] = floor(random(1, 211)); // Replace with random tile index
        }
      });
    });
  });
}

function drawColorLayer(colorLayer) {
  if (!colorLayer) {
    return;
  }
  for (let y = 0; y < colorLayer.length; y++) {
    for (let x = 0; x < colorLayer[y].length; x++) {
      let colorIndex = (colorLayer[y][x] - 1) % 3; // Cycle through the three colors
      fill(colors[colorIndex]);
      noStroke();
      rect(x * globalVars.TILE_WIDTH / 2, y * globalVars.TILE_HEIGHT / 2, globalVars.TILE_WIDTH / 2, globalVars.TILE_HEIGHT / 2);
    }
  }
}

function drawFrame(frame) {
  if (!frame) {
    frame = frames[1]; // Provide an empty array as default if frames[1] is undefined
  }
  for (let y = 0; y < frame.length; y++) {
    for (let x = 0; x < frame[y].length; x++) {
      let tileCode = frame[y][x];
      let flippedH = (tileCode & 0x80000000) > 0;
      let flippedV = (tileCode & 0x40000000) > 0;
      let tileIndex = (tileCode & 0x1FFFFFFF) - 1; // Adjust for zero-based indexing

      let sx = (tileIndex % globalVars.SPRITESHEET_COLS) * globalVars.TILE_WIDTH;
      let sy = Math.floor(tileIndex / globalVars.SPRITESHEET_COLS) * globalVars.TILE_HEIGHT;

      push(); // Isolate transformations
      translate(x * globalVars.TILE_WIDTH / 2 + globalVars.TILE_WIDTH / 4, y * globalVars.TILE_HEIGHT / 2 + globalVars.TILE_HEIGHT / 4);
      if (flippedH && flippedV) {
        rotate(PI); // Rotate 180 degrees to handle both flips
      } else {
        if (flippedH) {
          scale(-1, 1); // Flip horizontally
        }
        if (flippedV) {
          scale(1, -1); // Flip vertically
        }
      }
      image(spriteSheet, -globalVars.TILE_WIDTH / 4, -globalVars.TILE_HEIGHT / 4, globalVars.TILE_WIDTH / 2, globalVars.TILE_HEIGHT / 2, sx, sy, globalVars.TILE_WIDTH, globalVars.TILE_HEIGHT);
      pop();
    }
  }
}

function keyPressed(event) {
  if (event.key === '}') { 
    window.api.navigate('abyss.html');
  } else if (event.key === '{') {
    window.api.navigate('geomancy.html');
  } else if (event.key === 'c') {
    window.api.navigate('cradle.html');
  } else if (event.key === 'v') {
    window.api.navigate('video.html');
  } else if (event.key === 't') {
    window.api.navigate('textovka.html');
  } else if (event.key === 'Escape') {
    if (window.api) {
      window.api.quitApp();
    }
  }
}

// Add an event listener to the document to handle keydown events
document.addEventListener('keydown', keyPressed);
