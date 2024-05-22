// Create a new Pixi Application
let app = new PIXI.Application({
    width: 1300,
    height: 900,
    backgroundColor: 0xf5f5ee,
    resolution: window.devicePixelRatio || 1,
    autoDensity: true
});

app.stage.sortableChildren = true;
// pixi uses this to switch zIndex layering within one of it's containers

let uiContainer = new PIXI.Container();
let uiContainerShown = true;
let uiMaskContainer = new PIXI.Container();
let gameContainer = new PIXI.Container();

//I've currently only got three pixi containers to render sprites to the screen,
//gameContainer has the game stage, uiMask is a translucent white background for UIBoxes
//and uiContainer has the uiBox borders and content

app.stage.addChild(gameContainer);
gameContainer.sortableChildren = true;
app.stage.addChild(uiMaskContainer);
app.stage.addChild(uiContainer);

//adding a global stub for the player. This kind of precludes fun things like multiple players, but oh well
// there is an array of players still from when I thought I'd have multiple players
let player = null;

// Add the app view to our HTML document
document.getElementById('game').appendChild(app.view);

let turnTimeout; // timer for passing turns 

// Set up some constants
const rect = app.view.getBoundingClientRect();
const MAP_WIDTH = 65;
const MAP_HEIGHT = 60;
const SCALE_FACTOR = 0.5; // Scaling factor for HiDPI displays
const SPRITE_POSITION = 5; // Position of the sprite (in tiles)
//dungeon is used by rot.js' dungeon drawing functions, we need a global stub to get things like
//door locations
let dungeon = null;
let currentTreasureRoom; // right now one room has locked doors.
let globalDoorCounter = 0;
let currentLevelIndex = 1;

const BOX_TOP_LEFT = {x: 8, y: 9};
const BOX_HORIZONTAL = {x: 11, y: 8};
const BOX_VERTICAL = {x: 17, y: 7};
const BOX_TOP_RIGHT = {x: 6, y: 8};  
const BOX_BOTTOM_LEFT = {x: 5, y: 1};
const BOX_BOTTOM_RIGHT = {x: 7, y: 9};
const BOX_VERTICAL_HORIZONTAL = {x: 12, y: 8};
const BOX_UP_HORIZONTAL = {x: 8, y: 8};
const BOX_LEFT_VERTICAL = {x: 18, y: 7};
const BOX_RIGHT_VERTICAL = {x: 10, y: 8};
const BOX_DOWN_HORIZONTAL = {x: 9, y: 8};
const BOX_HORIZONTAL_HALF = {x: 20, y: 10};

//console.log('Initializing maps');
// maps are arrays that I am using really messily. they have a value which is a number
// that started out as the number of the tile being displayed, but I also use it for game logic
//like pathfinding. they can also hold a sprite for easily accessing the sprite objects that are being displayed
// in the pixi containers. THey also allow me to have 'layers' without having a bunch more pixi containers.
// I probably shouldn't have made all these but it made it easier for me to program
let backgroundMap = createEmptyMap();
//background is the black void and the shadows that make the rooms look like towers in the dark
let floorMap = createEmptyMap();
//floor is used for pathfinding, it also includes the 'footprint' tiles of walls, since those are used for pathfinding
let objectMap = createEmptyMap();
//items
let growthMap = createEmptyMap();
//plants
let doorMap = createEmptyMap();
//doors
let wallMap = createEmptyMap();
// the height of walls, (their middle and top tiles)
let atmosphereMap = createEmptyMap();
// fire, smoke and gas
let bloodMap = createEmptyMap();
let uiMaskMap = createEmptyMap();
// the background of uiboxes
let uiMap = createEmptyMap();

let overlayMap = createEmptyMap();
// the content of uiboxes


let engine;
let gameOver = false;
var players = [];
let activeEntities = [];
let activeItems = [];
var messageList;
var inspector;

let audioSpriteData;
let sound;

//ticker is a tween thing I use for things that animate in place, like fire and smoke
createjs.Ticker.framerate = 60;
createjs.Ticker.addEventListener("tick", createjs.Tween);
// fix for freeze when wake from sleep
document.addEventListener('visibilitychange', function() {
    if (document.visibilityState === 'visible') {
        PIXI.Ticker.shared.start();  // Restart PIXI ticker
        createjs.Ticker.paused = false;  // Resume CreateJS ticker
        engine.start();  // Resume ROT.js engine if it was stopped
        console.log('Game resumed');
    } else {
        PIXI.Ticker.shared.stop();  // Stop PIXI ticker to prevent unnecessary processing
        createjs.Ticker.paused = true;  // Pause CreateJS ticker
        engine.lock();  // Optionally lock ROT.js engine
        console.log('Game paused');
    }
});
function checkAndLogState() {
    console.log('PIXI Ticker running:', !PIXI.Ticker.shared.started);
    console.log('CreateJS Ticker status:', createjs.Ticker.paused);
}
document.addEventListener('visibilitychange', checkAndLogState);
function restartTickers() {
    PIXI.Ticker.shared.stop();
    PIXI.Ticker.shared.start();
    createjs.Ticker.paused = false;
}
// end sleep fixes

function passTurn() {
    console.log('Turn passed due to inactivity.');

    players.forEach(player => {
        if (!player.isDead) {
            player.inactiveTurns++;
            console.log(`Player inactive turns: ${player.inactiveTurns}`);
            if (player.inactiveTurns >= 3) {
                player.zeroPlayerMode = true; // Set zero-player mode
                console.log("Entering zero-player mode");
                moveToNearestItem(player);
            }
        }
    });

    // Process the next entity in the scheduler
    if (engine) {
        if (!engine.lock) {
            console.log("Engine is unlocked, processing next turn.");
            engine.start();  // This method resumes the engine if it was stopped.
        } else {
            console.log("Engine is locked, likely waiting for a current action to complete.");
            if ( player.zeroPlayerMode){

                engine.unlock();
                console.log("unlocked the engine");
            }
        }
    } else {
        console.log("No engine found, make sure it's initialized and referenced correctly.");
    }

    // Reset the turn timer to wait for another period of inactivity
    resetTurnTimer();
}



function resetTurnTimer() {
    clearTimeout(turnTimeout);  // Clear the existing timer
    turnTimeout = setTimeout(passTurn, 5000); //5 sec timer
}

//var audio = new Audio('assets/sound/grottoAudiosprite.mp3');
//audio.play();

//initialize each of the map arrays
function createEmptyMap() {
    let map = new Array(MAP_HEIGHT);
    for (let y = 0; y < MAP_HEIGHT; y++) {
        map[y] = new Array(MAP_WIDTH);
        for (let x = 0; x < MAP_WIDTH; x++) {
            map[y][x] = 0;
        }
    }
    return map;
}

//loading animated sprite tiles for fire and smoke

let fireFrames = [];
let smokeFrames = [];
// Load the spritesheet using the global PIXI.Loader object
PIXI.Loader.shared
    .add('tiles', globalVars.SPRITESHEET_PATH)
    .add('fire', 'assets/spritesheets/fire.png')
    .add('smoke', 'assets/spritesheets/smoke.png')
    .load(setup);


PIXI.Loader.shared.onComplete.add(() => {
    for (let i = 0; i < 7; i++) {
        let rect = new PIXI.Rectangle(i * globalVars.TILE_WIDTH, 0, globalVars.TILE_WIDTH, globalVars.TILE_HEIGHT);
        let texture = new PIXI.Texture(PIXI.Loader.shared.resources.fire.texture.baseTexture, rect);
        fireFrames.push(texture);
    }
    for (let i = 0; i < 7; i++) {
        let rect = new PIXI.Rectangle(i * globalVars.TILE_WIDTH, 0, globalVars.TILE_WIDTH, globalVars.TILE_HEIGHT);
        let texture = new PIXI.Texture(PIXI.Loader.shared.resources.smoke.texture.baseTexture, rect);
        smokeFrames.push(texture);
    }
});
//console.log(smokeFrames);

fetch("data/grottoAudiosprite.json")
  .then(response => response.json())
  .then(data => {
    audioSpriteData = data;
    initHowler();
  })
  .catch(error => {
    console.error("Error fetching sprite data:", error);
  });

function initHowler() {
// Correct the urls path as needed
const correctUrls = audioSpriteData.urls.map(url => {
    return url.replace("~/Development/audiosprite-master/", "../assets/sound/");
});

sound = new Howl({
    src: correctUrls,
    sprite: audioSpriteData.sprite,
    volume: 1
});

// You can now use the sound object as needed
}

function playDoorSound() {
    sound.play('plunk3');
};

function playFootstepSound() {
    sound.play('feets');
};
function playExitSound() {
    sound.play('levelout');
};
function playArrowSound(didHit) {
    if (didHit) {
        sound.play('arrow_hit');
    } else {    
        sound.play('arrow_miss');
    }
};

function playPickupSound() {
    sound.play('tap3');
}

function playBloomSound() {
    const soundNames = ['tone2', 'tone3', 'tone4', 'tone5'];
    const randomSound = soundNames[Math.floor(Math.random() * soundNames.length)];

    sound.play(randomSound);
}

function playFireballSound() {
    sound.play('fireball');
}

function playBumpSound() {
    sound.play('tap1');
}
  
// level saving and loading doesn't work yet, but I'm leaving it in for now

let levels = [];
// levels
class Level {
    constructor() {
        // Maps and other level-specific data.
        this.backgroundMap = createEmptyMap();
        this.floorMap = createEmptyMap();
        this.backgroundMap = createEmptyMap();
        this.objectMap = createEmptyMap();
        this.doorMap = createEmptyMap();
        this.wallMap = createEmptyMap();
        this.growthMap = createEmptyMap();
        this.atmosphereMap = createEmptyMap();
        this.activeEntities = [];
        this.activeItems = [];
        this.upExitPosition = {x: 0, y: 0};
        this.downExitPosition = {x: 0, y: 0};

    }
}

function saveLevel(levelIndex) {
    const saveState = levels[levelIndex];  // Assumes you've populated this level with data
    const saveData = JSON.stringify(saveState);
    localStorage.setItem(`levelSave_${levelIndex}`, saveData);
}

function loadLevel(levelIndex) {
    const saveData = localStorage.getItem(`levelSave_${levelIndex}`);
    if (!saveData) return;  // No saved level found

    const saveState = JSON.parse(saveData);
    levels[levelIndex] = Object.assign(new Level(), saveState);  // Restore level data
}

function goToNextLevel(currentLevelIndex) {
    // Save current level state
    saveLevel(currentLevelIndex);

    // Transition to the next level (either load it or generate a new one)
    if (levels[currentLevelIndex + 1]) {
        loadLevel(currentLevelIndex + 1);
    } else {
        // Generate and store a new level if it doesn't exist yet
        let newLevel = generateNewLevel();  // Assumes you have a level generation function
        levels.push(newLevel);
        // Render or set up this new level in your game
    }
}

// in most roguelikes everything would inherit from entity, but here it's just plants, smoke, fire and gas etc. 

class Entity {
    constructor(x, y, scheduler, frames, zIndex, map) {
        activeEntities.push(this);
        this.x = x;
        this.y = y;
        this.scheduler = scheduler;
        this.map = map;
        this.name = "Entity";
        this.isFlammable = false;
        if (frames.length > 0) {
            this.sprite = new PIXI.AnimatedSprite(frames);
            this.sprite.animationSpeed = 0.1;
            this.sprite.loop = true;
            this.sprite.play();
            this.sprite.position.set(x * globalVars.TILE_WIDTH * SCALE_FACTOR, y * globalVars.TILE_HEIGHT * SCALE_FACTOR); 
            this.sprite.scale.set(SCALE_FACTOR);
            this.sprite.zIndex = zIndex;
            gameContainer.addChild(this.sprite);

            this.sprite.interactive = true;
            this.sprite.on('mouseover', () => {
                messageList.hideBox(); 
                this.showInspectorInfo();
                inspector.showBox();  
                inspector.render();  
            });
            this.sprite.on('mouseout', () => {
                inspector.hideBox();
                messageList.showBox();
            });
        } else {
            this.sprite = null;
        }
        this.destroy = () => {
            // Check if the map and the specific tile in the map exist
            if (this.map[this.y] && this.map[this.y][this.x]) {
                this.map[this.y][this.x] = null; // Clear the tile from the map
            }

            // Destroy sprite and remove from scheduler
            if (this.sprite) {
                this.sprite.destroy();
            }
            this.scheduler.remove(this);
            let index = activeEntities.indexOf(this);
            if (index !== -1) {
                activeEntities.splice(index, 1);
            }
        };
    }

    showInspectorInfo() {
        // This method should be overridden by subclasses to display specific information
        inspector.clearMessages();
        inspector.addMessage(`${this.name}`);
    }

    act() {
        // This method should be implemented by subclasses
    }
}

// Actor is the class that Player and Monster inherit from, it's new and probably not utilized enough yet

class Actor {
    static allActors = [];
    constructor(type, x, y, scheduler, engine, messageList, inspector) {
        this.isDead = false;
        this.type = type;
        this.x = x;
        this.y = y;
        this.prevX = null;
        this.prevY = null;
        this.sprite = {}; 
        this.scheduler = scheduler;
        this.engine = engine;
        this.messageList = messageList;
        this.inspector = inspector;
        this.inventory = [];
        this.blood = 100;
        this.isFlammable = true;
        this.isBurning = false;
        this.burningTurns = 0;
        Actor.allActors.push(this);
    }

    takeDamage(amount) {
        this.blood -= amount;
        if (this.blood <= 0) {
            this.die();
        }
    }
    die(){ 
        this.isDead = true;
        this.sprite.visible = false;
        this.scheduler.remove(this);
        this.messageList.addMessage(`${this.name} returns to dust.`);
    }

    checkForItems(x, y) {
        let item = objectMap[y][x]?.item;
        if (item) this.pickUpItem(item, x, y);
    }
    updatePosition(newTileX, newTileY) {
        //console.log('update player position');
        this.prevX = this.x;
        this.prevY = this.y;
        this.x = newTileX;
        this.y = newTileY;
        
    }
    pickUpItem(item, x, y) {
        // Remove the item from the object map and the game container
        objectMap[y][x] = null;
        gameContainer.removeChild(item.sprite);
        playPickupSound();
        this.updatePosition(x, y); 
    
        // Add the item to the player's inventory
        if (item.type != ItemType.ARROW && item.type != ItemType.FLOWER) {
            this.inventory.push(item);
        }
        if (item.type === ItemType.BOW || item.type === ItemType.ARROW) {
            this.arrows++;
        }
        if (item.type === ItemType.FLOWER) {
            this.flowers++;
            if (this.flowers >= 15) {
                window.api.navigate('patterns.html');  
            } 
        } if (item.type === ItemType.CRADLE) { 
            window.api.navigate('cradle.html');
        }

        // Log a message about the item picked up
        let message = '';

        // Check the type of actor and set the message accordingly
        if (this instanceof Player) {
            message = `You picked up a ${item.name}.`;
        } else if (this instanceof Monster) {
            message = `The ${this.name} picked up a ${item.name}.`;
        }

        // Add a check to ensure message is not undefined or empty
        if (message) {
            this.messageList.addMessage(message);
        }
        
    }
}

// there are different player sprites for PLayerTypes, not yet used but they do work

