let textBoxWidth, textBoxHeight, mapBoxWidth, mapBoxHeight, inputBoxWidth, inputBoxHeight;
let placeholderText = "Lorem ipsum dolor sit amet, consectetur adipiscing elit.";

function preload() {
    spritesheet = loadImage(globalVars.SPRITESHEET_PATH);
    spritesheetData = loadJSON(globalVars.SPRITE_DATA_PATH);
}

function setup() {
    createCanvas(globalVars.CANVAS_COLS * globalVars.TILE_WIDTH, globalVars.CANVAS_ROWS * globalVars.TILE_HEIGHT);
    textBoxWidth = floor((globalVars.CANVAS_COLS * 3) / 4);
    textBoxHeight = floor(globalVars.CANVAS_ROWS * 2 / 3);
    mapBoxWidth = globalVars.CANVAS_COLS - textBoxWidth;
    mapBoxHeight = textBoxHeight;
    inputBoxWidth = globalVars.CANVAS_COLS;
    inputBoxHeight = globalVars.CANVAS_ROWS - textBoxHeight;

    drawBoxes();
    fillTextBox(placeholderText);
}

function drawBoxes() {
    // Draw text description box
    drawBox(0, 0, textBoxWidth, textBoxHeight);
    // Draw room map box
    drawBox(textBoxWidth, 0, mapBoxWidth, mapBoxHeight);
    // Draw input box
    drawBox(0, textBoxHeight, inputBoxWidth, inputBoxHeight);
}

function drawBox(x, y, w, h) {
    // Draw top and bottom borders
    for (let i = x + 1; i < x + w - 1; i++) {
        displayTile("BOX_HORIZONTAL", i, y);
        displayTile("BOX_HORIZONTAL", i, y + h - 1);
    }
    // Draw side borders
    for (let j = y + 1; j < y + h - 1; j++) {
        displayTile("BOX_VERTICAL", x, j);
        displayTile("BOX_VERTICAL", x + w - 1, j);
    }
    // Draw corners
    displayTile("BOX_TOP_LEFT", x, y);
    displayTile("BOX_TOP_RIGHT", x + w - 1, y);
    displayTile("BOX_BOTTOM_LEFT", x, y + h - 1);
    displayTile("BOX_BOTTOM_RIGHT", x + w - 1, y + h - 1);
}

function fillTextBox(text) {
    let x = 1, y = 1;
    for (let i = 0; i < text.length; i++) {
        if (x >= textBoxWidth - 1) {
            x = 1;
            y++;
        }
        if (y >= textBoxHeight - 1) break;
        displayTileForCharacter(text.charAt(i), x, y);
        x++;
    }
}

function displayTile(tileName, col, row) {
    let [tileX, tileY] = spritesheetData.tiles[tileName];
    let imgX = tileX * globalVars.TILE_WIDTH;
    let imgY = tileY * globalVars.TILE_HEIGHT;
    let canvasX = col * globalVars.TILE_WIDTH;
    let canvasY = row * globalVars.TILE_HEIGHT;
    image(spritesheet, canvasX, canvasY, globalVars.TILE_WIDTH, globalVars.TILE_HEIGHT, imgX, imgY, globalVars.TILE_WIDTH, globalVars.TILE_HEIGHT);
}

function displayTileForCharacter(char, col, row) {
    let tileName;
    
    // Handle numbers
    if (char >= '0' && char <= '9') {
        tileName = 'DIGIT_' + char;
    } 
    // Handle uppercase letters
    else if (char >= 'A' && char <= 'Z') {
        tileName = 'LATIN_CAPITAL_LETTER_' + char;
    } 
    // Handle lowercase letters
    else if (char >= 'a' && char <= 'z') {
        let uppercaseChar = char.toUpperCase();
        tileName = 'LATIN_SMALL_LETTER_' + uppercaseChar;
    }

    // If tileName was set, look it up and set the tile
    if (tileName && spritesheetData.tiles[tileName]) {
        displayTile(tileName, col, row);
    } else {
        // Map non-alphanumeric characters to their corresponding tiles
        switch (char) {
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
            default: displayTile("BLANK", col, row); // Fallback for unmapped characters
        }
    }
}
