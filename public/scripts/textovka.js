let textBoxWidth, textBoxHeight, mapBoxWidth, mapBoxHeight, inputBoxWidth, inputBoxHeight;
let inkStory;
let currentText = "";
let currentChoices = [];
let assetsLoaded = false;
let needsRedraw = true;
let tileMapData;
let currentLayerName = "libuse";

const FLIPPED_HORIZONTALLY_FLAG = 0x80000000;
const FLIPPED_VERTICALLY_FLAG = 0x40000000;
const FLIPPED_DIAGONALLY_FLAG = 0x20000000;

function fetchJudgeName() {
    const serverUrl = 'http://localhost:3000/judgeName';
    fetch(serverUrl)
        .then(response => response.json())
        .then(data => {
            console.log('Fetched judgeName:', data.judgeName);
            if (inkStory) {
                inkStory.variablesState.$('judgeName', data.judgeName);
                console.log('Set judgeName in Ink:', data.judgeName);
            }
        })
        .catch(error => console.error('Error fetching judgeName:', error));
}

function preload() {
    let spritesheetPromise = new Promise((resolve, reject) => {
        spritesheet = loadImage(globalVars.SPRITESHEET_PATH, () => {
            console.log("Spritesheet loaded");
            resolve();
        }, reject);
    });

    let spritesheetDataPromise = new Promise((resolve, reject) => {
        spritesheetData = loadJSON(globalVars.SPRITE_DATA_PATH, () => {
            console.log("Spritesheet data loaded");
            resolve();
        }, reject);
    });

    let inkStoryPromise = new Promise((resolve, reject) => {
        loadJSON("data/ink/testInk.json", (data) => {
            inkStory = new inkjs.Story(data);
            console.log("Ink story loaded");
            resolve();
        }, reject);
    });

    let tileMapPromise = new Promise((resolve, reject) => {
        loadJSON("assets/maps/libuse.tmj", (data) => {
            tileMapData = data;
            console.log("Tilemap data loaded");
            resolve();
        }, reject);
    });

    Promise.all([spritesheetPromise, spritesheetDataPromise, inkStoryPromise, tileMapPromise]).then(() => {
        assetsLoaded = true;
        needsRedraw = true;
        console.log("All assets loaded");

        // Fetch judgeName after assets are loaded
        fetchJudgeName();
    }).catch((error) => {
        console.error("Error loading assets:", error);
    });
}

function setup() {
    createCanvas(globalVars.CANVAS_COLS * globalVars.TILE_WIDTH, globalVars.CANVAS_ROWS * globalVars.TILE_HEIGHT);
    textBoxWidth = floor((globalVars.CANVAS_COLS * 3) / 4);
    textBoxHeight = floor(globalVars.CANVAS_ROWS * 2 / 3);
    mapBoxWidth = globalVars.CANVAS_COLS - textBoxWidth;
    mapBoxHeight = textBoxHeight;
    inputBoxWidth = globalVars.CANVAS_COLS;
    inputBoxHeight = globalVars.CANVAS_ROWS - textBoxHeight;
    background(255);
    drawBoxes();

    if (assetsLoaded) {
        continueStory();
    }
}

function parseTMJ(tmj) {
    let layers = {};
    tmj.layers.forEach(layer => {
        if (layer.type === "tilelayer") {
            let parsedLayer = [];
            for (let i = 0; i < layer.data.length; i++) {
                let col = i % layer.width;
                let row = Math.floor(i / layer.width);
                if (!parsedLayer[row]) {
                    parsedLayer[row] = [];
                }
                parsedLayer[row][col] = layer.data[i];
            }
            layers[layer.name] = parsedLayer;
        }
    });
    console.log("Parsed TMJ layers:", layers);
    return layers;
}

function getTileCoordinates(tileId, tilesetCols) {
    let tileX = (tileId - 1) % tilesetCols;
    let tileY = Math.floor((tileId - 1) / tilesetCols);
    return [tileX, tileY];
}

function drawTileMap() {
    if (!tileMapData || !spritesheet || !spritesheetData) {
        console.log("Tilemap data, spritesheet, or spritesheet data not loaded");
        return;
    }

    let layers = parseTMJ(tileMapData);
    let tilesetCols = Math.floor(spritesheet.width / globalVars.TILE_WIDTH); // Number of columns in the tileset

    let layer = layers[currentLayerName];
    if (layer) {
        for (let row = 0; row < layer.length; row++) {
            for (let col = 0; col < layer[row].length; col++) {
                let tileId = layer[row][col];
                if (tileId > 0) {
                    let flippedHorizontally = (tileId & FLIPPED_HORIZONTALLY_FLAG) !== 0;
                    let flippedVertically = (tileId & FLIPPED_VERTICALLY_FLAG) !== 0;
                    let flippedDiagonally = (tileId & FLIPPED_DIAGONALLY_FLAG) !== 0;

                    tileId = tileId & ~(FLIPPED_HORIZONTALLY_FLAG | FLIPPED_VERTICALLY_FLAG | FLIPPED_DIAGONALLY_FLAG);

                    let [tileX, tileY] = getTileCoordinates(tileId, tilesetCols);
                    //console.log(`Displaying tile ID ${tileId} at (${col}, ${row}) with coordinates (${tileX}, ${tileY}), flippedH: ${flippedHorizontally}, flippedV: ${flippedVertically}, flippedD: ${flippedDiagonally}`);
                    displayTileInMapBox(tileX, tileY, col, row, flippedHorizontally, flippedVertically, flippedDiagonally);
                }
            }
        }
    }
}