const PlayerType = Object.freeze({
    "HUMAN": 0,
    "ANIMAL": 1,
    "GHOST": 2,
    "ROBOT": 3,
    "BIRD": 4,
    "OBELISK": 5,
    "FUNGUS": 6,
    "SKELETON" : 7,
    "VEGETABLE": 8,
    "PILE": 9
    
});
function resetPlayerStates() {
    players.forEach(player => {
        player.inactiveTurns = 0;
        player.zeroPlayerMode = false;
        player.failedMoveAttempts = 0;
    });
}
class Player extends Actor{
    constructor(type, x, y, scheduler, engine, messageList, inspector) {
        super(type, x, y, scheduler, engine, messageList, inspector);
        this.inactiveTurns = 0;
        this.zeroPlayerMode = false; // Flag for zero-player mode
        this.failedMoveAttempts = 0; // Counter for failed move attempts
        this.name = "You";
        this.isSkeletonized = false;
        this.isTargeting = false;
        
        //players are made of two tiles, a head and feet, they also have some shadow tiles
        //that do complex stuff to show or hide on walls and floors
        this.footprintTile;
        this.headTile;
        this.range = 10;
        //we want to warn the player if they are about to step in fire
        this.attemptingFireEntry = false;
        this.fireEntryDirection = null;
        this.headShadowTile = {x: 14, y: 9};
        this.footShadowTile = {x: 8, y: 6};
        this.sprite.shadow = null;
        this.footShadowTile.zIndex = 1.5;

        window.addEventListener('keydown', (event) => {
            resetPlayerStates();
            this.handleKeydown(event);
            
        });
        window.addEventListener('mousedown', (event) => {
            resetPlayerStates();
            this.handleClick(event);
        });
        window.addEventListener('mousemove', (event) => {
            if (this.isTargeting) {
                // calculate tile coordinates from pixel coordinates
                let relativeX = event.clientX - rect.left;
                let relativeY = event.clientY - rect.top;
                
                let x = Math.floor(relativeX / (globalVars.TILE_WIDTH * SCALE_FACTOR));
                let y = Math.floor(relativeY / (globalVars.TILE_HEIGHT * SCALE_FACTOR));
                
                // Update the targeting sprite
                this.removeTargetingSprite();
                this.displayTargetingSprite(x, y);
            }
        });
        // player only items
        this.arrows = 0;
        this.flowers = 0;
        
        // You can set the specific footprint and head tiles for each player type here.
        switch(type) {
            case PlayerType.HUMAN:
                this.name ="Bivoj the human";
                this.footprintPosition = {x: 10, y: 5};
                this.headPosition = {x: 1, y: 0};
                break;
            case PlayerType.ANIMAL:
                this.name = "An animal";
                this.footprintPosition = {x: 10, y: 7}; 
                this.headPosition = {x: 1, y: 0}; 
                break;
            case PlayerType.GHOST:
                this.name = "A ghost";
                this.footprintPosition = {x: 19, y: 7}; 
                this.headPosition = {x: 2, y: 0}; 
                break;
            case PlayerType.ROBOT:
                this.name = "A robot";
                this.footprintPosition = {x: 10, y: 5}; 
                this.headPosition = {x: 13, y: 6}; 
                break;
            case PlayerType.BIRD:
                this.name = "A bird";
                this.footprintPosition = {x: 13, y: 7}; 
                this.headPosition = {x: 13, y: 7}; 
                break;
            case PlayerType.OBELISK:
                this.name = "An obelisk";
                this.footprintPosition = {x: 6, y: 7}; 
                this.headPosition = {x: 18, y: 8}; 
                break;
            case PlayerType.FUNGUS:
                this.name = "A fungus";
                this.footprintPosition = {x: 17, y: 7}; 
                this.headPosition = {x: 9, y: 8}; 
                break;
            case PlayerType.VEGETABLE:
                this.name = "A vegetable";
                this.footprintPosition = {x: 13, y: 7};
                this.headPosition = {x: 6, y: 8};  
                break;
            case PlayerType.SKELETON:
                this.name = "A skeleton";
                this.footprintPosition = {x: 8, y: 7};
                this.headPosition = {x: 9, y: 7};  
                break;
            case PlayerType.PILE:
                this.name = "A pile of ashes";
                this.footprintPosition = {x: 7, y: 1};
                this.headPosition = {x: 0, y: 0};  
                break;
            default:
                this.footprintPosition = {x: 8, y: 5};
                this.headPosition = {x: 1, y: 0};
                break;
        }
    }
    // check to see if anyone is still alive. When the player is dead the game goes into zero
    // player mode
    static checkLivingPlayers() {
        for (let player of players) {
            if (!player.isDead) {
                return true;
            }
        }
        return false;
    }
    canSeeMonster(monsters) {
        for (let monster of monsters) {
            let dx = this.x - monster.x;
            let dy = this.y - monster.y;
            let distance = Math.sqrt(dx * dx + dy * dy);
    
            if (distance <= this.range) {  // Use the player's vision range
                let lineToMonster = line({x: this.x, y: this.y}, {x: monster.x, y: monster.y});
                let seen = true;
                for (let point of lineToMonster) {
                    let x = point.x;
                    let y = point.y;
                    if (floorMap[y][x].value !== 157 || (doorMap[y] && doorMap[y][x].value != null)) {
                        seen = false;
                    }
                }
                if (seen) return true;
            }
        }
        return false;
    }
    handleClick(event) {
        // prevent default behavior of the event
        event.preventDefault();

        // calculate tile coordinates from pixel coordinates
        // use relative positions since we center the canvas with CSS
        let relativeX = event.clientX - rect.left;
        let relativeY = event.clientY - rect.top;

        let x = Math.floor(relativeX / (globalVars.TILE_WIDTH * SCALE_FACTOR));
        let y = Math.floor(relativeY / (globalVars.TILE_HEIGHT * SCALE_FACTOR));

        // If player is in targeting mode
        if (this.isTargeting) {
            this.performArrowAttack(x, y);
            this.isTargeting = false;
            this.removeTargetingSprite();
        } 
        // If the player is not in targeting mode
        else {
            // make sure the click is inside the map
            if (x >= 0 && x < MAP_WIDTH && y >= 0 && y < MAP_HEIGHT) {
                this.messageList.addMessage("Walking.");
                this.moveTo(x, y);
            }
        }
    }    
    //moving with arrow keys
    
    move(direction) {
        //console.log('Player is taking turn...');
        
        let [dx, dy] = this.getDeltaXY(direction);
        let [newTileX, newTileY] = [this.x + dx, this.y + dy];
        
        if (this.isOutOfBounds(newTileX, newTileY)) return;
        
        if (!this.isWalkableTile(newTileX, newTileY)){
            playBumpSound();
            console.log("Out of bounds");
            return;
        }

        let otherActor = this.findActorAt(newTileX, newTileY);
        if (otherActor && otherActor instanceof Monster) {
            // Determine next tile in the direction for the other actor
            let [nextTileX, nextTileY] = [newTileX + dx, newTileY + dy];

            // Check if the next tile is walkable
            if (this.isWalkableTile(nextTileX, nextTileY) && !this.findActorAt(nextTileX, nextTileY)) {
                // Move the other actor to the next tile
                otherActor.updatePosition(nextTileX, nextTileY);
                otherActor.updateSpritePosition();
                this.messageList.addMessage(`You shove the ${otherActor.name}.`);
            } else {
                // If next tile is not walkable or occupied, prevent movement
                this.messageList.addMessage(`You can't move there; ${otherActor.name} blocks the way.`);
                return;
            }
        }

        
        let door = Door.totalDoors().find(d => d.x === newTileX && d.y === newTileY);
        if (this.isLockedDoor(door)) return;
    
        if (door) {
            if (this.isOpenableDoor(door)) {
                // If the door can be opened, open it, but don't move player yet.

                door.open();
                playDoorSound();
            }
            // Now, move the player onto the door's tile, whether the door was already open or just opened.
            this.updatePosition(newTileX, newTileY);
            this.updateSprites(newTileX, newTileY);
            return;  // Exit after handling the door.
        }
        let exit = Exit.allExits.find(e => e.x === newTileX && e.y === newTileY);
        if (exit) {
            this.handleExit(exit);
            return; // Exit the function after handling the exit tile
        }
    
        // Handle fire tile effects
        this.handleTileEffects(newTileX, newTileY, direction);
        
        // If the player did not attempt to enter fire or if they attempted and then changed direction, proceed with the move.
        if (!this.attemptingFireEntry || (this.attemptingFireEntry && this.fireEntryDirection !== direction)) {
            this.x = newTileX;
            this.y = newTileY;
            playFootstepSound();
            this.checkForItems(newTileX, newTileY);
            this.updateSprites();
        }
    }

    findActorAt(x, y) {
        // Assuming all actors including monsters and NPCs are stored in a list
        for (let actor of Actor.allActors) {  // Replace 'actors' with actual list of actors
            if (actor.x === x && actor.y === y && !actor.isDead) {
                return actor;
            }
        }
        return null;
    }
    
    handleExit(exit) {
        let currentLevelIndex = levels.indexOf(dungeon);
        if (exit.type === "down") {
            // Handle descending
            goToNextLevel(currentLevelIndex);
            let nextLevel = levels[currentLevelIndex + 1];
            this.updatePosition(nextLevel.upExitPosition.x, nextLevel.upExitPosition.y);
        } else if (exit.type === "up") {
            // Handle ascending
            if (currentLevelIndex > 0) {
                loadLevel(currentLevelIndex - 1);
                let previousLevel = levels[currentLevelIndex - 1];
                this.updatePosition(previousLevel.downExitPosition.x, previousLevel.downExitPosition.y);
            } else {
                console.warn("Already at the topmost level!");
                return;
            }
        }
    
        playExitSound();
        this.updateSprites();
    }
    
    die(){
        this.messageList.addMessage("You are dead!");
        this.type = PlayerType.SKELETON;
        this.isDead = true;
        this.isSkeletonized = true;
        
        this.skeletonize();
        for (let i = this.inventory.length - 1; i >= 0; i--) {
            const item = this.inventory[i];
            if (item.type === ItemType.KEY) {
                // Find an adjacent, walkable tile
                const adjacentTile = this.findAdjacentWalkableTile();
                if (adjacentTile) {
                    // Drop the key on the tile
                    this.dropItemOnTile(item, adjacentTile.x, adjacentTile.y);
                }
            }
        }
    }

    getDeltaXY(direction) {
        let dx = 0, dy = 0;
        switch (direction) {
            case 'up':
                dy = -1;
                break;
            case 'down':
                dy = 1;
                break;
            case 'left':
                dx = -1;
                break;
            case 'right':
                dx = 1;
                break;
            case 'up-left':
                dy = -1;
                dx = -1;
                break;
            case 'up-right':
                dy = -1;
                dx = 1;
                break;
            case 'down-left':
                dy = 1;
                dx = -1;
                break;
            case 'down-right':
                dy = 1;
                dx = 1;
                break;
        }
        return [dx, dy];
    }

    isOutOfBounds(x, y) {
        return x < 0 || x >= MAP_WIDTH || y < 0 || y >= MAP_HEIGHT;
    }

    isWalkableTile(x, y) {
        return floorMap[y][x]?.value === 157;
    }

    isLockedDoor(door) {
        if (door && door.isLocked) {
            // Check the key in the current player's inventory
            const keyItem = this.inventory.find(item => item.type === ItemType.KEY && item.id === door.id);
            if (keyItem) {
                door.unlock();
                this.removeItem(keyItem);
                sound.play('lock');
                messageList.addMessage(`You unlocked the ${door.name} with your key.`);
                return false;
            } else {
                // Player doesn't have the right key
                messageList.addMessage(`The ${door.name} is locked.`);
                playBumpSound()
                return true;
            }
        }
        return false;
    }

    isOpenableDoor(door) {
        return door && !door.isLocked && !door.isOpen;
    }

    //fire burns etc-
    handleTileEffects(newTileX, newTileY, direction) {
        // Check if player has changed direction after fire warning
        if (this.attemptingFireEntry && this.fireEntryDirection !== direction) {
            console.log("Direction changed after fire warning");
            this.attemptingFireEntry = false;
            this.fireEntryDirection = null;
        }
    
        let atmosphereTileValue = atmosphereMap[newTileY][newTileX]?.value;
        //console.log(`Checking fire at (${newTileX}, ${newTileY}): `, atmosphereTileValue);
        let floorTileValue = floorMap[newTileY][newTileX]?.value;
        let objectTileValue = objectMap[newTileY][newTileX]?.value;
    
        // If not attempting to enter the fire, reset fire entry-related flags
        if (atmosphereTileValue !== 300) {
            this.attemptingFireEntry = false;
            this.fireEntryDirection = null;
        }
    
        if (floorTileValue === 157 && (!objectTileValue && atmosphereTileValue != 300)) {
            this.x = newTileX;
            this.y = newTileY;
        } else if (atmosphereTileValue === 300 && !this.attemptingFireEntry) {  
            this.attemptingFireEntry = true;
            this.fireEntryDirection = direction;
            this.messageList.addMessage("Walk into the fire?");
        } else if (atmosphereTileValue === 300 && this.attemptingFireEntry && this.fireEntryDirection === direction) {
            this.x = newTileX;
            this.y = newTileY;
            this.isBurning = true;
            this.burningTurns = 0;
            this.messageList.addMessage("You stepped into fire!");
            this.attemptingFireEntry = false;
            this.fireEntryDirection = null;
        }
    }
    

