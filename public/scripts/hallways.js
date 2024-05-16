let hallwayFrames = []; // Initialize the frames array
let tmjData;
let tmjFile = './assets/maps/hallways.tmj';
let loopCounter = 0; 
let currentHallwayFrame = 0;
let stepSound;
let startTime;
let secondaryColor;
let reverb;
let socket; // Declare socket variable
reverb = new p5.Reverb();

function preload() {
  spriteSheet = loadImage(globalVars.SPRITESHEET_PATH);
  spritesheetData = loadJSON(globalVars.SPRITE_DATA_PATH);
  tmjData = loadJSON(tmjFile);
  stepSound = loadSound('./assets/sound/20.wav');
}

function setup() {
    // Create a baseColor with random RGB values
    baseColor = color(random(100,256), random(100,256), random(100,256));
    
    // Extract RGB components from the baseColor
    let r = red(baseColor);
    let g = green(baseColor);
    let b = blue(baseColor);
  
    createCanvas(globalVars.CANVAS_COLS * globalVars.TILE_WIDTH / 2, globalVars.CANVAS_ROWS * globalVars.TILE_HEIGHT / 2);
    parseTMJ(tmjData);
    reverb.process(stepSound, loopCounter, loopCounter + 1);
  
    // Delay the execution of draw function by 600 milliseconds (adjust the delay time as needed)
    setTimeout(() => {
      draw(); // Call the draw function after the delay
    }, 600);
  
    // Connect to the server with a delay to ensure setup processes complete
    setTimeout(() => {
      try {
        try {
          socket = io.connect('http://localhost:3000');
        } catch (error) {
          console.error('Socket connection failed.', error);
        }
        // Event listener for successful connection
        socket.on('connect', () => {
          console.log('Connected to server');
          // Emit the baseColorChanged event with the RGB values
          socket.emit('baseColorChanged', { red: r, green: g, blue: b });
        });
  
      } catch (error) {
        console.error('Socket connection failed.');
      }
    }, 2000);
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
    
    frames.push(frame);
    
  });
}

function draw() {
  
  background(baseColor);
  drawFrame(frames[currentHallwayFrame] || []); // Check if frames[currentFrame] exists, otherwise provide an empty array as default
  if (frameCount % 12 === 0) {
    currentHallwayFrame = (currentHallwayFrame + 1) % frames.length;
    stepSound.play();
    if (currentHallwayFrame === 0) {  // Check if a loop has completed
      loopCounter++;
      // shuffle tiles
    }
  }
  if (loopCounter > 20) {
    window.location.href = 'patterns.html';
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
    window.location.href = 'home.html';
  } else if (event.key === '{') {
    window.location.href = 'mirror.html';
  }
}

// Add an event listener to the document to handle keydown events
document.addEventListener('keydown', keyPressed);