function displayTileInMapBox(tileX, tileY, col, row, flippedH, flippedV, flippedD) {
    if (!spritesheet) {
        console.log("Spritesheet not available for displayTileInMapBox");
        return;
    }

    let imgX = tileX * globalVars.TILE_WIDTH;
    let imgY = tileY * globalVars.TILE_HEIGHT;
    let canvasX = (textBoxWidth + col) * globalVars.TILE_WIDTH;
    let canvasY = row * globalVars.TILE_HEIGHT;
    
    push(); // Start a new drawing state
    translate(canvasX, canvasY);
    
    if (flippedH) {
        translate(globalVars.TILE_WIDTH, 0);
        scale(-1, 1);
    }
    if (flippedV) {
        translate(0, globalVars.TILE_HEIGHT);
        scale(1, -1);
    }
    if (flippedD) {
        // This diagonal flip requires a more complex transformation
        // It can be either a 90 or 270 degree rotation with a flip
        translate(globalVars.TILE_WIDTH, globalVars.TILE_HEIGHT);
        rotate(HALF_PI);
        scale(1, -1);
    }
    
    //console.log(`Drawing tile at canvas position (${canvasX}, ${canvasY}) with image coordinates (${imgX}, ${imgY}), flippedH: ${flippedH}, flippedV: ${flippedV}, flippedD: ${flippedD}`);
    image(spritesheet, 0, 0, globalVars.TILE_WIDTH, globalVars.TILE_HEIGHT, imgX, imgY, globalVars.TILE_WIDTH, globalVars.TILE_HEIGHT);
    
    pop(); // Restore original state
}

function draw() {
    if (needsRedraw && assetsLoaded) {
        background(255); // Clear the entire canvas
        drawBoxes();
        if (currentText) {
            displayCurrentText();
        }
        if (currentChoices.length > 0) {
            displayChoices();
        }
        drawTileMap();
        needsRedraw = false; // Reset the redraw flag
    }
}

function drawBoxes() {
    drawBox(0, 0, textBoxWidth, textBoxHeight);
    drawBox(textBoxWidth, 0, mapBoxWidth, mapBoxHeight);
    drawBox(0, textBoxHeight, inputBoxWidth, inputBoxHeight);
}

function drawBox(x, y, w, h) {
    for (let i = x + 1; i < x + w - 1; i++) {
        displayTile("BOX_HORIZONTAL", i, y);
        displayTile("BOX_HORIZONTAL", i, y + h - 1);
    }
    for (let j = y + 1; j < y + h - 1; j++) {
        displayTile("BOX_VERTICAL", x, j);
        displayTile("BOX_VERTICAL", x + w - 1, j);
    }
    displayTile("BOX_TOP_LEFT", x, y);
    displayTile("BOX_TOP_RIGHT", x + w - 1, y);
    displayTile("BOX_BOTTOM_LEFT", x, y + h - 1);
    displayTile("BOX_BOTTOM_RIGHT", x + w - 1, y + h - 1);
}

function fillTextBox(text) {
    clearBox(1, 1, textBoxWidth - 2, textBoxHeight - 2);
    let words = text.split(/(\s+|\n)/); // Split by spaces and newlines, keeping the delimiters
    let x = 1, y = 1;

    for (let word of words) {
        if (word === "\n") {
            x = 1;
            y=y+2;
            continue;
        }

        if (x + word.length >= textBoxWidth - 1) {
            x = 1;
            y++;
        }
        if (y >= textBoxHeight - 1) break;
        
        for (let char of word) {
            if (char !== " ") {
                displayTileForCharacter(char, x, y);
                x++;
            } else {
                if (x < textBoxWidth - 1) {
                    displayTileForCharacter(' ', x, y);
                    x++;
                }
            }
        }
    }
}

function fillOptionsBox(options) {
    clearBox(1, textBoxHeight + 1, inputBoxWidth - 2, inputBoxHeight - 2);
    let x = 1, y = textBoxHeight + 1;
    for (let i = 0; i < options.length; i++) {
        let optionText = (i + 1) + ": " + options[i];
        for (let j = 0; j < optionText.length; j++) {
            displayTileForCharacter(optionText.charAt(j), x, y);
            x++;
        }
        y++;
        x = 1;
    }
}