    updateSprites(newTileX, newTileY) {
        this.sprite.footprint.x = this.x * globalVars.TILE_WIDTH * SCALE_FACTOR;
        this.sprite.footprint.y = this.y * globalVars.TILE_HEIGHT * SCALE_FACTOR;
        this.sprite.overlay.x = this.sprite.footprint.x;
        this.sprite.overlay.y = this.sprite.footprint.y - globalVars.TILE_HEIGHT * SCALE_FACTOR;
    
        let headTileY = this.y - 1;
        let isFrontOfWall = floorMap[headTileY]?.[this.x + 1]?.value === 177 && wallMap[headTileY]?.[this.x + 1]?.value !== 131; // check the tile to the right of the head
        this.sprite.shadow.visible = isFrontOfWall;
    
        if (isFrontOfWall) {
            this.sprite.shadow.x = (this.x + 1) * globalVars.TILE_WIDTH * SCALE_FACTOR; // position shadow to the right of the head
            this.sprite.shadow.y = headTileY * globalVars.TILE_HEIGHT * SCALE_FACTOR;
        }
    
        // Handle visibility and positioning of the foot shadow
        let isBesideFloor = floorMap[this.y]?.[this.x + 1]?.value === 157 || floorMap[this.y]?.[this.x + 1]?.value === 177 && wallMap[headTileY]?.[this.x + 1]?.value !== 131 && objectMap[headTileY]?.[this.x + 1]?.value !== 300; // check the tile to the right of the footprint
        this.sprite.footShadow.visible = isBesideFloor;
    
        if (isBesideFloor) {
            this.sprite.footShadow.x = (this.x + 1) * globalVars.TILE_WIDTH * SCALE_FACTOR; // position foot shadow to the right of the footprint
            this.sprite.footShadow.y = this.y * globalVars.TILE_HEIGHT * SCALE_FACTOR;
        }
    
        // Reset opacity of sprites that were previously occluded
        if (this.prevX !== null && this.prevY !== null) { // Skip on the first move
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    let y = this.prevY + dy;
                    let x = this.prevX + dx;
                    if (wallMap[y]?.[x]?.sprite) {
                        wallMap[y][x].sprite.alpha = 1;
                    }
                    if (uiMaskMap[y]?.[x]?.sprite) {
                        uiMaskMap[y][x].sprite.alpha = 1;
                    }
                }
            }
        }
        this.prevX = this.x;
        this.prevY = this.y;
        // Occlude nearby wall and UI sprites
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                let y = this.y + dy;
                let x = this.x + dx;
                //iterate over a 3x3 block of tiles around the player
                
                if (wallMap[y]?.[x]?.sprite && floorMap[y][x].value === 157) { //check for an occluding wall with floor behind it
                    createFloor(x,y);
                    wallMap[y][x].sprite.alpha = 0.4;
                } else if (wallMap[y]?.[x]?.sprite) { //for walls with no floor underneath that could occlude the player's sprite
                    wallMap[y][x].sprite.alpha = 0.4;
                    createSprite(x, y, {x: 16, y: 5}, backgroundMap, 216);
                }
    
                if (uiMaskMap[y]?.[x]?.sprite) {
                    uiMaskMap[y][x].sprite.alpha = 0.2;
                }
            }
        }
    }

    //we don't want implicit steps to be taken instantly, we want to see them
    delayedMove(direction, delay) {
        return new Promise(resolve => {
            setTimeout(() => {
                this.move(direction);
                this.messageList.addDotToEndOfLastMessage();
                resolve();
            }, delay);
        });
    }
    //moveTo implicitly takes turns when the player clicks on a distant spot that can be walked to
    async moveTo(targetX, targetY, stopBefore = false) {
        let stuckCounter = 0;
        if (targetX === this.x && targetY === this.y) return;

        let path = [];
        let passableCallback = (x, y) => {
            let floorTileValue = floorMap[y][x]?.value;
            let objectTileValue = objectMap[y][x]?.value;
            let atmosphereTileValue = atmosphereMap[y][x]?.value;
            return floorTileValue === 157 && (!objectTileValue);
        }
        let astar = new ROT.Path.AStar(targetX, targetY, passableCallback);
        let pathCallback = (x, y) => path.push({ x, y });
        astar.compute(this.x, this.y, pathCallback);

        if (path.length === 0) {
            if (!this.zeroPlayerMode) {
                this.messageList.addMessage("You're not sure how to get there.");
            } else {
                this.failedMoveAttempts++;
                console.log(`Failed move attempts: ${this.failedMoveAttempts}`);
                if (this.failedMoveAttempts >= 3) { // If failed 3 times in zero-player mode, change page
                    window.location.href = 'patterns.html';
                }
            }
            return;
        }
        this.failedMoveAttempts = 0;
    
        for (let point of path) {
            let { x, y } = point;
            if (this.isDead) {
                break;
            }
            if (this.canSeeMonster(Monster.allMonsters)) { 
                this.messageList.addMessage("You see a monster!");
                break;
            }
            let direction;
            if (x < this.x && y < this.y) {
                direction = 'up-left';
            } else if (x > this.x && y < this.y) {
                direction = 'up-right';
            } else if (x < this.x && y > this.y) {
                direction = 'down-left';
            } else if (x > this.x && y > this.y) {
                direction = 'down-right';
            } else if (x < this.x) {
                direction = 'left';
            } else if (x > this.x) {
                direction = 'right';
            } else if (y < this.y) {
                direction = 'up';
            } else if (y > this.y) {
                direction = 'down';
            }
    
            // Save old position
            let oldX = this.x;
            let oldY = this.y;
    
            await this.delayedMove(direction, 200);  // 200ms delay
            let door = Door.allDoors.find(door => door.x === x && door.y === y && !door.isLocked);
            if (door) {
                door.open();
            }
            // After each move, check if the position has changed
            if (this.x === oldX && this.y === oldY) {
                // Increase the stuckCounter if the position hasn't changed
                stuckCounter++;
    
                // If the player hasn't moved for 3 consecutive turns, assume it's stuck
                if (stuckCounter >= 3) {
                    this.messageList.addMessage("You can't move further in this direction.");
                    break;  // Break the loop
                }
            } else {
                // Reset the stuckCounter if the player has moved
                stuckCounter = 0;
            }
    
            if (this.engine._lock) {
                this.engine.unlock();
            }
        }
    }
    removeItem(item) {
        const index = this.inventory.indexOf(item);
        if (index !== -1) {
            this.inventory.splice(index, 1);
        }
    }
    isAdjacentTo(x, y) {
        return Math.abs(this.x - x) <= 1 && Math.abs(this.y - y) <= 1;
    }

    getAdjacentPosition(targetX, targetY) {
        let diffX = targetX - this.x;
        let diffY = targetY - this.y;
    
        // Move in the opposite direction
        let newX = this.x - Math.sign(diffX);
        let newY = this.y - Math.sign(diffY);
    
        // Check for map boundaries
        newX = Math.max(0, Math.min(MAP_WIDTH - 1, newX));
        newY = Math.max(0, Math.min(MAP_HEIGHT - 1, newY));
    
        return { x: newX, y: newY };
    }
    

    handleKeydown(event) {
        if (this.isDead) return;
        resetTurnTimer();
        // If the player is in targeting mode, any keypress should cancel the targeting
        if (this.isTargeting) {
            this.isTargeting = false;
            this.messageList.addMessage("Shot cancelled.");
            this.removeTargetingSprite();
            return;
        }
        if (this.isMining) {
            const direction = this.getDirectionFromKey(event.key);
            if (direction) {
                const [dx, dy] = this.getDeltaXY(direction);
                const targetX = this.x + dx;
                const targetY = this.y + dy;
                this.performMine(targetX, targetY);
            }
            return; // Stop further processing if in mining mode
        }
        let newDirection = null;
        switch (event.key) {
            case 'ArrowUp':
            case 'Numpad8':
            case '8':
            case 'w':
                newDirection = 'up';
                break;
            case 'ArrowDown':
            case 'Numpad2':
            case '2':
            case 's':
                newDirection = 'down';
                break;
            case 'ArrowLeft':
            case 'Numpad4':
            case '4':
            case 'a':
                newDirection = 'left';
                break;
            case 'ArrowRight':
            case 'Numpad6':
            case '6':
            case 'd':
                newDirection = 'right';
                break;
            case 'Numpad7':
            case '7':
            case 'q':
                newDirection = 'up-left';
                break;
            case 'Numpad9':
            case '9':
            case 'e':
                newDirection = 'up-right';
                break;
            case 'Numpad1':
            case '1':
            case 'z':
                newDirection = 'down-left';
                break;
            case 'Numpad3':
            case '3':
            case 'c':
                newDirection = 'down-right';
                break;
            case '}':
                window.location.href = 'abyss.html';
                break;
            case '{':
                window.location.href = 'home.html';
                break;
            default:
                messageList.addMessage('Time passes.');
                break;
            case 'Escape':
                window.api.quitApp();
                break;
        }
        if (this.isClosingDoor) {
            if (newDirection) {
                this.attemptCloseDoor(newDirection);
            }
            return;
        }
        
        if (newDirection) {
            this.move(newDirection);
        }
    
        if (this.engine._lock) {
            this.engine.unlock();  // After moving, unlock the engine for the next turn
        }
        if (event.key === 'b' || event.code === 'KeyB') {
            this.handleArrowAim();
            console.log("bow attack");
        }
        if (event.key === 'x' || event.code === 'KeyX') {
            this.handleCloseDoor();
            console.log("try close door");
        }
        if (event.key === 'i' || event.code === 'KeyI') {
            messageList.hideBox(); 
            player.printStats();
            inspector.showBox();  
            inspector.render();  
        } else if (event.key !== 'i'|| event.code !== 'KeyI'){
            inspector.hideBox(); 
            messageList.showBox(); 
            messageList.render();  
        }
        if (event.key === 'm' || event.code === 'KeyM') {
            this.handleMine();
        }
        if (event.key === 'r' || event.code === 'KeyR') {
            this.die();
            if (engine._lock) {
                engine.unlock();
            }
        }
    }
    
    handleArrowAim() {
        const hasBow = this.inventory.some(item => item.type === ItemType.BOW);
        if (hasBow) {
            this.isTargeting = true;
            this.messageList.addMessage("Aim bow at?");
        } else {
            this.messageList.addMessage("You have no bow to shoot with.");
        }
    }

    removeItemOfType(itemType) {
        const index = this.inventory.findIndex(item => item.type === itemType);
        if (index !== -1) {
            this.inventory.splice(index, 1);
        }
    }

    performArrowAttack(targetX, targetY) {
        // Check if player has enough arrows
        if (this.arrows <= 0) {
            this.messageList.addMessage("You have no arrows left.");
            return;
        }
        
        // Draw a line from the player's position to the target's position
        let path = line({ x: this.x, y: this.y }, { x: targetX, y: targetY });
        
        let arrowX = this.x;
        let arrowY = this.y;
        let monsterHit = null;
        let fireHit = false;
        for (let point of path) {
            let x = point.x;
            let y = point.y;
            console.log(`Checking (${x}, ${y})` + " " + floorMap[y][x]?.value);
            // Check if there's a wall or door at this point
            /* if (floorMap[y][x]?.value !== 157 || (doorMap[y] && doorMap[y][x].value != null)) {
                break;
              } */
            if ((floorMap[y][x] && floorMap[y][x].value !== 157) || (doorMap[y] && doorMap[y][x] && doorMap[y][x].value !== null && !Door.isOpenAt(x, y))) {
                console.log("Wall or door hit! " +  floorMap[y][x]?.value + " " + doorMap[y][x]?.value);
                break;
            }
    
            // Check if there's a monster at this point
            let monster = this.findMonsterAt(x, y);  // Assuming findMonsterAt returns null if no monster is found
            if (monster) {
                monsterHit = monster;
                console.log("Monster hit!");
                inspector.hideBox(); 
                this.messageList.addMessage("You hit the " + monster.name + "!");
                monster.bleeding = true;
                arrowX = x;
                arrowY = y;
                break;
            }
            if (atmosphereMap[y] && atmosphereMap[y][x] && atmosphereMap[y][x].value === 300) {
                fireHit = true;
            }
    
            // If not, then this is the new arrow position
            arrowX = x;
            arrowY = y;
        }
        if (fireHit) {
            new Fire(arrowX, arrowY, this.scheduler, '0xFFCC33');
        }
        // Create the arrow sprite at the final position
        setTimeout(function() {
            new Item(ItemType.ARROW, arrowX, arrowY, '0xFFFFFF', 2);
            engine.unlock();
        }, 700);
    
        // Decrement player's arrows by 1
        this.arrows--;
        
        if (monsterHit) {
            // Deal damage to the monster
            monsterHit.blood -= 10;
            playArrowSound(true);
        } else {
            this.messageList.addMessage("You missed.");
            playArrowSound(false);
        } 
    }


    handleMine() {
        const hasMattock = this.inventory.some(item => item.type === ItemType.MATTOCK);
        if (hasMattock) {
           this.isMining = true;
           this.messageList.addMessage("Mine where?");
        } else {
            this.messageList.addMessage("You have no mattock to mine with.");
        }
    }

    performMine(targetX, targetY) {
        console.log("Mining at", targetX, targetY);
        if (floorMap[targetY][targetX]?.value != null) {
            if (this.isOutOfBounds(targetX, targetY)) {
                this.messageList.addMessage("You've reached the edge of the underworld.");
                return;
            }
        
            if (wallMap[targetY][targetX]?.value !== null) {
                // Remove the wall sprite
                gameContainer.removeChild(wallMap[targetY][targetX].sprite);
                if (wallMap[targetY][targetX]?.value) {
                    wallMap[targetY][targetX].value = null; // Remove wall from the map
                }
                // Create a floor at the mined location
                createRoughFloor(targetX, targetY);
                playBumpSound();
                this.messageList.addMessage("You mined the wall.");
        
                // Random chance to place Uranium
                if (Math.random() < 1/5) {
                    let uranium = new Uranium(targetX, targetY, this.scheduler, '0xADFF2F');
                    this.scheduler.add(uranium, true); // Add Uranium to the scheduler
                    this.messageList.addMessage("You found Uranium!");
                }
        
                // Chance to break the mattock
                if (Math.random() < 1/20) {
                    this.removeItemOfType(ItemType.MATTOCK);
                    this.messageList.addMessage("Your mattock broke!");
                    this.isMining = false;
                }
            } else {
                this.messageList.addMessage("There is no wall to mine.");
            }
        } else {
            this.messageList.addMessage("You can't mine here.");
        }
        this.isMining = false; // Exit mining mode regardless of outcome
    }
    
    
    
    findMonsterAt(x, y) {
        for (let monster of Monster.allMonsters) {  
            if (monster.x === x && monster.y === y) {
                return monster;
            }
        }
        return null;
    }
    
    
    displayTargetingSprite(x, y) {
        this.targetingX = x;
        this.targetingY = y;
        createSprite(x, y, {x: 12, y: 8}, overlayMap);
    }
    
    removeTargetingSprite() {
        if (this.targetingX !== null && this.targetingY !== null) {
            createSprite(this.targetingX, this.targetingY, {x: 0, y: 0}, overlayMap); // Assuming {x: 0, y: 0} is empty
            this.targetingX = null;
            this.targetingY = null;
        }
    }
    handleCloseDoor() {
        this.isClosingDoor = true;
        this.messageList.addMessage("Close which direction?");
    }

    attemptCloseDoor(direction) {
        let [dx, dy] = this.getDeltaXY(direction);
        let targetX = this.x + dx;
        let targetY = this.y + dy;
        
        if (this.isOutOfBounds(targetX, targetY)) {
            this.messageList.addMessage("No door there.");
            return;
        }

        let door = Door.totalDoors().find(door => door.x === targetX && door.y === targetY);
        if (door) {
            if (!door.isLocked && door.isOpen) {
                door.close();
                this.messageList.addMessage("You close the door.");
            } else {
                this.messageList.addMessage("No door there.");
            }
        } else {
            this.messageList.addMessage("No door there.");
        }
        this.isClosingDoor = false; // Exit closing door mode
    }

    dropItemOnTile(item, x, y) {
        // Remove the item from the player's inventory
        const index = this.inventory.indexOf(item);
        if (index > -1) {
            this.inventory.splice(index, 1);
        }
    
        // Add the item to the object map
        objectMap[y][x] = item;
    
        // Update the position of the item's sprite
        item.sprite.x = x * globalVars.TILE_WIDTH;
        item.sprite.y = y * globalVars.TILE_HEIGHT;
    }
    findAdjacentWalkableTile() {
        // Define the coordinates for the adjacent tiles
        const adjacentCoords = [
            {x: this.x, y: this.y - 1}, // Up
            {x: this.x, y: this.y + 1}, // Down
            {x: this.x - 1, y: this.y}, // Left
            {x: this.x + 1, y: this.y}, // Right
        ];
    
        // Iterate over the coordinates
        for (const coord of adjacentCoords) {
            // Check if the coordinate is within the map bounds
            if (coord.x >= 0 && coord.x < MAP_WIDTH && coord.y >= 0 && coord.y < MAP_HEIGHT) {
                // Check if the tile at the coordinate is walkable
                if (floorMap[coord.y][coord.x].value === 157) {
                    // Return the coordinate
                    return coord;
                }
            }
        }
    
        // No walkable tile found
        return null;
    }
    applyDamageEffects() {
        if (this.isBurning) {
            this.blood -= 20;
            sound.play('ouch');
            this.burningTurns++;
            this.messageList.addMessage("You are on fire!");
            
            // Increase chance of burning ending after 4 turns, with a guarantee to stop after 6 turns
            if (this.burningTurns > 3 || (this.burningTurns > 3 && Math.random() < 0.5) || this.burningTurns > 5 && atmosphereMap[this.y][this.x].value != 300) {
                this.isBurning = false;
                this.messageList.addMessage("You are no longer on fire.");
            }
            if (Math.random() < 0.7) {
                let newY = this.y - 1; // the tile above the current one
                if (newY >= 0 && floorMap[newY][this.x].value !== 177 && atmosphereMap[newY][this.x] === null) {
                    let smoke = new Smoke(this.x, newY, this.scheduler);
                    this.scheduler.add(smoke, true);
                }
            }
        }
        if (atmosphereMap[this.y][this.x] == 400 && Math.random() < 0.7 && !this.isDead){
            this.messageList.addMessage("You cough through the thick smoke.");
            this.blood --;
        }
        if (this.blood < 1 && this.blood > -100 && this.isSkeletonized == false) {
            this.die();
        }
        // Check if player is REALLY dead
        if (this.blood <=-100 && this.isSkeletonized == true) {
            this.type = PlayerType.PILE;
            this.isDead = true;
            this.incinerate();
        }
        if (this.blood < -300) {
            window.location.href = 'abyss.html';
        }
    }
    skeletonize() {
        let baseTexture = PIXI.BaseTexture.from(PIXI.Loader.shared.resources.tiles.url);
        
        // Use player type to decide on sprites.
        let footprintPosition, headPosition;
        switch(this.type) {
            // Add your other cases here.
            case PlayerType.SKELETON:
                footprintPosition = {x: 8, y: 7};
                headPosition = {x: 9, y: 7}; 
                break;
            default:
                footprintPosition = {x: 10, y: 5};
                headPosition = {x: 1, y: 0};
                break;
        }
        let footprintTexture = new PIXI.Texture(baseTexture, new PIXI.Rectangle(
            footprintPosition.x * globalVars.TILE_WIDTH, 
            footprintPosition.y * globalVars.TILE_HEIGHT, 
            globalVars.TILE_WIDTH, globalVars.TILE_HEIGHT));
        let overlayTexture = new PIXI.Texture(baseTexture, new PIXI.Rectangle(
            headPosition.x * globalVars.TILE_WIDTH, 
            headPosition.y * globalVars.TILE_HEIGHT, 
            globalVars.TILE_WIDTH, globalVars.TILE_HEIGHT));
    
        this.sprite.footprint.texture = footprintTexture;
        this.sprite.overlay.texture = overlayTexture;
    };
    incinerate() {
        let baseTexture = PIXI.BaseTexture.from(PIXI.Loader.shared.resources.tiles.url);
        
        // Use player type to decide on sprites.
        let footprintPosition, headPosition;
        switch(this.type) {
            // Add your other cases here.
            case PlayerType.PILE:
                footprintPosition = {x: 7, y: 1};
                headPosition = {x: 0, y: 0}; 
                break;
            default:
                footprintPosition = {x: 10, y: 5};
                headPosition = {x: 1, y: 0};
                break;
        }
        let footprintTexture = new PIXI.Texture(baseTexture, new PIXI.Rectangle(
            footprintPosition.x * globalVars.TILE_WIDTH, 
            footprintPosition.y * globalVars.TILE_HEIGHT, 
            globalVars.TILE_WIDTH, globalVars.TILE_HEIGHT));
        let overlayTexture = new PIXI.Texture(baseTexture, new PIXI.Rectangle(
            headPosition.x * globalVars.TILE_WIDTH, 
            headPosition.y * globalVars.TILE_HEIGHT, 
            globalVars.TILE_WIDTH, globalVars.TILE_HEIGHT));
    
        this.sprite.footprint.texture = footprintTexture;
        this.sprite.overlay.texture = overlayTexture;
    };
    printStats() {
        this.inspector.clearMessages();
        this.inspector.addMessage( "Name: " + this.name);
        this.inspector.addMessage( "Blood: " + this.blood);
        // Print inventory items
        if (this.inventory.length === 0) {
            this.inspector.addMessage("Inventory: Empty");
        } else {
            this.inspector.addMessage("Inventory:");
            for (let item of this.inventory) {
                this.inspector.addMessage("- " + item.name);
            }
        }
        this.inspector.addMessage( "Arrows: " + this.arrows);
        this.inspector.addMessage( "Flowers: " + this.flowers);
        this.inspector.addMessage( "" );
        this.inspector.addMessage( "Controls: ");
        this.inspector.addMessage( "   Arrow keys/WASD: Move");
        this.inspector.addMessage( "   B: Aim bow");
        this.inspector.addMessage( "   X: Close door");
        this.inspector.addMessage( "   M: Mine");
        this.inspector.addMessage( "   I: Character Info");
        this.inspector.addMessage( "   R: Suicide");
    }

    getDirectionFromKey(key) {
        switch (key) {
            case 'ArrowUp': case 'Numpad8': case '8': case 'w': return 'up';
            case 'ArrowDown': case 'Numpad2': case '2': case 's': return 'down';
            case 'ArrowLeft': case 'Numpad4': case '4': case 'a': return 'left';
            case 'ArrowRight': case 'Numpad6': case '6': case 'd': return 'right';
            default: return null;
        }
    }
    act() {
        this.engine.lock(); // Lock the engine until we get a valid move
        this.applyDamageEffects();
        checkGameState();
        
    }
    
}

