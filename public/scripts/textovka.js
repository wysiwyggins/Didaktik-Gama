let textBoxWidth, textBoxHeight, mapBoxWidth, mapBoxHeight, inputBoxWidth, inputBoxHeight;
let inkStory;
let currentText = "";
let currentChoices = [];
let assetsLoaded = false;
let needsRedraw = true;

function preload() {
    let spritesheetPromise = new Promise((resolve, reject) => {
        spritesheet = loadImage(globalVars.SPRITESHEET_PATH, resolve, reject);
    });

    let spritesheetDataPromise = new Promise((resolve, reject) => {
        spritesheetData = loadJSON(globalVars.SPRITE_DATA_PATH, resolve, reject);
    });

    let inkStoryPromise = new Promise((resolve, reject) => {
        loadJSON("data/ink/testInk.json", (data) => {
            inkStory = new inkjs.Story(data);
            resolve();
        }, reject);
    });

    Promise.all([spritesheetPromise, spritesheetDataPromise, inkStoryPromise]).then(() => {
        assetsLoaded = true;
        needsRedraw = true;
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
    let words = text.split(' ');
    let x = 1, y = 1;

    for (let word of words) {
        if (x + word.length >= textBoxWidth - 1) {
            x = 1;
            y++;
        }
        if (y >= textBoxHeight - 1) break;
        for (let char of word) {
            displayTileForCharacter(char, x, y);
            x++;
        }
        if (x < textBoxWidth - 1) {
            displayTileForCharacter(' ', x, y);
            x++;
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
}

function continueStory() {
    if (!inkStory) return;

    currentText = "";
    while (inkStory.canContinue) {
        currentText += inkStory.Continue();
    }

    currentChoices = inkStory.currentChoices.map(choice => choice.text);
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