function clearBox(x, y, w, h) {
    for (let i = x; i < x + w; i++) {
        for (let j = y; j < y + h; j++) {
            displayTile("BLANK", i, j);
        }
    }
}

function displayTile(tileName, col, row) {
    if (!spritesheet || !spritesheetData) return;

    let [tileX, tileY] = spritesheetData.tiles[tileName];
    if (tileX === undefined || tileY === undefined) return;

    let imgX = tileX * globalVars.TILE_WIDTH;
    let imgY = tileY * globalVars.TILE_HEIGHT;
    let canvasX = col * globalVars.TILE_WIDTH;
    let canvasY = row * globalVars.TILE_HEIGHT;
    image(spritesheet, canvasX, canvasY, globalVars.TILE_WIDTH, globalVars.TILE_HEIGHT, imgX, imgY, globalVars.TILE_WIDTH, globalVars.TILE_HEIGHT);
}

function displayTileForCharacter(char, col, row) {
    let tileName;
    if (char >= '0' && char <= '9') {
        tileName = 'DIGIT_' + char;
    } else if (char >= 'A' && char <= 'Z') {
        tileName = 'LATIN_CAPITAL_LETTER_' + char;
    } else if (char >= 'a' && char <= 'z') {
        let uppercaseChar = char.toUpperCase();
        tileName = 'LATIN_SMALL_LETTER_' + uppercaseChar;
    }

    if (tileName && spritesheetData.tiles[tileName]) {
        displayTile(tileName, col, row);
    } else {
        switch (char) {
            case 'š': displayTile("LATIN_SMALL_LETTER_S_WITH_CARON", col, row); break;
            case 'Š': displayTile("LATIN_SMALL_LETTER_S_WITH_CARON", col, row); break;
            case '!': displayTile("EXCLAMATION_MARK", col, row); break;
            case '@': displayTile("COMMERCIAL_AT", col, row); break;
            case '#': displayTile("NUMBER_SIGN", col, row); break;
            case '$': displayTile("DOLLAR_SIGN", col, row); break;
            case '%': displayTile("PERCENT_SIGN", col, row); break;
            case '^': displayTile("CIRCUMFLEX_ACCENT", col, row); break;
            case '&': displayTile("AMPERSAND", col, row); break;
            case '*': displayTile("ASTERISK", col, row); break;
            case ' ': displayTile("BLANK", col, row); break;
            case '(': displayTile("LEFT_PARENTHESIS", col, row); break;
            case ')': displayTile("RIGHT_PARENTHESIS", col, row); break;
            case '-': displayTile("HYPHEN_MINUS", col, row); break;
            case '_': displayTile("LOW_LINE", col, row); break;
            case '+': displayTile("PLUS_SIGN", col, row); break;
            case '=': displayTile("EQUALS_SIGN", col, row); break;
            case '.': displayTile("FULL_STOP", col, row); break;
            case ',': displayTile("COMMA", col, row); break;
            case ':': displayTile("COLON", col, row); break;
            case ';': displayTile("SEMICOLON", col, row); break;
            case '\'': displayTile("APOSTROPHE", col, row); break;
            case '"': displayTile("QUOTATION_MARK", col, row); break;
            case '<': displayTile("LESS_THAN_SIGN", col, row); break;
            case '>': displayTile("GREATER_THAN_SIGN", col, row); break;
            case '?': displayTile("QUESTION_MARK", col, row); break;
            case '/': displayTile("SOLIDUS", col, row); break;
            case '\\': displayTile("REVERSE_SOLIDUS", col, row); break;
            case '|': displayTile("VERTICAL_LINE", col, row); break;
            case '[': displayTile("LEFT_SQUARE_BRACKET", col, row); break;
            case ']': displayTile("RIGHT_SQUARE_BRACKET", col, row); break;
            default: displayTile("BLANK", col, row);
        }
    }
}


function loadInkStory(filename) {
    loadJSON(filename, (data) => {
        inkStory = new inkjs.Story(data);
        if (assetsLoaded) {
            continueStory();
        }
    });
    fetchJudgeName(); // Ensure judgeName is fetched after loading the story
}

function continueStory() {
    if (!inkStory) return;

    currentText = "";
    while (inkStory.canContinue) {
        currentText += inkStory.Continue();
    }

    currentChoices = inkStory.currentChoices.map(choice => choice.text);
    
    // Check for tags to update the current layer
    let tags = inkStory.currentTags;
    for (let tag of tags) {
        if (tag.startsWith("layer")) {
            currentLayerName = tag.slice(1); // Remove the leading '#' character
            console.log(`Switching to layer: ${currentLayerName}`);
        }
    }

    needsRedraw = true;
}

function displayCurrentText() {
    fillTextBox(currentText);
}

function displayChoices() {
    fillOptionsBox(currentChoices);
}

function keyPressed() {
    if (key >= '1' && key <= String(currentChoices.length)) {
        let choiceIndex = int(key) - 1;
        inkStory.ChooseChoiceIndex(choiceIndex);
        continueStory();
    }
}