function createPlayerSprite(player) {
    players.push(player);
    let baseTexture = PIXI.BaseTexture.from(PIXI.Loader.shared.resources.tiles.url);
    let footprintTexture = new PIXI.Texture(baseTexture, new PIXI.Rectangle(
        player.footprintPosition.x * globalVars.TILE_WIDTH, 
        player.footprintPosition.y * globalVars.TILE_HEIGHT, 
        globalVars.TILE_WIDTH, globalVars.TILE_HEIGHT));
    let spriteFootprint = new PIXI.Sprite(footprintTexture);
    spriteFootprint.scale.set(SCALE_FACTOR);
    spriteFootprint.zIndex = 2.3;

    let overlayTexture = new PIXI.Texture(baseTexture, new PIXI.Rectangle(
        player.headPosition.x * globalVars.TILE_WIDTH, 
        player.headPosition.y * globalVars.TILE_HEIGHT, 
        globalVars.TILE_WIDTH, globalVars.TILE_HEIGHT));
    let spriteOverlay = new PIXI.Sprite(overlayTexture);
    spriteOverlay.scale.set(SCALE_FACTOR);
    spriteOverlay.zIndex = 2.3;

    spriteFootprint.x = player.x * globalVars.TILE_WIDTH * SCALE_FACTOR;
    spriteFootprint.y = player.y * globalVars.TILE_HEIGHT * SCALE_FACTOR;
    spriteOverlay.x = spriteFootprint.x;
    spriteOverlay.y = spriteFootprint.y - globalVars.TILE_HEIGHT * SCALE_FACTOR;

    gameContainer.addChild(spriteFootprint);
    gameContainer.addChild(spriteOverlay);
    
    spriteFootprint.interactive = true;  // Make the footprint sprite respond to interactivity
    spriteFootprint.on('mouseover', () => {
        messageList.hideBox(); 
        player.printStats();
        inspector.showBox();  
        inspector.render();  
    });

    spriteOverlay.interactive = true;  
    spriteOverlay.on('mouseover', () => {
        messageList.hideBox();  
        player.printStats();
        inspector.showBox();  
        inspector.render();  
    });
    spriteFootprint.on('mouseout', () => {
        inspector.hideBox();
        messageList.showBox();
    });
    
    spriteOverlay.on('mouseout', () => {
        inspector.hideBox();
        messageList.showBox();
    });
    player.sprite = { footprint: spriteFootprint, overlay: spriteOverlay };
    let shadowTexture = new PIXI.Texture(baseTexture, new PIXI.Rectangle(
        player.headShadowTile.x * globalVars.TILE_WIDTH, 
        player.headShadowTile.y * globalVars.TILE_HEIGHT, 
        globalVars.TILE_WIDTH, globalVars.TILE_HEIGHT));
    let spriteShadow = new PIXI.Sprite(shadowTexture);
    spriteShadow.scale.set(SCALE_FACTOR);
    spriteShadow.zIndex = 6; // Set zIndex to show it in front of all other tiles
    spriteShadow.visible = false;
    
    let footShadowTexture = new PIXI.Texture(baseTexture, new PIXI.Rectangle(
        player.footShadowTile.x * globalVars.TILE_WIDTH, 
        player.footShadowTile.y * globalVars.TILE_HEIGHT, 
        globalVars.TILE_WIDTH, globalVars.TILE_HEIGHT));
    let spriteFootShadow = new PIXI.Sprite(footShadowTexture);
    spriteFootShadow.scale.set(SCALE_FACTOR);
    spriteFootShadow.zIndex = 3; // Set zIndex to show it in front of the footprint but behind the shadow
    spriteFootShadow.visible = false;

    gameContainer.addChild(spriteFootShadow);

    player.sprite.footShadow = spriteFootShadow;

    gameContainer.addChild(spriteShadow);
    
    player.sprite.shadow= spriteShadow;

}

async function moveToNearestItem(player) {
    if (engine._lock) {
        engine.unlock();
    }
    let nearestItem = findNearestItem(player.x, player.y);
    let nearestMonster = findNearestMonster(player);

    // Prioritize moving away from monsters if one is adjacent
    if (nearestMonster && player.isAdjacentTo(nearestMonster.x, nearestMonster.y)) {
        let escapeTile = player.getAdjacentPosition(nearestMonster.x, nearestMonster.y);
        console.log(`Zero-player mode: Escaping from monster at ${nearestMonster.x}, ${nearestMonster.y}`);
        await player.moveTo(escapeTile.x, escapeTile.y);
    } else if (nearestItem) {
        console.log(`Zero-player mode: Moving towards item at ${nearestItem.x}, ${nearestItem.y}`);
        await player.moveTo(nearestItem.x, nearestItem.y);
    } else {
        console.log("No items or immediate threats detected.");
        player.failedMoveAttempts++;
        if (player.failedMoveAttempts >= 3) {
            console.log("No movement possible, redirecting...");
            window.location.href = 'knit.html'; 
        }
    }
    player.inactiveTurns = 0; // Reset the counter after attempting to move
}

function findNearestMonster(player) {
    let nearest = null;
    let minDist = Infinity;
    for (let monster of Monster.allMonsters) {
        let dist = Math.sqrt(Math.pow(monster.x - player.x, 2) + Math.pow(monster.y - player.y, 2));
        if (dist < minDist) {
            nearest = monster;
            minDist = dist;
        }
    }
    return nearest;
}

function findNearestItem(px, py) {
    let nearest = null;
    let minDist = Infinity;
    activeItems.forEach(item => {
        let dist = Math.abs(item.x - px) + Math.abs(item.y - py);
        if (dist < minDist) {
            nearest = item;
            minDist = dist;
        }
    });
    return nearest;
}

const MonsterType = Object.freeze({
    "BASILISK": 0,
    "CHIMERA": 1,
    "SKELETON": 2,
});


const Attacks = {
    FIREBREATH: function(monster, target) {
        target.isBurning = true;
        let fireTilesCount = Math.floor(Math.random() * 4) + 2; // 2 to 5 fire tiles
        let fire1 = new Fire(target.x, target.y, monster.scheduler, '0xFF0000');//one fire directly on the player
        monster.scheduler.add(fire1, true);
        while (fireTilesCount-- > 0) {
            let dx = Math.floor(Math.random() * 7) - 3; // -3 to 3
            let dy = Math.floor(Math.random() * 7) - 3; // -3 to 3
            let newX = target.x + dx;
            let newY = target.y + dy;
            if (newX >= 0 && newY >= 0 && newX < MAP_WIDTH && newY < MAP_HEIGHT && floorMap[newY][newX].value === 157) {
                let fire = new Fire(newX, newY, monster.scheduler, '0xFF0000');
                monster.scheduler.add(fire, true);
            }
        }
        sound.play('fireball');
        messageList.addMessage("The {0} breathes flames!", [monster.name]);
    },
    CLAW: function(monster, target) {
        if (monster.isAdjacent(target) && target.isDead == false) {
            messageList.addMessage(`The ${monster.name} claws at you!`);
            if (target.isDead == false){
                sound.play('ouch');
            } else {
                playBumpSound();
            }
            
            target.takeDamage(5);
        }
    }
    // Add other attacks here
}

class Monster extends Actor{
    static allMonsters = [];
    constructor(type, x, y, scheduler, engine, messageList, inspector) {
        super(type, x, y, scheduler, engine, messageList, inspector);
        this.name = "beast";
        //console.log("ROAR");
        this.upright = true;
        this.prevX = null;
        this.prevY = null;
        this.firstTilePosition = { x: 0, y: 0 };  // Default values
        this.secondTilePosition = { x: 0, y: 0 };
        this.secondShadowTile = {x: 14, y: 9};
        this.firstShadowTile = {x: 8, y: 6};
        this.sprite.shadow = null;
        this.firstShadowTile.zIndex = 1.5;
        this.scheduler = scheduler;
        this.engine = engine;
        this.messageList = messageList;
        this.inspector = inspector;
        this.inventory = [];
        this.blood = 100;
        this.isBurning = false;
        this.isSleeping = false;
        this.sighted = false;
        this.burningTurns = 0;
        this.speed = 1;
        this.actFrequency = 1;
        this.bleeding = false;
        this.name = ""; // To be set by a monster-specific code.
        this.description = ""; // To be set by a monster-specific code.
        // An array of attacks a monster can perform. Can be set by a monster-specific code.
        this.attacks = []; 
        this.spriteFlip = {
            firstTile: {x: false, y: false},
            secondTile: {x: false, y: false}
        };
        this.getTargetsInRange = function() {
            //console.log("Checking for targets in range...");
            if (players.length > 0) {
                for(let obj of players) { 
                    if(obj.isDead === false) {
                        let dx = this.x - obj.x;
                        let dy = this.y - obj.y;
                        let distance = Math.sqrt(dx * dx + dy * dy);
        
                        //console.log(`Checking player at (${obj.x}, ${obj.y}), Distance: ${distance}`);
        
                        if(Math.floor(distance) <= this.range) { // Use floor or a similar approach
                            //console.log("Target within range found:", obj);
                            this.target = obj;
                            break;
                        }
                    }
                }
            } else {
                console.log("No players available.");
                this.target = null;
            }
        }
        this.canSeeTarget = function(target) {
            let lineToTarget = line({x: this.x, y: this.y}, {x: target.x, y: target.y});
            let seen = true;
            for(let point of lineToTarget) {
                let x = point.x;
                let y = point.y;
                // If there's a wall or any other blocking entity, the monster can't see the target
                if (floorMap[y][x].value !== 157 || (doorMap[y] && doorMap[y][x].value != null)) {
                    seen = false;
                }
            }
            return seen;
        }
        this.getAdjacentTiles = function() {
            let adjacentTiles = [];
            for(let dx = -1; dx <= 1; dx++) {
                for(let dy = -1; dy <= 1; dy++) {
                    if(dx === 0 && dy === 0) continue;
                    let newX = this.x + dx;
                    let newY = this.y + dy;
                    if(newX >= 0 && newY >= 0 && newX < MAP_WIDTH && newY < MAP_HEIGHT && floorMap[newY][newX].value === 157) {
                        adjacentTiles.push({x: newX, y: newY});
                    }
                }
            }
            return adjacentTiles;
        };
        this.moveRandomly = function() {
            let attempts = 3;  // Number of attempts to find an unblocked tile
            let moved = false;
        
            while (attempts-- > 0 && !moved) {
                let adjacentTiles = this.getAdjacentTiles();
        
                // Filter out tiles that have a locked door or are blocked.
                adjacentTiles = adjacentTiles.filter(tile => {
                    let door = Door.totalDoors().find(door => door.x === tile.x && door.y === tile.y);
                    return !door || !this.isLockedDoor(door); // Allow open doors or tiles without doors
                }).filter(tile => !this.isBlocked(tile.x, tile.y)); // Ensure the tile is not blocked
        
                if (adjacentTiles.length > 0) {
                    let randomTile = adjacentTiles[Math.floor(Math.random() * adjacentTiles.length)];
                    this.x = randomTile.x;
                    this.y = randomTile.y;
        
                    // Open any unlocked door on the tile.
                    let doorOnTile = Door.totalDoors().find(door => door.x === this.x && door.y === this.y);
                    if (doorOnTile && !doorOnTile.isLocked && !doorOnTile.isOpen) {
                        doorOnTile.open();
                        this.messageList.addMessage("You hear a crashing noise.");
                    }
        
                    this.updateSpritePosition();
                    this.checkForItems(this.x, this.y);
                    moved = true; // Mark as moved
                    this.handleTileEffects(this.x, this.y);
                }
            }
        
            if (!moved) {
                console.log("Skeleton couldn't find an unblocked path to move randomly.");
            }
        };
        this.moveRandomlyAndMine = function() {
            let moved = false;
        
            while (!moved) {
                let adjacentTiles = this.getAdjacentTiles();
        
                // Filter out tiles that have a locked door or are blocked.
                adjacentTiles = adjacentTiles.filter(tile => {
                    let door = Door.totalDoors().find(door => door.x === tile.x && door.y === tile.y);
                    return !door || !this.isLockedDoor(door); // Allow open doors or tiles without doors
                }).filter(tile => !this.isBlocked(tile.x, tile.y)); // Ensure the tile is not blocked
        
                if (adjacentTiles.length > 0) {
                    let randomTile = adjacentTiles[Math.floor(Math.random() * adjacentTiles.length)];
                    this.x = randomTile.x;
                    this.y = randomTile.y;
        
                    // Open any unlocked door on the tile.
                    let doorOnTile = Door.totalDoors().find(door => door.x === this.x && door.y === this.y);
                    if (doorOnTile && !doorOnTile.isLocked && !doorOnTile.isOpen) {
                        doorOnTile.open();
                        this.messageList.addMessage("You hear a crashing noise.");
                    }
        
                    this.updateSpritePosition();
                    this.checkForItems(this.x, this.y);
                    moved = true; // Mark as moved
        
                    this.handleTileEffects(this.x, this.y);
        
                    // After moving, attempt to mine adjacent walls
                    let directions = ['up', 'down', 'left', 'right'];
                    for (let direction of directions) {
                        let [dx, dy] = this.getDeltaXY(direction);
                        let targetX = this.x + dx;
                        let targetY = this.y + dy;
                        if (!this.isOutOfBounds(targetX, targetY) && wallMap[targetY][targetX]?.value !== null && backgroundMap[targetY][targetX]?.value !== 216) {
                            // Remove the wall sprite
                            gameContainer.removeChild(wallMap[targetY][targetX].sprite);
                            if (wallMap[targetY][targetX]?.value) {
                                wallMap[targetY][targetX].value = null; // Remove wall from the map
                            }
                            // Create a floor at the mined location
                            createRoughFloor(targetX, targetY);
        
                            this.messageList.addMessage("A " + this.name + " chisels away at a wall.");
                            playBumpSound();
        
                            // Random chance to place Uranium
                            if (Math.random() < 1/8) {
                                let uranium = new Uranium(targetX, targetY, this.scheduler, '0xADFF2F');
                                this.scheduler.add(uranium, true); // Add Uranium to the scheduler
                                this.messageList.addMessage("The robot found Uranium!");
                            }
        
                            break; // Break after one successful mine action
                        } else {
                            playBumpSound();
                        }
                    }
                } else {
                    console.log(this.name + " couldn't find an unblocked path to move randomly.");
                    moved = true; // Exit loop if no move is possible
                }
            }
        };
        
        
        
        switch(type) {
            case MonsterType.BASILISK:
                this.name = "Basilisk";
                this.upright = true;
                this.firstTilePosition = {x: 10, y: 7};
                this.secondTilePosition = {x: 21, y: 6};
                this.attacks = ["FIREBREATH"];
                this.target = null;
                this.bloodColor = '0xFF0000';
                this.isFlammable = false;
                this.range = 5;
                this.speed = 1; // Number of tiles to move in a turn
                this.actFrequency = 2; // Number of turns to wait between actions
                this.turnsWaited = 0; // Number of turns waited since last action
                this.act = function() {
                    console.log("Basilisk's turn");
                
                    if (this.bleeding) {
                        if (Math.random() < 0.7) {
                            dripBlood(this.x, this.y, this.bloodColor);
                        }
                    }
                
                    this.getTargetsInRange();
                    //console.log("Target acquired:", this.target);
                
                    if(this.target) {
                        if (this.canSeeTarget(this.target)) {
                            //console.log("The Basilisk sees the target.");
                            this.sighted = true;
                            for (let attackKey of this.attacks) {
                                Attacks[attackKey](this, this.target);
                            }
                        } else {
                            //console.log("The Basilisk cannot see the target.");
                            this.sighted = false;
                        }
                        this.target = null;
                    }
                
                    if (this.sighted) {
                        //console.log("Following the target.");
                        this.followTarget();
                    } else if(this.turnsWaited >= this.actFrequency) {
                        //console.log("Moving randomly.");
                        for(let i = 0; i < this.speed; i++) {
                            this.moveRandomly();
                        }
                        this.turnsWaited = 0;
                    } else {
                        //console.log("Waiting...");
                        this.turnsWaited++;
                    }
                };
                
                break;
            case MonsterType.CHIMERA:
                    this.name = "Chimera";
                    this.upright = Math.random() > 0.5;
                    this.firstTilePosition = {
                        x: Math.floor(Math.random() * 23), 
                        y: Math.floor(Math.random() * 11)
                    };
                    this.secondTilePosition = {
                        x: Math.floor(Math.random() * 23), 
                        y: Math.floor(Math.random() * 11)
                    };
                    
                    this.spriteFlip = {
                        firstTile: {
                            x: Math.random() > 0.5, 
                            y: Math.random() > 0.5
                        }, 
                        secondTile: {
                            x: Math.random() > 0.5, 
                            y: Math.random() > 0.5
                        }
                    };
                    break;
            case MonsterType.SKELETON:
                this.name = "Skeleton";
                this.upright = true;
                this.attacks = ["CLAW"];
                this.speed = 1;
                this.actFrequency = 2;
                this.isFlammable = true;
                this.firstTilePosition = {x: 8, y: 7};
                this.secondTilePosition = {x: 9, y: 7};
                this.act = function() {
                    console.log("Skeleton's turn");
        
                    // Check for player visibility and proximity
                    let target = this.findClosestPlayer();
                    if (target && this.canSeeTarget(target)) {
                        this.sighted = true;
                        this.target = target;
                    }
        
                    if (this.sighted && this.target) {
                        if (this.isAdjacent(this.target)) {
                            Attacks.CLAW(this, this.target);
                        } else {
                            this.followTarget();
                        }
                    } else {
                        this.moveRandomly();
                    }
                };
                break;
                case MonsterType.ROBOT:
                    this.name = "Robot";
                    this.upright = true;
                    this.isFlammable = false;
                    this.firstTilePosition = {x: 10, y: 5};
                    this.secondTilePosition = {x: 13, y: 6};
                    this.act = function() {
                        this.moveRandomlyAndMine();
                    };
                    break;
     
            default:
                this.name = monster;
                this.upright = true;
                this.firstTilePosition = {x: 8, y: 7};
                this.secondTilePosition = {x: 9, y: 7};
                break;
        }

        this.updateSpritePosition = function() {
            if (this.sprite.firstTile && this.sprite.secondTile) {
                this.sprite.firstTile.x = this.x * globalVars.TILE_WIDTH * SCALE_FACTOR;
                this.sprite.firstTile.y = this.y * globalVars.TILE_HEIGHT * SCALE_FACTOR;
        
                if (this.upright) {
                    this.sprite.secondTile.x = this.sprite.firstTile.x;
                    this.sprite.secondTile.y = this.sprite.firstTile.y - globalVars.TILE_HEIGHT * SCALE_FACTOR;
                } else {
                    this.sprite.secondTile.x = this.sprite.firstTile.x + globalVars.TILE_WIDTH * SCALE_FACTOR;
                    this.sprite.secondTile.y = this.sprite.firstTile.y;
                }
        
                if(this.sprite.firstShadow && this.sprite.secondShadow){
                    this.sprite.firstShadow.x = this.sprite.firstTile.x;
                    this.sprite.firstShadow.y = this.sprite.firstTile.y;
        
                    this.sprite.secondShadow.x = this.sprite.secondTile.x;
                    this.sprite.secondShadow.y = this.sprite.secondTile.y;
                }
            }
        }

        Monster.allMonsters.push(this);
        
    }
    isAdjacent(target) {
        let dx = Math.abs(this.x - target.x);
        let dy = Math.abs(this.y - target.y);
        return (dx <= 1 && dy <= 1 && dx + dy > 0);
    }
    isBlocked(x, y) {
        if (this.isOutOfBounds(x, y)) {
            return true; // Boundary check
        }
        if (!this.isWalkableTile(x, y)) {
            return true; // Walkability check
        }
        let door = Door.totalDoors().find(d => d.x === x && d.y === y);
        if (door && this.isLockedDoor(door)) {
            return true; // Check for locked doors
        }
        return false; // Tile is not blocked
    }
    isValidMove(x, y) {
        return !this.isBlocked(x, y);
    }
    takeDamage(amount) {
        this.blood -= amount;
        if (this.blood <= 0) {
            this.die();
        }
    }
    followTarget = function() {
        if (!this.target) {
            return;
        }
    
        // Calculate direction towards the target
        let dx = this.target.x - this.x;
        let dy = this.target.y - this.y;
        let distance = Math.sqrt(dx * dx + dy * dy);
    
        // Check if the target is adjacent (no need for normalization in this case)
        if (distance <= 1) {
            // Adjust dx and dy for adjacent movement
            dx = (dx !== 0) ? Math.sign(dx) : 0;
            dy = (dy !== 0) ? Math.sign(dy) : 0;
        } else {
            // Normalize direction for non-adjacent movement
            dx = Math.round(dx / distance);
            dy = Math.round(dy / distance);
        }
    
        // Check if the next position is valid (e.g., no walls or obstacles)
        let nextX = this.x + dx;
        let nextY = this.y + dy;
    
        if (this.isValidMove(nextX, nextY)) {
            // Move towards the target
            this.x = nextX;
            this.y = nextY;
            this.handleTileEffects(this.x, this.y);
            this.updateSpritePosition();
        } else {
            // If the target is blocked, move randomly
            this.moveRandomly();
        }
    };
    isOutOfBounds(x, y) {
        return x < 0 || y < 0 || x >= MAP_WIDTH || y >= MAP_HEIGHT;
    }
    getDeltaXY(direction) {
        let dx = 0, dy = 0;
        switch (direction) {
            case 'up': dy = -1; break;
            case 'down': dy = 1; break;
            case 'left': dx = -1; break;
            case 'right': dx = 1; break;
        }
        return [dx, dy];
    }
    isWalkableTile(x, y) {
        // Assuming floorMap is a globally accessible structure
        return floorMap[y][x].value === 157; // Only floor tiles are walkable
    }
    isLockedDoor(door) {
        return door && door.isLocked;
    }
    
    die() {
        console.log("Monster "+ this.name + " died!");
        this.isDead = true;
        this.sprite.firstTile.visible = false;
        this.sprite.secondTile.visible = false;
        if (this.sprite.firstShadow) this.sprite.firstShadow.visible = false;
        if (this.sprite.secondShadow) this.sprite.secondShadow.visible = false;
        const index = Monster.allMonsters.indexOf(this);
        if (index > -1) {
            Monster.allMonsters.splice(index, 1);
        }
        // remove the monster from the turn engine
        this.scheduler.remove(this);
        this.engine._lock();  // This ensures the current turn completes before the monster is removed
    }
    move(direction) {
        let [dx, dy] = this.getDeltaXY(direction);
        let [newTileX, newTileY] = [this.x + dx, this.y + dy];

        if (this.isValidMove(newTileX, newTileY)) {
            this.x = newTileX;
            this.y = newTileY;
            this.handleTileEffects(newTileX, newTileY);
            this.updateSpritePosition();

            let door = Door.totalDoors().find(d => d.x === newTileX && d.y === newTileY);
            if (door && !door.isLocked && !door.isOpen) {
                door.open(); // Automatically open unlocked doors
            }
            this.handleTileEffects(this.x, this.y);
        }
    }
    handleTileEffects(newTileX, newTileY) {
        let atmosphereTileValue = atmosphereMap[newTileY][newTileX]?.value;

        // Check for fire tile
        if (atmosphereTileValue === 300) {  // Assuming 300 represents fire tiles
            if (this.isFlammable && !this.isBurning) {
                this.isBurning = true;
                this.burningTurns = 0;
                this.messageList.addMessage(`${this.name} stepped into fire!`);
                this.takeDamage(10);
            }
        }
    }

    applyDamageEffects() {
        console.log("tried applying damage to monster " + this.name);
        if (this.isBurning) {
            this.blood -= 20;  // Or whatever damage value is appropriate
            this.burningTurns++;
            this.messageList.addMessage(`${this.name} is on fire!`);

            if (this.burningTurns > 3 || (this.burningTurns > 3 && Math.random() < 0.5) || this.burningTurns > 5 && atmosphereMap[this.y][this.x].value != 300) {
                this.isBurning = false;
                this.messageList.addMessage(`${this.name} is no longer on fire.`);
            }
        }
    }
    printStats() {
        this.inspector.clearMessages();
        this.inspector.addMessage( "Name: " + this.name);
        this.inspector.addMessage( "Blood: " + this.blood);
    }
    
    act() {
        if (this.bleeding && Math.random() < 0.7) {
            dripBlood(this.x, this.y, this.bloodColor);
        }
        this.getTargetsInRange();
    
        if (this.target) {
            if (this.canSeeTarget(this.target)) {
                this.sighted = true;
                for (let attackKey of this.attacks) {
                    Attacks[attackKey](this, this.target);
                }
            } else {
                this.sighted = false;
            }
            this.target = null;
        }
    
        if (this.sighted) {
            this.followTarget();
        } else if (this.turnsWaited >= this.actFrequency) {
            for (let i = 0; i < this.speed; i++) {
                this.moveRandomly();
            }
            this.turnsWaited = 0;
        } else {
            this.turnsWaited++;
        }
    
        this.applyDamageEffects(); // Apply effects like burning from fire tiles
        this.engine.unlock(); // Unlock the engine after actions
    }
    
}

Monster.prototype.findClosestPlayer = function() {
    let closest = null;
    let minDistance = Infinity;
    players.forEach(player => {
        if (!player.isDead) {
            let distance = Math.sqrt(Math.pow(player.x - this.x, 2) + Math.pow(player.y - this.y, 2));
            if (distance < minDistance) {
                minDistance = distance;
                closest = player;
            }
        }
    });
    return closest;
};

// Ensure Monster can see the target through direct line of sight
Monster.prototype.canSeeTarget = function(target) {
    // Assume line of sight checking function exists; you may need to implement this based on your game's logic
    return true; // Simplified for example
};

function createMonsterSprite(monster) {
    activeEntities.push(this);
    let baseTexture = PIXI.BaseTexture.from(PIXI.Loader.shared.resources.tiles.url);
    let firstTileTexture = new PIXI.Texture(baseTexture, new PIXI.Rectangle(
        monster.firstTilePosition.x * globalVars.TILE_WIDTH, 
        monster.firstTilePosition.y * globalVars.TILE_HEIGHT, 
        globalVars.TILE_WIDTH, globalVars.TILE_HEIGHT));
    let spriteFirstTile = new PIXI.Sprite(firstTileTexture);
    spriteFirstTile.scale.set(SCALE_FACTOR);
    spriteFirstTile.zIndex = 2;

    let secondTileTexture = new PIXI.Texture(baseTexture, new PIXI.Rectangle(
        monster.secondTilePosition.x * globalVars.TILE_WIDTH, 
        monster.secondTilePosition.y * globalVars.TILE_HEIGHT, 
        globalVars.TILE_WIDTH, globalVars.TILE_HEIGHT));
    let spriteSecondTile = new PIXI.Sprite(secondTileTexture);
    spriteSecondTile.scale.set(SCALE_FACTOR);
    spriteSecondTile.zIndex = 1;

    spriteFirstTile.x = monster.x * globalVars.TILE_WIDTH * SCALE_FACTOR;
    spriteFirstTile.y = monster.y * globalVars.TILE_HEIGHT * SCALE_FACTOR;
    if (monster.spriteFlip.firstTile.x) {
        spriteFirstTile.scale.x *= -1; // Flip horizontally
        spriteFirstTile.x += globalVars.TILE_WIDTH * SCALE_FACTOR;
    }
    if (monster.spriteFlip.firstTile.y) {
        spriteFirstTile.scale.y *= -1; // Flip vertically
        spriteFirstTile.y += globalVars.TILE_HEIGHT * SCALE_FACTOR;
    }
    if (monster.spriteFlip.secondTile.x) {
        spriteSecondTile.scale.x *= -1; // Flip horizontally
        spriteSecondTile.x += globalVars.TILE_WIDTH * SCALE_FACTOR;
    }
    if (monster.spriteFlip.secondTile.y) {
        spriteSecondTile.scale.y *= -1; // Flip vertically
        spriteSecondTile.y += globalVars.TILE_HEIGHT * SCALE_FACTOR;
    }
    if (monster.upright) {
        spriteSecondTile.x = spriteFirstTile.x;
        spriteSecondTile.y = spriteFirstTile.y - globalVars.TILE_HEIGHT * SCALE_FACTOR;
    } else {
        spriteSecondTile.x = spriteFirstTile.x + globalVars.TILE_WIDTH * SCALE_FACTOR;
        spriteSecondTile.y = spriteFirstTile.y;
    }
    if (monster.spriteFlip.firstTile.x) {
        spriteFirstTile.scale.x *= -1; // Flip horizontally
    }
    if (monster.spriteFlip.firstTile.y) {
        spriteFirstTile.scale.y *= -1; // Flip vertically
    }
    if (monster.spriteFlip.secondTile.x) {
        spriteSecondTile.scale.x *= -1; // Flip horizontally
    }
    if (monster.spriteFlip.secondTile.y) {
        spriteSecondTile.scale.y *= -1; // Flip vertically
    }
    gameContainer.addChild(spriteFirstTile);
    gameContainer.addChild(spriteSecondTile);

    monster.sprite = { firstTile: spriteFirstTile, secondTile: spriteSecondTile };
    let firstShadowTexture = new PIXI.Texture(baseTexture, new PIXI.Rectangle(
        monster.firstShadowTile.x * globalVars.TILE_WIDTH, 
        monster.firstShadowTile.y * globalVars.TILE_HEIGHT, 
        globalVars.TILE_WIDTH, globalVars.TILE_HEIGHT));
    let spriteFirstShadow = new PIXI.Sprite(firstShadowTexture);
    spriteFirstShadow.scale.set(SCALE_FACTOR);
    spriteFirstShadow.zIndex = 6; // Set zIndex to show it in front of all other tiles
    spriteFirstShadow.visible = false;

    let secondShadowTexture = new PIXI.Texture(baseTexture, new PIXI.Rectangle(
        monster.secondShadowTile.x * globalVars.TILE_WIDTH, 
        monster.secondShadowTile.y * globalVars.TILE_HEIGHT, 
        globalVars.TILE_WIDTH, globalVars.TILE_HEIGHT));
    let spriteSecondShadow = new PIXI.Sprite(secondShadowTexture);
    spriteSecondShadow.scale.set(SCALE_FACTOR);
    spriteSecondShadow.zIndex = 3; // Set zIndex to show it in front of the footprint but behind the wall
    spriteSecondShadow.visible = false;

    gameContainer.addChild(spriteFirstShadow);
    gameContainer.addChild(spriteSecondShadow);

    monster.sprite.firstShadow = spriteFirstShadow;
    monster.sprite.secondShadow = spriteSecondShadow;
    spriteFirstTile.interactive = true;  // Make the sprite respond to interactivity
    spriteFirstTile.on('mouseover', () => {
        messageList.hideBox();  
        monster.printStats();  // Ensure there's a printStats method for Monster
        inspector.showBox();  
        inspector.render();  
    });

    spriteSecondTile.interactive = true;  
    spriteSecondTile.on('mouseover', () => {
        messageList.hideBox();  
        monster.printStats();  // Ensure there's a printStats method for Monster
        inspector.showBox();  
        inspector.render();  
    });

    spriteFirstTile.on('mouseout', () => {
        inspector.hideBox();
        messageList.showBox();
    });
    
    spriteSecondTile.on('mouseout', () => {
        inspector.hideBox();
        messageList.showBox();
    });

}

//this is for tinting fire
function generateColorVariation(color, variation) {
    let baseColor = parseInt(color.slice(2), 16); // Convert to base 16 integer
    let maxColor = 0xFFAA33;
    let minColor = 0x333333;

    // Compute the color variations
    let lighterColor = Math.min(baseColor + variation, maxColor);
    let darkerColor = Math.max(baseColor - variation, minColor);

    // Convert back to hexadecimal color strings
    lighterColor = lighterColor.toString(16).padStart(6, '0');
    darkerColor = darkerColor.toString(16).padStart(6, '0');

    return {
        lighter: '0x' + lighterColor,
        darker: '0x' + darkerColor
    };
}

class Fire extends Entity {
    constructor(x, y, scheduler, color='0xFFA500') {
        super(x, y, scheduler, fireFrames, 2); // Call the Entity constructor

        this.name = "Fire";
        this.turnsLeft = 5; // maximum number of turns this fire can create more fires
        this.color = color;
        this.isFlammable = true;
        // Setting specific properties for the Fire instance
        this.sprite.tint = this.color;  // apply the tint
        this.sprite.blendMode = PIXI.BLEND_MODES.MULTIPLY;

        // Updating the atmosphere map to include this fire instance
        if (!atmosphereMap[this.y]) {
            atmosphereMap[this.y] = [];
        }
        atmosphereMap[this.y][this.x] = { value: 300, sprite: this.sprite };

        // Specific tween for the Fire instance
        let colorVariation = generateColorVariation(color, 0x101010); // color variation of flicker
        this.tween = new createjs.Tween.get(this.sprite)
            .to({ tint: colorVariation.lighter }, 20) 
            .wait(20)
            .to({ tint: color }, 100)
            .wait(100)
            .to({ tint: colorVariation.darker }, 10)
            .wait(10)
            .call(() => {
                this.tween.gotoAndPlay(0); // Restart the animation from the beginning
            });
        //this.checkAndDestroyKudzu(x, y);
        this.checkAndDestroyFlammable(x, y);
    }

    act() {
        //createjs.Tween.tick();
        // Decrease turns left, if it reaches 0, stop spreading and destroy the sprite
        //console.log("fire turn");
        if (--this.turnsLeft <= 0) {
            this.sprite.destroy();
            this.scheduler.remove(this);
            atmosphereMap[this.y][this.x] = null;
            let index = activeEntities.indexOf(this);
            if (index !== -1) {
                activeEntities.splice(index, 1);
            }
            return;

        }
    
        // 30% chance to spread the fire
        if (Math.random() < 0.3) {
            let directions = [
                [-1, 0], // left
                [1, 0], // right
                [0, -1], // up
                [0, 1] // down
            ];
            for (let direction of directions) {
                let newX = this.x + direction[0];
                let newY = this.y + direction[1];
                // Check if the new spot is valid and not already on fire
                if (newX >= 0 && newY >= 0 && newX < MAP_WIDTH && newY < MAP_HEIGHT && 
                    floorMap[newY][newX].value === 157 && 
                    (!atmosphereMap[newY][newX] || atmosphereMap[newY][newX].value !== 300)) {
                    
                    // Check and destroy Kudzu on the new tile
                    //this.checkAndDestroyKudzu(newX, newY);

                    this.checkAndDestroyFlammable(newX, newY);

                    // Create new fire
                    let fire = new Fire(newX, newY, this.scheduler, '0xFFCC33');
                    atmosphereMap[newY][newX].value = 300;
                                    
                    if (direction[0] !== 0) { // If the fire spread to the left or right, flip the sprite horizontally
                        // Set the transformation origin to the center of the sprite
                        fire.sprite.anchor.set(0.5, 0.5);
                
                        // Flip horizontally
                        fire.sprite.scale.x *= -1;
                
                        // Adjust sprite's position due to anchor change
                        fire.sprite.x += globalVars.TILE_WIDTH * SCALE_FACTOR / 2;
                        fire.sprite.y += globalVars.TILE_HEIGHT * SCALE_FACTOR / 2;
                    }
                                    
                    this.scheduler.add(fire, true); 
                    break;
                }
            }
        }
        if (Math.random() < 0.7) {
            let newY = this.y - 1; // the tile above the current one
            if (newY >= 0 && floorMap[newY][this.x].value !== 177 && atmosphereMap[newY][this.x] === null) {
                let smoke = new Smoke(this.x, newY, this.scheduler);
                this.scheduler.add(smoke, true);
            }
        }
    }
    checkAndDestroyFlammable(x, y) {
        // Check and destroy flammable entities
        if (growthMap[y] && growthMap[y][x] && growthMap[y][x].value) {
            let entity = growthMap[y][x].sprite;
            if (entity && entity.isFlammable && entity._texture) {
                entity.destroy();
            }
        }
    
        // Check and destroy flammable items
        if (objectMap[y] && objectMap[y][x] && objectMap[y][x].item && objectMap[y][x].item.isFlammable) {
            let item = objectMap[y][x].item;
            if (item && item.sprite && item.sprite.texture) {
                item.destroy();
                messageList.addMessage(`The ${item.name} disappears in flames.`);
               //console.log("Destroyed flammable item");
            }
        }

        if (player.x === x && player.y === y) {
            player.isBurning = true;
        }
    }
}

class Smoke extends Entity {
    constructor(x, y, scheduler) {
        super(x, y, scheduler, smokeFrames, 2.5); // Call the Entity constructor with smoke frames

        this.name = "Smoke";
        if (!atmosphereMap[this.y]) {
            atmosphereMap[this.y] = [];
        }
        atmosphereMap[this.y][this.x] = { value: 400, sprite: this.sprite };
    }

    act() {
        // Smoke's behavior when it acts...
        if (Math.random() < 0.5) {
            atmosphereMap[this.y][this.x] = null;
            this.sprite.destroy();
            this.scheduler.remove(this);
            let index = activeEntities.indexOf(this);
            if (index !== -1) {
                activeEntities.splice(index, 1);
            }
        }
    }

}

class Kudzu extends Entity {
    constructor(x, y, scheduler, parentDirection = null) {
        super(x, y, scheduler, [], 2);
        this.name = "Kudzu";
        this.hasFlower = false;
        scheduler.add(this, true);
        this.parentDirection = parentDirection;
        // Initialize the sprite using createSprite with an appropriate box drawing tile
        this.spriteData = createSprite(this.x, this.y, this.getBoxTileBasedOnDirection(parentDirection), growthMap);
        this.sprite = this.spriteData.sprite;
        this.sprite.isFlammable = true;
        // Mark this tile as occupied by Kudzu
        growthMap[this.y][this.x] = { value: 800, sprite: this.sprite };
        if (this.sprite) {
            this.sprite.interactive = true;
            this.sprite.on('mouseover', () => {
                console.log("Kudzu mouseover triggered"); // Debugging log
                messageList.hideBox(); 
                this.showInspectorInfo();
                inspector.showBox();  
                inspector.render();  
            });
            this.sprite.on('mouseout', () => {
                inspector.hideBox();
                messageList.showBox();
            });
        }
    }

    act() {
        // 1% chance to turn into a flower
        if (!this.hasFlower && Math.random() < 0.01) {
            this.addFlower();
            return;
        }

        // 10% chance to spread
        if (Math.random() < 0.1) {
            const directions = [
                [-1, 0, 'left'], // left
                [1, 0, 'right'],  // right
                [0, -1, 'up'],    // up
                [0, 1, 'down']    // down
            ];

            const availableTiles = directions
                .map(d => ({ x: this.x + d[0], y: this.y + d[1], direction: d[2] }))
                .filter(t => 
                    t.x >= 0 && t.x < MAP_WIDTH && t.y >= 0 && t.y < MAP_HEIGHT &&
                    floorMap[t.y][t.x].value === 157 && // Walkable tile
                    doorMap[t.y][t.x].value == null && // Not a door
                    objectMap[t.y][t.x]?.item?.value == null &&// No objects
                    atmosphereMap[t.y][t.x]?.value != 300 && // Not already occupied by Fire, using optional chaining
                    !growthMap[t.y][t.x] // Not already occupied by Kudzu or Flower
                );

            if (availableTiles.length > 0) {
                const randomTile = availableTiles[Math.floor(Math.random() * availableTiles.length)];
                this.spreadTo(randomTile.x, randomTile.y, randomTile.direction);
            }
        }
    }

    spreadTo(x, y, direction) {
        new Kudzu(x, y, this.scheduler, direction);
    }

    addFlower() {
        // Introduce a delay before turning into a flower
        setTimeout(() => {
            // Generate a random tint for the flower
            const baseColor = 0xDDA0DD; // Light violet as the base color
            const colorVariation = Math.floor(Math.random() * 0x20); // Slight variation in color
            const randomTint = Math.min(baseColor + colorVariation, 0xFFFFFF); // Ensure the color value does not exceed the maximum
            //const colorValue = parseInt(randomTint.hex.slice(1), 16);
            // Create a new Item instance for the flower
            const flowerItem = new Item(ItemType.FLOWER, this.x, this.y, 0, randomTint, "Flower");
    
            // Use the sprite from the flower item
            this.spriteData = flowerItem.sprite;
            this.hasFlower = true;
            playBloomSound();
        }, Math.random() * 1000); // Delay between 0 to 1000 milliseconds
    }

    getBoxTileBasedOnDirection(direction) {
        // Define the tile sets for each direction
        const tilesForDirection = {
            'left': [BOX_RIGHT_VERTICAL, BOX_TOP_RIGHT, BOX_VERTICAL_HORIZONTAL, BOX_DOWN_HORIZONTAL, BOX_UP_HORIZONTAL, BOX_HORIZONTAL],
            'right': [BOX_LEFT_VERTICAL, BOX_TOP_LEFT, BOX_VERTICAL_HORIZONTAL, BOX_DOWN_HORIZONTAL, BOX_UP_HORIZONTAL, BOX_HORIZONTAL],
            'up': [BOX_DOWN_HORIZONTAL, BOX_BOTTOM_LEFT, BOX_BOTTOM_RIGHT, BOX_VERTICAL_HORIZONTAL, BOX_LEFT_VERTICAL, BOX_RIGHT_VERTICAL, BOX_VERTICAL],
            'down': [BOX_UP_HORIZONTAL, BOX_TOP_LEFT, BOX_TOP_RIGHT, BOX_VERTICAL_HORIZONTAL, BOX_LEFT_VERTICAL, BOX_RIGHT_VERTICAL, BOX_VERTICAL]
        };

        // Get the appropriate tile set based on direction
        const tileSet = tilesForDirection[direction] || [BOX_VERTICAL_HORIZONTAL];

        // Return a random tile from the tile set
        return tileSet[Math.floor(Math.random() * tileSet.length)];
    }
    
}

class Uranium extends Entity {
    constructor(x, y, scheduler, color = '0xE0FF00') {
        super(x, y, scheduler, [], 2, growthMap); 
        this._tileIndex = {x: 8, y: 0};
        this.name = "Uranium";
        this.color = color;
        this.isFlammable = false;

        // Create the sprite
        this.spriteData = createSprite(this.x, this.y, this._tileIndex, growthMap);
        this.sprite = this.spriteData.sprite; // Assign the created sprite to this instance

        // Set sprite properties
        this.sprite.tint = this.color;  // apply the tint
        this.sprite.blendMode = PIXI.BLEND_MODES.MULTIPLY;

        // Updating the atmosphere map to include this Uranium instance
        if (!atmosphereMap[this.y]) {
            atmosphereMap[this.y] = [];
        }
        atmosphereMap[this.y][this.x] = { value: 400, sprite: this.sprite }; // Use a unique value for Uranium

        // Specific tween for the Uranium instance
        let colorVariation = generateColorVariation(color, 0xEDFFAC); 
        this.tween = new createjs.Tween.get(this.sprite)
            .to({ tint: colorVariation.lighter }, 20) 
            .wait(20)
            .to({ tint: color }, 100)
            .wait(100)
            .to({ tint: colorVariation.darker }, 10)
            .wait(10)
            .call(() => {
                this.tween.gotoAndPlay(0); // Restart the animation from the beginning
            });
    }

    act() {
        // Check adjacent tiles for the player and potentially harm them
        let directions = [
            [-1, 0], // left
            [1, 0], // right
            [0, -1], // up
            [0, 1] // down
        ];
        for (let direction of directions) {
            let newX = this.x + direction[0];
            let newY = this.y + direction[1];
            if (!this.isOutOfBounds(newX, newY) && player.x === newX && player.y === newY) {
                if (Math.random() < 1 / 3) { // 1 in 3 chance to harm the player
                    player.takeDamage(1);
                    this.messageList.addMessage("You feel sick.");
                }
            }
        }
    }

    isOutOfBounds(x, y) {
        return x < 0 || y < 0 || x >= MAP_WIDTH || y >= MAP_HEIGHT;
    }
}



function generateColorVariation(baseColor, variation) {
    const lighter = (baseColor & 0xFFFFFF) + (variation & 0xFFFFFF);
    const darker = (baseColor & 0xFFFFFF) - (variation & 0xFFFFFF);
    return {
        lighter: lighter > 0xFFFFFF ? 0xFFFFFF : lighter,
        darker: darker < 0 ? 0 : darker
    };
}






//blood
function dripBlood(x, y, tint) {
    bloodSprite = createSprite(x, y, {x: 21, y: 7}, bloodMap, true, false, tint);
    bloodSprite.blendMode = PIXI.BLEND_MODES.MULTIPLY;

    console.log("drip");
}


const ItemType = Object.freeze({
    "FOOD": 0,
    "BOW": 1,
    "KEY": 2,
    "ARROW": 3,
    "FLOWER": 4,
    "CRADLE": 5,
    "MATTOCK": 6
});

class Item {
    static idCounter = 0;
    constructor(type, x, y, id, colorValue, name) {
        this.x = x;
        this.y = y;
        this.colorValue = colorValue;
        this.id = Item.idCounter++;
        this._tileIndex = {x: 17, y: 2};
        this.isFlammable = false;
        this.map = objectMap;
        switch (type) {
            case ItemType.BOW:
                this._name = 'Bow';
                this._type = type;
                this._tileIndex = {x: 13, y: 0};  // the tile indices on the spritesheet for the Bow
                this._objectNumber = 1; // I was using this as a enum value for objectMap for game logic should prob delete it
                break;
            case ItemType.KEY:
                this._name = `${name}`;
                this._type = type;
                this._tileIndex = {x: 10, y: 0};
                this._objectNumber = 105;
                this.id = id; // The key's unique identifier
                this.colorValue = colorValue; // The key's color value
                break;
            case ItemType.ARROW:
                this._name = 'Arrow';
                this._type = type;
                this.isFlammable = true;
                this._tileIndex = {x: 3, y: 1};
                this._objectNumber = 2;
                break;
            case ItemType.FLOWER:
                this._name = 'Flower';
                this._type = type;
                this.isFlammable = true;
                this._tileIndex = {x: 11, y: 10};
                this._objectNumber = 200;
                this.colorValue = colorValue;
                break;
            case ItemType.CRADLE:
                this._name = 'Cradle';
                this._type = type;
                this._tileIndex = {x: 14, y: 10};
                this._objectNumber = 3;
                this.colorValue = colorValue;
                break;
            case ItemType.MATTOCK:
                this._name = 'Mattock';
                this._type = type;
                this._tileIndex = {x: 3, y: 8};
                this._objectNumber = 4;
                this.colorValue = colorValue;
                break;
        }
        let baseTexture = PIXI.BaseTexture.from(PIXI.Loader.shared.resources.tiles.url);
        this.spriteTexture = new PIXI.Texture(baseTexture, new PIXI.Rectangle(
            this._tileIndex.x * globalVars.TILE_WIDTH, 
            this._tileIndex.y * globalVars.TILE_HEIGHT, 
            globalVars.TILE_WIDTH, 
            globalVars.TILE_HEIGHT
        ));
        this.sprite = new PIXI.Sprite(this.spriteTexture);
        this.sprite.interactive = true;
        this.sprite.on('mouseover', () => {
            messageList.hideBox(); 
            this.showInspectorInfo();
            inspector.showBox();  
            inspector.render();  
        });
        this.sprite.on('mouseout', () => {
            inspector.hideBox();
            messageList.showBox();
        });
        
        // Set position, scale, and zIndex of the sprite
        this.sprite.position.set(x * globalVars.TILE_WIDTH * SCALE_FACTOR, y * globalVars.TILE_HEIGHT * SCALE_FACTOR);
        this.sprite.scale.set(SCALE_FACTOR);
        this.sprite.zIndex = 2;
        if (type === ItemType.FLOWER || type === ItemType.KEY ) { 
            this.sprite.blendMode = PIXI.BLEND_MODES.NORMAL;  
            this.sprite.tint = colorValue;
           //this.sprite.tint = 0xFF0000
            
        }
        if (type === ItemType.CRADLE) { 
            this.sprite.blendMode = PIXI.BLEND_MODES.NORMAL;  
           
            this.sprite.tint = 0xFFFF00
            
        }
        // Add sprite to gameContainer
        gameContainer.addChild(this.sprite);

        if (!objectMap[this.y]) {
            objectMap[this.y] = [];
        }
        objectMap[this.y][this.x] = { value: this._objectNumber, sprite: this.sprite, item: this };
        activeItems.push(this);
        this.destroy = () => {
            // Check if the map and the specific tile in the map exist
            if (this.map[this.y] && this.map[this.y][this.x]) {
                this.map[this.y][this.x] = null; // Clear the tile from the map
            }
        
            // Destroy sprite and remove from scheduler
            if (this.sprite) {
                this.sprite.destroy();
            }
            let index = activeEntities.indexOf(this);
            if (index !== -1) {
                activeEntities.splice(index, 1);
            }
        };
    }

    get name() {
        return this._name;
    }

    get type() {
        return this._type;
    }

    get tile() {
        return this._tile;
    }

    showInspectorInfo() {
        inspector.clearMessages();
        inspector.addMessage(`${this.name}`);
        
    }
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}


class Door {
    static allDoors = [];
    constructor(id, x, y, colorValue, isLocked = false) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.colorValue = colorValue;
        this.name = ''; 
        this.isLocked = isLocked;
        this.isOpen = false;
        this.sprites = []; // This will hold the three parts of the door
        this.createDoor();
        Door.allDoors.push(this);
    }

    static totalDoors() {
        //return Door.allDoors.length;
        return Door.allDoors;
    }
    static isOpenAt(x, y) {
        // map value open close testing is fucked up for arrows for some reason so adding this for now
        const door = Door.allDoors.find(d => d.x === x && (d.y === y || d.y === y+1 || d.y === y+2));
        // Return if the door is open or not.
        return door ? door.isOpen : false;
    }
    createDoor() {
        const closedSpriteIndices = [{x: 11, y: 6}, {x: 10, y: 6}, {x: 21, y: 8}];
        const openSpriteIndices = [{x: 13, y: 8}, {x: 13, y: 8}, {x: 21, y: 9}];

        const spriteIndices = this.isOpen ? openSpriteIndices : closedSpriteIndices;
        
        // Create door parts on the object map
        for (let i = 0; i < spriteIndices.length; i++) {
            
            createSprite(this.x, this.y - i, spriteIndices[i], doorMap, this.isLocked ? 101 : 100);
            let sprite = doorMap[this.y - i][this.x].sprite;
            this.sprites.push(sprite);

            // Interactivity
            sprite.interactive = true;
            sprite.on('mouseover', () => {
                messageList.hideBox(); 
                this.showInspectorInfo();
                inspector.showBox();  
                inspector.render();  
            });

            sprite.on('mouseout', () => {
                inspector.hideBox();
                messageList.showBox();
            });

            sprite.on('click', () => {
                if (player && player.isAdjacentTo(this.x, this.y)) {
                    // Check if door is locked and if player has the right key
                    if (this.isLocked) {
                        const keyItem = player.inventory.find(item => item.type === ItemType.KEY && item.id === this.id);
                        if (keyItem) {
                            this.unlock();
                            player.removeItem(keyItem); // Assuming the Player class has a removeItem method
                            messageList.addMessage(`You unlocked the ${this.name} with your key.`);
                        } else {
                            // Player doesn't have the right key
                            messageList.addMessage(`The ${this.name} is locked.`);
                            return;
                        }
                    }
                    this.toggleDoor();
                } else if (player) {
                    let adjacentPosition = player.getAdjacentPosition(this.x, this.y);
                    player.moveTo(adjacentPosition.x, adjacentPosition.y).then(() => {
                        // Once the player has moved adjacent to the door, toggle it
                        this.toggleDoor();
                    });
                }
            });
        }

        // Apply color tint
        if (this.isLocked) {
            this.sprites.forEach(sprite => sprite.tint = this.colorValue);
        }
    }

    lock() {
        this.isLocked = true;
        this.updateDoorStateInMap(101); // Update the object map value to represent locked door
    }

    unlock() {
        if (this.isLocked) {
            this.isLocked = false;
            this.updateDoorStateInMap(100); // Update the object map value to represent unlocked door
            this.open();
        }
    }

    isDoorLocked() {
        return this.isLocked;
    }

    canUnlock(key) {
        return key.id === this.id;
    }
    toggleDoor() {
        if (this.isOpen) {
            this.close();
            messageList.addMessage("You close a door.")
            this.updateDoorStateInMap(100);
            playDoorSound();
        } else {
            this.open();
            messageList.addMessage("You open a door.")
            this.updateDoorStateInMap(null);
            playDoorSound();
        }
    }
    open() {
        if (!this.isLocked && !this.isOpen) {
            const openSpriteIndices = [{x: 13, y: 8}, {x: 13, y: 8}, {x: 21, y: 9}];
            this.updateSprites(openSpriteIndices);
            this.isOpen = true;
            playDoorSound();
        }
    }

    close() {
        if (!this.isLocked && this.isOpen) {
            const closedSpriteIndices = [{x: 11, y: 6}, {x: 10, y: 6}, {x: 21, y: 8}];
            this.updateSprites(closedSpriteIndices);
            this.isOpen = false;
        }
    }

    updateSprites(spriteIndices) {
        for (let i = 0; i < this.sprites.length; i++) {
            this.sprites[i].texture = getTextureFromIndices(spriteIndices[i]);
        }
    }

    updateDoorStateInMap(value) {
        for (let i = 0; i < 3; i++) {
            doorMap[this.y - i][this.x].value = value;
        }
    }

    showInspectorInfo() {

        inspector.clearMessages();
        if(this.isOpen) {
            if (!player.isDead){
                inspector.addMessage("Close door?");
            }
        } else {
            if (this.isLocked) {
                inspector.addMessage(`${this.name}`);
            }   else {
                inspector.addMessage(`Door`);
            }
            inspector.addMessage(`Status: ${this.isLocked ? "Locked" : "Unlocked"}`);
        }
    }

}

class Exit {
    static allExits = [];
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type; // "up" or "down"
        this.createExit();
        Exit.allExits.push(this);
    }

    createExit() {
        let spriteIndices = this.type === "up" ? 
            [{x: 22, y: 5, flipV: true}, {x: 21, y: 0}] : 
            [{x: 22, y: 5, flipH: true, flipV: true}, {x: 20, y: 0}];
    
        this.sprites = [];
    
        for (let i = 0; i < spriteIndices.length; i++) {
            let spriteInfo = spriteIndices[i];
    
            // For the upper tile, we adjust the y-coordinate
            let yOffset = i === 0 ? -1 : 0;
    
            let sprite = createSprite(this.x, this.y + yOffset, {x: spriteInfo.x, y: spriteInfo.y}, floorMap, 157);
    
            // Positioning for flipping logic
            if (spriteInfo.flipH) {
                sprite.scale.x *= -1;
                sprite.x += globalVars.TILE_WIDTH * SCALE_FACTOR;
            }
    
            if (spriteInfo.flipV) {
                sprite.scale.y *= -1;
                sprite.y += globalVars.TILE_HEIGHT * SCALE_FACTOR;
            }
    
            this.sprites.push(sprite);
        }
    }
    
    
}


// This function advances the turn after a delay of 1/2 second
function delayedAdvanceTurn() {
    
    setTimeout(function() {
        engine.unlock();
    }, 200);
}

// This function checks the state of the game and takes appropriate action
function checkGameState() {
    var alivePlayers = players.filter(function(player) {
        return !player.isDead;
    });
    if (alivePlayers.length === 0) {
        let isSomeoneCanAct = activeEntities.some(entity => typeof entity.act === 'function');
        // If no one can act, and game over flag is not set yet, show the message and stop the game
        if (!isSomeoneCanAct && !gameOver) {
            
            messageList.addMessage("The dungeon is still");
            engine.lock();
            gameOver = true; // Set game over flag to true
        }
        // Otherwise, advance the turn after a delay of 1 second and show "Time passes..." message
        else if (isSomeoneCanAct) {
            messageList.addMessage("Time passes.");
            if (engine._lock){
                delayedAdvanceTurn();
                player.blood -= 1;
                messageList.addDotToEndOfLastMessage();
                player.applyDamageEffects();
            }
        }
    }
}

function getTextureFromIndices(index) {
    let baseTexture = PIXI.BaseTexture.from(PIXI.Loader.shared.resources.tiles.url);
    let texture = new PIXI.Texture(baseTexture, new PIXI.Rectangle(
        index.x * globalVars.TILE_WIDTH,
        index.y * globalVars.TILE_HEIGHT,
        globalVars.TILE_WIDTH, globalVars.TILE_HEIGHT));

    return texture;
}

function createSprite(x, y, index, layer, value = null, overlay = false, tint = null) {
    if (!layer[y]) {
        layer[y] = [];
    }
    let container;
    if (layer === uiMaskMap){
        container = uiMaskContainer;
    } else if (layer === uiMap || layer === overlayMap) {
        container = uiContainer;
    } else {
        container = gameContainer;
    }
    if (layer?.[y]?.[x]?.sprite) {
        container.removeChild(layer[y][x].sprite);
    }

    let baseTexture = PIXI.BaseTexture.from(PIXI.Loader.shared.resources.tiles.url);
    let texture = new PIXI.Texture(baseTexture, new PIXI.Rectangle(
        index.x * globalVars.TILE_WIDTH,
        index.y * globalVars.TILE_HEIGHT,
        globalVars.TILE_WIDTH, globalVars.TILE_HEIGHT));

    let sprite = new PIXI.Sprite(texture);
    sprite.scale.set(SCALE_FACTOR);
    sprite.x = x * globalVars.TILE_WIDTH * SCALE_FACTOR;
    sprite.y = y * globalVars.TILE_HEIGHT * SCALE_FACTOR;
    if (tint) {
        sprite.tint = tint;
    }
    // Set initial opacity to 1
    if (layer === wallMap || layer === uiMap) {
        sprite.alpha = 1;
    }
    if (layer === atmosphereMap){
        sprite.zIndex = 3.9;
    }
    if (layer === wallMap) {
        sprite.zIndex = 3;

        // Remove sprites on layers beneath the wall layer if they exist at the same position
        if (wallMap?.[y]?.[x]?.sprite) {
            container.removeChild(wallMap[y][x].sprite);
            wallMap[y][x].sprite = null;
        }
        if (floorMap?.[y]?.[x]?.sprite) {
            container.removeChild(floorMap[y][x].sprite);
            floorMap[y][x].sprite = null;
        }
        if (backgroundMap?.[y]?.[x]?.sprite) {
            container.removeChild(backgroundMap[y][x].sprite);
            backgroundMap[y][x].sprite = null;
        }
    } else if (layer === objectMap || layer === doorMap || layer === growthMap) {
        sprite.zIndex = 2; // Set zIndex for objectMap
    } else if (layer === floorMap) {
        sprite.zIndex = 1;
        
        // Remove sprites on the background layer if they exist at the same position
        if (backgroundMap?.[y]?.[x]?.sprite) {
            container.removeChild(backgroundMap[y][x].sprite);         
        }
    } else if (layer === bloodMap) { 
        sprite.zIndex = 1.1;
    }


    container.addChild(sprite);

    let existingValue = layer[y][x] ? layer[y][x].value : null;
    layer[y][x] = {value: value !== null ? value : existingValue, sprite: sprite};
    // Update zIndex for objectMap based on y position compared to walls
    if (layer === objectMap || layer === doorMap && wallMap?.[y]?.[x]?.sprite) {
        if (y * globalVars.TILE_HEIGHT * SCALE_FACTOR < wallMap[y][x].sprite.y) {
            sprite.zIndex = 4; // Object is behind the wall
        }
    }
    
    //return sprite;
    return layer[y][x]; 
}

function getComplimentaryColor(color) {
    // Extract the RGB components from the color
    const r = (color >> 16) & 0xFF;
    const g = (color >> 8) & 0xFF;
    const b = color & 0xFF;

    // Calculate the complimentary color
    const rComplimentary = 255 - r;
    const gComplimentary = 255 - g;
    const bComplimentary = 255 - b;

    // Combine the RGB components back into a single color
    const complimentaryColor = (rComplimentary << 16) | (gComplimentary << 8) | bComplimentary;

    return complimentaryColor;
}

function createVoid(x, y) {
    createSprite(x, y, {x: 9, y: 9}, backgroundMap, 216);

    let sprite = backgroundMap[y][x].sprite;

    // Set the transformation origin to the center of the sprite
    sprite.anchor.set(0.5, 0.5);

    // Randomly flip the sprite horizontally or vertically
    let randomFlip = Math.random(); // Generates a random number between 0 (inclusive) and 1 (exclusive)
    if (randomFlip < 0.25) {
        sprite.scale.x *= -1; // Flip horizontally
    } else if (randomFlip < 0.5) {
        sprite.scale.y *= -1; // Flip vertically
    }

    // Adjust sprite's position due to anchor change
    sprite.x = x * globalVars.TILE_WIDTH * SCALE_FACTOR + globalVars.TILE_WIDTH * SCALE_FACTOR / 2;
    sprite.y = y * globalVars.TILE_HEIGHT * SCALE_FACTOR + globalVars.TILE_HEIGHT * SCALE_FACTOR / 2;
}

function createChasmWall(x, y) {
    createSprite(x, y, {x: 16, y: 7}, backgroundMap, 177);

    let sprite = backgroundMap[y][x].sprite;

    // Set the transformation origin to the center of the sprite
    sprite.anchor.set(0.5, 0.5);

    // Randomly flip the sprite horizontally or vertically
    let randomFlip = Math.random(); // Generates a random number between 0 (inclusive) and 1 (exclusive)
    if (randomFlip < 0.25) {
        sprite.scale.x *= -1; // Flip horizontally
    } else if (randomFlip < 0.5) {
        sprite.scale.y *= -1; // Flip vertically
    }

    // Adjust sprite's position due to anchor change
    sprite.x = x * globalVars.TILE_WIDTH * SCALE_FACTOR + globalVars.TILE_WIDTH * SCALE_FACTOR / 2;
    sprite.y = y * globalVars.TILE_HEIGHT * SCALE_FACTOR + globalVars.TILE_HEIGHT * SCALE_FACTOR / 2;
}

function createFloor(x, y) {
    createSprite(x, y, {x: 19, y: 6}, floorMap, 157);
}

function createRoughFloor(x, y) {
    const possibleSprites = [
        {x: 8, y: 6},
        {x: 20, y: 6}
    ];
    const randomIndex = Math.floor(Math.random() * possibleSprites.length);
    const chosenSprite = possibleSprites[randomIndex];
    createSprite(x, y, chosenSprite, floorMap, 157);
}

function createWall(x, y) {
    createSprite(x, y, {x: 22, y: 8}, floorMap, 177); // footprint
    createSprite(x, y - 1, {x: 22, y: 8}, wallMap, 177); // middle
    createSprite(x, y - 2, {x: 21, y: 8}, wallMap, 131); // top
}

function createVerticalWall(x, y) {
    if (wallMap[y][x] !== 131 && wallMap[y][x] !== 177){
        createSprite(x, y, {x: 22, y: 8}, floorMap, 177); // footprint
        createSprite(x, y - 1, {x: 22, y: 8}, wallMap, 177); // middle
    }
    createSprite(x, y - 2, {x: 16, y: 5}, wallMap, 131); // top
}

// dungeon generator
function dungeonGeneration() {
    // Use rot.js to create a uniform dungeon map
    dungeon = new ROT.Map.Uniform(MAP_WIDTH, MAP_HEIGHT);
    
    // This callback function will be executed for every generated map cell
    const callback = (x, y, value) => {
        if (value === 0) {
            // 0 represents a floor tile
            floorMap[y][x] = 157; // 157 is the floor tile representation in the game
        } else {
            // 1 represents a wall or void
            backgroundMap[y][x] = 216; // 216 is the void tile representation in the game
        }
    };
    
    dungeon.create(callback);
    
}

async function addDoors() {
    // Fetch colors.json and store the colors array
    const response = await fetch('./data/colors.json');
    const data = await response.json();
    const colors = data.colors;

    const rooms = dungeon.getRooms();
    const treasureRoomIndex = Math.floor(Math.random() * rooms.length);
    const treasureRoom = rooms[treasureRoomIndex];

    currentTreasureRoom = treasureRoom; //save the treasure room for later

    treasureRoom.getDoors((x, y) => {
        const colorIndex = Math.floor(Math.random() * colors.length); 
        const colorValue = parseInt(colors[colorIndex].hex.slice(1), 16);
        let door = new Door(globalDoorCounter++, x, y, colorValue, true);  // Locked door with unique ID
        door.name = capitalizeFirstLetter(colors[colorIndex].color) + " door ";
        placeKeyForDoor(door, colors[colorIndex].color);  // Add a key for this door
    });
    
    for (let i = 0; i < rooms.length; i++) {
        if (i !== treasureRoomIndex) {  // Skip the treasure room
            const room = rooms[i];
            room.getDoors((x, y) => {
                if (Math.random() >= 0.5) {  // 50% chance for a door
                    const colorIndex = Math.floor(Math.random() * colors.length); 
                    const colorValue = parseInt(colors[colorIndex].hex.slice(1), 16);
                    new Door(globalDoorCounter++, x, y, colorValue);  // Unlocked door with unique ID
                    //console.log("door color " + colorValue);
                }
            });
        }
    }
    return treasureRoom;
}

function isTileInTreasureRoom(tile, treasureRoom) {
    if (!currentTreasureRoom) {
        return false;
    }

    return tile.x >= currentTreasureRoom.getLeft() && tile.x <= currentTreasureRoom.getRight() &&
           tile.y >= currentTreasureRoom.getTop() && tile.y <= currentTreasureRoom.getBottom();
}

function isTileWithDoor(tile, doorMap) {
    // Check if there's any door at the given tile's coordinates
    return doorMap[tile.y][tile.x] !== null && doorMap[tile.y][tile.x] !== undefined;
}

function placeKeyForDoor(door, doorName) {
    let walkableTiles = [];
    for (let y = 0; y < MAP_HEIGHT; y++) {
        for (let x = 0; x < MAP_WIDTH; x++) {
            if (floorMap[y][x].value === 157) {
                walkableTiles.push({x: x, y: y});
            }
        }
    }
    let randomTile = walkableTiles[Math.floor(Math.random() * walkableTiles.length)];

    let keyName = `${doorName} key`;
    new Item(ItemType.KEY, randomTile.x, randomTile.y, door.id, door.colorValue, keyName);

}

function addFloorsAndVoid() {
    for (let y = 0; y < MAP_HEIGHT; y++) {
        for (let x = 0; x < MAP_WIDTH; x++) {
            if (floorMap[y][x] === 157) {
                createFloor(x, y);
            } else if (backgroundMap[y][x] === 216) {
                createVoid(x, y);
            }
        }
    }
}

function isAdjacentTo(map, x, y, tileValue) {
    const isAbove = y > 1 && map[y - 1][x].value === tileValue; // Check Up
    const isBelow = y < MAP_HEIGHT - 1 && map[y + 1][x].value === tileValue; // Check Down
    const isLeft = x > 1 && map[y][x - 1].value === tileValue; // Check Left
    const isRight = x < MAP_WIDTH - 1 && map[y][x + 1].value === tileValue; // Check Right

    return isAbove || isBelow || isLeft || isRight;
}

function isAbove(map, x, y, tileValue) {
    return y > 0 && map[y - 1][x].value === tileValue;
}

function isTwoAbove(map, x, y, tileValue) {
    return y > 1 && map[y - 2][x].value === tileValue;
}

function isThreeAbove(map, x, y, tileValue) {
    return y > 3 && map[y - 3][x].value === tileValue;
}

function isBelow(map, x, y, tileValue) {
    return y < MAP_HEIGHT - 1 && map[y + 1][x].value === tileValue;
}


function hasVerticalTilesOnSide(map, x, y, tileValue, isLeftSide) {
    let hasVerticalTiles;
    
    if (isLeftSide) {
        hasVerticalTiles = x > 0 &&
            (y > 0 && map[y - 1][x - 1].value === tileValue) && // Top Left
            (map[y][x - 1].value === tileValue) && // Middle Left
            (y < MAP_HEIGHT - 1 && map[y + 1][x - 1].value === tileValue); // Lower Left
    } else {
        hasVerticalTiles = x < MAP_WIDTH - 1 &&
            (y > 0 && map[y - 1][x + 1].value === tileValue) && // Top Right
            (map[y][x + 1].value === tileValue) && // Middle Right
            (y < MAP_HEIGHT - 1 && map[y + 1][x + 1].value === tileValue); // Lower Right
    }

    // Log the values for debugging purposes
    //console.log(`Checking vertical tiles at (${x}, ${y}), isLeftSide: ${isLeftSide}, hasVerticalTiles: ${hasVerticalTiles}`);
    
    return hasVerticalTiles;
}

function isOnLeft(map, x, y, tileValue) {
    return x > 0 && map[y][x - 1].value === tileValue;
}

function behindShadowEdge(map, x, y) {
    return x > 1 && map[y][x - 2].value === 127;
}

function isOnRight(map, x, y, tileValue) {
    return x < MAP_WIDTH - 1 && map[y][x + 1].value === tileValue;
}

function isInMidAndLowerRight(map, x, y, tileValue) {
    const isUpperRight = x < MAP_WIDTH - 1 && y > 1 && map[y - 1][x + 1].value === tileValue;
    const isMidRight = x < MAP_WIDTH - 1 && map[y][x + 1].value === tileValue;
    const isLowerRight = x < MAP_WIDTH - 1 && y < MAP_HEIGHT - 1 && map[y + 1][x + 1].value === tileValue;

    return isMidRight && isLowerRight && isUpperRight;
}

function isInMidAndLowerLeft(map, x, y, tileValue) {
    const isUpperLeft = x > 0 && y > 1 && map[y - 1][x - 1].value === tileValue;
    const isMidLeft = x > 0 && map[y][x - 1].value === tileValue;
    const isLowerLeft = x > 0 && y < MAP_HEIGHT - 1 && map[y + 1][x - 1].value === tileValue;

    return !isUpperLeft && isMidLeft && isLowerLeft;
}

function isOnlyUpperLeftCornerTile(map, x, y, tileValue) {
    const UpperLeft = x > 0 && y > 1 && map[y - 1][x - 1].value === tileValue;
    const left = x > 0 && map[y][x - 1].value === tileValue;
    const below = y < MAP_HEIGHT - 1 && map[y + 1][x].value === tileValue;
    const right = x < MAP_WIDTH - 1 && map[y][x + 1].value === tileValue;

    return left && UpperLeft && !below && !right;
}

function isUpperLeftCornerTile(map, x, y, tileValue) {
    // Check if y - 1 is within bounds
    if (y > 0) {
        // Check if x - 1 is within bounds, and map[y - 1][x - 1] exists with a 'value' property
        const isUpperLeft = x > 0 && y > 1 && map[y - 1][x - 1].value === tileValue;
        return isUpperLeft;
    }
    return false;
}

function isUpperRightCornerTile(map, x, y, tileValue) {
    // Check if y - 1 is within bounds
    if (y > 0) {
        // Check if x - 1 is within bounds, and map[y - 1][x + 1] exists with a 'value' property
        const isUpperRight = x < MAP_WIDTH - 1 && y > 1 && map[y - 1][x + 1].value === tileValue;
        return isUpperRight;
    }
    return false;
}


function isLowerLeftCornerTile(map, x, y, tileValue) {
    // Check if y + 1 is within bounds
    if (y < map.length - 1) {
        // Check if x - 1 is within bounds
        const isLowerLeft = x > 0 && y < MAP_HEIGHT - 1 && map[y + 1][x - 1].value === tileValue;
        return isLowerLeft;
    }
    return false;
}

function isLowerRightCornerTile(map, x, y, tileValue) {
    // Check if y + 1 is within bounds
    if (y < map.length - 1) {
        // Check if x + 1 is within bounds
        const isLowerRight = x < MAP_WIDTH - 1 && y < MAP_HEIGHT - 1 && map[y + 1][x + 1].value === tileValue;
        return isLowerRight;
    }
    return false;
}

function diagonal_distance(p0, p1) {
    return Math.max(Math.abs(p1.x - p0.x), Math.abs(p1.y - p0.y));
}

function round_point(p) {
    return { x: Math.round(p.x), y: Math.round(p.y) };
}

function lerp_point(p0, p1, t) {
    return {
        x: p0.x * (1 - t) + p1.x * t,
        y: p0.y * (1 - t) + p1.y * t
    };
}

function line(p0, p1) {
    let points = [];
    let N = diagonal_distance(p0, p1);
    for (let step = 0; step <= N; step++) {
        let t = N === 0? 0.0 : step / N;
        points.push(round_point(lerp_point(p0, p1, t)));
    }
    return points;
}

function addBaseAndShadows() {
    //console.log("adding shadows");
    for (let y = 0; y < MAP_HEIGHT; y++) {
        for (let x = 0; x < MAP_WIDTH; x++) {
            // Check if the current tile is a floor
            if (backgroundMap[y][x].value === 216 && floorMap[y][x].value !== 177 && wallMap[y][x].value !== 177 && wallMap[y][x].value !== 131) { 
                if (!isUpperLeftCornerTile(floorMap, x,y,177) && isAbove(floorMap, x, y, 177) ) {
                    createSprite(x,y,{x: 12, y: 5},backgroundMap, 127);
                }
                if ((isOnLeft(wallMap, x,y,177) || isOnLeft(wallMap, x,y,131) || isOnLeft(floorMap, x,y,177)) && isAbove(floorMap, x, y, 177) ) {
                    createSprite(x,y,{x: 12, y: 5},backgroundMap, 127);
                }
                if ((isUpperLeftCornerTile(backgroundMap,x,y,127) && isAbove(backgroundMap,x,y,177))){
                    createSprite(x,y,{x: 12, y: 5},backgroundMap, 127);
                }

                if ((isOnLeft(backgroundMap,x,y,127)) && wallMap[y][x].value !== 177 && floorMap[y][x].value !== 177  && (isAbove(floorMap,x,y,177) || isAbove(backgroundMap,x,y,177))){
                    let xPos = x; // Start checking from the tile to the right of the current tile
                    while (y > 1 && xPos < MAP_WIDTH -1 && floorMap[y][xPos].value !== 177 && wallMap[y][xPos].value !== 177 && wallMap[y][xPos].value !== 131 && backgroundMap[y][xPos].value === 216 && (isAbove(floorMap,xPos,y,177) || isAbove(backgroundMap,xPos,y,177))) {
                        createSprite(xPos, y, {x: 16, y: 7},backgroundMap, 177);
                        createChasmWall(xPos,y);
                        xPos++; // Move to the next tile to the right
                    }
                }
            }
            
        }
    }
}

function evaluateMapAndCreateWalls() {
    // Loop through each row
    addDoors(dungeon);
    for (let y = 0; y < MAP_HEIGHT; y++) {
        // Loop through each column
        for (let x = 0; x < MAP_WIDTH; x++) {
            // Check if the current tile has a value of 216
            if (backgroundMap[y][x].value === 216) {
                //console.log("I found a void at (" + x + ", " + y + ")");

                // First, check for vertical walls
                // Check if adjacent to floor
                let isAdjacentToFloorAbove = isAbove(floorMap, x, y, 157);
                
                let isAdjacentToFloor =
                    isAdjacentToFloorAbove ||
                    isBelow(floorMap, x, y, 157) ||
                    isOnLeft(floorMap, x, y, 157) ||
                    isOnRight(floorMap, x, y, 157);

                if (isAdjacentToFloor) {
                    if (isAdjacentToFloorAbove) {
                        createWall(x, y);
                    } else {
                        createWall(x, y);
                    }
                } else if (isLowerLeftCornerTile(floorMap, x, y, 157) || isLowerRightCornerTile(floorMap, x, y, 157) || isUpperLeftCornerTile(floorMap, x, y, 157) || isUpperRightCornerTile(floorMap, x, y, 157)){
                    createWall(x, y);
                    //console.log("Void at (" + x + ", " + y + ") is NOT adjacent to a floor");
                }
            }
        }
    }
    
}

/// UI functions


// a class for screen text
class UIBox {
    constructor(textBuffer = [""], width = MAP_WIDTH, height = null, hidden = false) {
        this.textBuffer = textBuffer;
        this.width = width;
        this.height = height || textBuffer.length;
        this.hidden = hidden;
        this.height = Math.min(this.height, MAP_HEIGHT);
        this.originalTiles = [];
    }
    
    maskBox() {
        const WHITE_TILE = { x: 21, y: 7 };
        for(let y = 0; y < this.height +1; y++) {
            for(let x = 0; x < this.width; x++) {
                createSprite(x, y, WHITE_TILE, uiMaskMap, 0);
            }
        }
    }

    clearBox(){
        const BLANK_TILE = { x: 0, y: 0 };
        for(let y = 0; y < this.height+1; y++) {
            for(let x = 0; x < this.width; x++) {
                createSprite(x, y, BLANK_TILE, uiMap, 0);
                createSprite(x, y, BLANK_TILE, uiMaskMap, 0);
            }
        }
    }
    // a function to draw a box with sprites
    drawUIBox() {
        if (this.hidden) return; // If box is hidden, don't draw it
        //const WHITE_TILE = { x: 21, y: 7};

        // Adjust box height based on number of lines in textBuffer, but not more than MAP_HEIGHT
        if (this.height == null){this.height = Math.min(this.textBuffer.length, MAP_HEIGHT );}
        if (this.width == null){this.width = MAP_WIDTH};

        this.maskBox();
        createSprite(0, 0, BOX_TOP_LEFT,uiMap, 214);
        for (let x = 1; x < this.width - 1; x++) {
            createSprite(x, 0, BOX_HORIZONTAL,uiMap, 196);
        }
        createSprite(this.width - 1, 0, BOX_TOP_RIGHT,uiMap, 191);

        for (let y = 1; y < this.height; y++) {
            createSprite(0, y, BOX_VERTICAL, uiMap, 179);
            createSprite(this.width - 1, y, BOX_VERTICAL, uiMap, 179);
            /* for(let x = 1; x < this.width - 1; x++) {
                createSprite(x, y, WHITE_TILE, uiMap, 0);
            } */
            // Write the message
            let message = this.textBuffer[y - 1]; // get the message from the buffer
            if (message) {
                for (let i = 0; i < message.length; i++) {
                    let spriteLocation = this.charToSpriteLocation(message.charAt(i));
                    createSprite(i + 1, y, spriteLocation, uiMap, message.charCodeAt(i));
                }
            }

            if (y === this.height - 1) {
                createSprite(0, y + 1, BOX_BOTTOM_LEFT, uiMap, 192);
                for (let x = 1; x < this.width - 1; x++) {
                    createSprite(x, y + 1, BOX_HORIZONTAL, uiMap, 196);
                }
                createSprite(this.width - 1, y + 1, BOX_BOTTOM_RIGHT, uiMap, 217);
            }
        }
    }

    charToSpriteLocation(char) {
        let charCode = char.charCodeAt(0);
        let tileNumber = charCode; 
        let spriteColumn = tileNumber % globalVars.SPRITESHEET_COLS;
        let spriteRow = Math.floor(tileNumber / globalVars.SPRITESHEET_COLS);
        
        if(spriteColumn >= globalVars.SPRITESHEET_COLS) {
            spriteColumn = 0;
            spriteRow++;
        }

        //console.log(`Character ${char}, sprite coordinates: ${spriteColumn}, ${spriteRow}`);
        return { x: spriteColumn, y: spriteRow };
    }
    showUIContainer() {
        //console.log("I thought I turned on the UI Mask");
        createjs.Tween.get(uiMaskContainer).to({alpha: 1}, 100) // fade in
        .call(() => {
            uiContainerShown = true;
        });
        uiMaskContainer.alpha = 1;
    }
    
    hideUIContainer() {
        createjs.Tween.get(uiMaskContainer).to({alpha: 0}, 600) // fade out
        .call(() => {
            uiContainerShown = false;
        });
    }
    showBox() {
        if (!uiContainerShown) {
            this.showUIContainer();
        }
        this.hidden = false;
        this.drawUIBox();
    }

    hideBox() {
        this.hidden = true;
        this.clearBox();
    }

    toggleVisibility() {
        this.hidden = !this.hidden;
        if(this.hidden) {
            this.hideBox();
        } else {
            this.showBox();
        }
    }
    // Adds a message to the list
    addMessage(template, parameters = []) {
        if (!uiContainerShown) {
            this.showUIContainer();
        }
        let message = template;
        for(let i = 0; i < parameters.length; i++) {
            message = message.replace(`{${i}}`, parameters[i]);
        }
        this.clearText();
        this.textBuffer.push(message);
        this.render();
    }
    addDotToEndOfLastMessage() {
        let lastMessageIndex = this.textBuffer.length - 1;
    
        if (lastMessageIndex >= 0) {
            let lastMessage = this.textBuffer[lastMessageIndex];
            if (lastMessage.length < this.width - 2) { // -2 to leave space for the borders
                this.textBuffer[lastMessageIndex] += ".";
                this.render();
            }
        }
    }
    clearMessages(){
        this.textBuffer = [];
    }

    clearText(){
        const BLANK_TILE = { x: 0, y: 0 };
        for(let y = 1; y < this.height - 1; y++) {
            for(let x = 1; x < this.width - 1; x++) {
                createSprite(x, y, BLANK_TILE, uiMap, 0);
            }
        }
    }
    
    // Toggles the active state
    toggleActive() {
        this.active = !this.active;
    }

    toggleVisibility() {
        this.hidden = !this.hidden;
    }

    render() {
        this.drawUIBox();
        if (!this.hidden && this.textBuffer.length > 0) {
            this.clearText();
            this.maskBox();
            const BLANK_TILE = { x: 0, y: 0 };
            const lastMessages = this.textBuffer.slice(-this.height + 2);
            for(let i = 0; i < lastMessages.length; i++) {
                let message = lastMessages[i];
                let y = 2 + i;
                for(let j = 0; j < this.width - 2; j++) { // Leave space for the border
                    let spriteLocation;
                    if (j < message.length) {
                        spriteLocation = this.charToSpriteLocation(message.charAt(j));
                    } else {
                        spriteLocation = BLANK_TILE;  // if it's after the end of the message, it's a blank tile
                    }
                    createSprite(j + 1, y, spriteLocation, uiMap, j < message.length ? message.charCodeAt(j) : 0);
                }
            }
            while (this.textBuffer.length > this.height - 2) {
                this.textBuffer.shift();
            }
        }
    }
}
// This function will run when the spritesheet has finished loading
async function setup() {
    try {
        socket = io.connect('http://localhost:3000');
    } catch (error) {
        console.error('Socket connection failed.', error);
    }
    dungeonGeneration();
    addFloorsAndVoid();
    evaluateMapAndCreateWalls();
    addBaseAndShadows();    
    let walkableTiles = [];
    let publicTiles = []
    let currentLevel = new Level();
    levels.push(currentLevel);

    for (let y = 0; y < MAP_HEIGHT; y++) {
        for (let x = 0; x < MAP_WIDTH; x++) {
            if (floorMap[y][x].value === 157) {
                walkableTiles.push({x: x, y: y});
                let tile = {x: x, y: y};
    
                // If the tile is neither in the treasure room nor has a door, then it's public
                if (!isTileInTreasureRoom(tile, currentTreasureRoom)) {
                    publicTiles.push({x: tile.x,y: tile.y});
                } 
            }
        }
    }
    
    //console.log(publicTiles.length);
    let randomTile = publicTiles[Math.floor(Math.random() * publicTiles.length)];

    let randomTile2 = walkableTiles[Math.floor(Math.random() * walkableTiles.length)];

    let randomTile3 = publicTiles[Math.floor(Math.random() * publicTiles.length)];
    let randomTile4 = publicTiles[Math.floor(Math.random() * publicTiles.length)];
    let randomTile5 = publicTiles[Math.floor(Math.random() * publicTiles.length)];
    let randomTile6 = publicTiles[Math.floor(Math.random() * publicTiles.length)];
    let randomTile7 = publicTiles[Math.floor(Math.random() * publicTiles.length)];
    let randomTile8 = publicTiles[Math.floor(Math.random() * publicTiles.length)];
    let randomTile9 = publicTiles[Math.floor(Math.random() * publicTiles.length)];
    let randomTile10 = publicTiles[Math.floor(Math.random() * publicTiles.length)];
    //add exits, they don't work yet
   /*  let downExitTile = publicTiles[Math.floor(Math.random() * publicTiles.length)];
    let upExitTile;
    do {
        upExitTile = publicTiles[Math.floor(Math.random() * publicTiles.length)];
    } while (upExitTile.x === downExitTile.x && upExitTile.y === downExitTile.y); // Make sure it's not the same tile

    
    // Create the exits
    let downExit = new Exit(downExitTile.x, downExitTile.y, "down");
    let upExit = new Exit(upExitTile.x, upExitTile.y, "up");
    
    
    currentLevel.downExitPosition = {x: downExitTile.x, y: downExitTile.y};
    currentLevel.upExitPosition = {x: upExitTile.x, y: upExitTile.y};
    */

    
    
    
    messageList = new UIBox(["Welcome to the Dungeon of Doom!"], MAP_WIDTH, 5);
    inspector = new UIBox([], 30, 15, true);


    // And handle them individually
    messageList.showBox();
    messageList.showUIContainer();
    if (socket) {
        fetch('http://localhost:3000/judgeName')
            .then(response => response.json())
            .then(data => {
                const judgeName = data.judgeName;
                console.log('Judge name:', judgeName);
                if (judgeName != ""){
                    messageList.addMessage(`Your judge is ${judgeName}.`);
                }
            })
            .catch(error => console.error('Error fetching judge name:', error));
    } else {
        messageList.addMessage('You are not connected to the server.');
    }
    messageList.addMessage(`Press 'i' for key commands.`);

    PIXI.Loader.shared.onComplete.add(() => {
        for (let i = 0; i < 7; i++) { // assuming you have 4 frames of fire animation
            let rect = new PIXI.Rectangle(i * globalVars.TILE_WIDTH, 0, globalVars.TILE_WIDTH, globalVars.TILE_HEIGHT);
            let texture = new PIXI.Texture(PIXI.Loader.shared.resources.fire.texture.baseTexture, rect);
            fireFrames.push(texture);
        }

        let scheduler = new ROT.Scheduler.Simple();
        engine = new ROT.Engine(scheduler);
        player = new Player(PlayerType.HUMAN, randomTile.x, randomTile.y, scheduler, engine, messageList, inspector);
        createPlayerSprite(player);
        scheduler.add(player, true); // the player takes turns

        /* player2 = new Player(PlayerType.ROBOT, randomTile5.x, randomTile5.y, scheduler, engine, messageList, inspector);
        createPlayerSprite(player2);
        scheduler.add(player2, true); */

        let basilisk = new Monster(MonsterType.BASILISK, randomTile2.x, randomTile2.y, scheduler, engine, messageList, inspector);
        createMonsterSprite(basilisk);
        scheduler.add(basilisk, true);
        let skeleton1 = new Monster(MonsterType.SKELETON, randomTile6.x, randomTile6.y, scheduler, engine, messageList, inspector);
        createMonsterSprite(skeleton1);
        scheduler.add(skeleton1, true);
        let skeleton2 = new Monster(MonsterType.SKELETON, randomTile7.x, randomTile7.y, scheduler, engine, messageList, inspector);
        createMonsterSprite(skeleton2);
        scheduler.add(skeleton2, true);
        let skeleton3 = new Monster(MonsterType.SKELETON, randomTile8.x, randomTile8.y, scheduler, engine, messageList, inspector);
        createMonsterSprite(skeleton3);
        scheduler.add(skeleton3, true);
        let robot1 = new Monster(MonsterType.ROBOT, randomTile9.x, randomTile9.y, scheduler, engine, messageList, inspector);
        createMonsterSprite(robot1);
        scheduler.add(robot1, true);
        new Item(ItemType.BOW,randomTile3.x, randomTile3.y, 0xFFFFFF, 1);
        new Item(ItemType.ARROW,randomTile4.x, randomTile4.y, 0xFFFFFF, 3);
        new Item(ItemType.CRADLE,randomTile5.x, randomTile5.y, 0xFFFF00, 2);
        new Item(ItemType.MATTOCK,randomTile10.x, randomTile10.y, 0x00FF00, 2);
        /* let chimera = new Monster(MonsterType.CHIMERA, randomTile3.x, randomTile3.y, scheduler, engine, messageList);
        createMonsterSprite(chimera);
        scheduler.add(chimera, true); */

        //add some fire
        for (let i = 0; i < 3; i++) {
            let randomFireTile = walkableTiles[Math.floor(Math.random() * walkableTiles.length)];
            let fire = new Fire(randomFireTile.x, randomFireTile.y, scheduler, '0xFFCC33', 2, atmosphereMap);
            scheduler.add(fire, true); // the fire takes turns
        }

        for (let i = 0; i < 3; i++) {
            let randomKudzuTile = publicTiles[Math.floor(Math.random() * publicTiles.length)];
            let kudzu = new Kudzu(randomKudzuTile.x, randomKudzuTile.y, scheduler, 'left', 2, growthMap);
            scheduler.add(kudzu, true); // the fire takes turns
        }
 
        engine.start(); // start the engine
        resetTurnTimer();
    });

}

