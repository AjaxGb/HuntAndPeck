"using strict";

Math.clamp = function(a, b, x) {
	return Math.max(a, Math.min(b, x));
};

function KeyCap(game, x, y, width, decal, active) {
	x |= 0;
	y |= 0;
	width |= 0;
	
	PhaserNineSlice.NineSlice.call(this, game, x, y,
		active ? "key-y" : "key-g", 0, width, 24, {
			top: 0,
			bottom: 0,
			left: 3,
			right: 3,
		});
	
	this.decal = this.addChild(decal);
	decal.anchor.set(0.5, 0.5);
	decal.x = (width / 2)|0;
	decal.y = 9;
	decal.tint = active ? 0x200000 : 0x222034;
	
	this.pressed = false;
	this.active = active;
	
	this.depth = y + 3;
	
	game.physics.enable(this, Phaser.Physics.ARCADE);
	this.body.immovable = true;
	this.body.setSize(width, 19, 0, 3);
}
KeyCap.prototype = Object.create(PhaserNineSlice.NineSlice.prototype);
KeyCap.prototype.constructor = KeyCap;

KeyCap.prototype.setPressed = function(pressed) {
	pressed = !!pressed;
	if (this.pressed === pressed) return;
	
	if (pressed) {
		this.setSlicedTexture(this.active ? "key-y" : "key-g", 1);
		this.decal.y += 4;
		keyDownSound.play();
	} else {
		this.setSlicedTexture(this.active ? "key-y" : "key-g", 0);
		this.decal.y -= 4;
		keyUpSound.play();
	}
	
	this.pressed = pressed;
};

KeyCap.prototype.setActive = function(active) {
	active = !!active;
	if (this.active === active) return;
	
	if (active) {
		this.setSlicedTexture("key-y", +this.pressed);
		this.decal.tint = 0x160000;
	} else {
		this.setSlicedTexture("key-g", +this.pressed);
		this.decal.tint = 0x222034;
	}
	
	this.active = active;
}

KeyCap.prototype.setSlicedTexture = function(key, frame) {
	// Save render texture for later
	var renderTexture = this.texture;
	
	this.loadTexture(key, frame);
	
	this.baseTexture = this.texture.baseTexture;
	this.baseFrame = this.texture.frame;
	
	// Put render texture back
	this.loadTexture(renderTexture);
	this.renderTexture();
};

function Keyboard(group, startX, startY, layout, keys) {
	layout = layout || Keyboard.layouts.qwerty;
	keys = keys || Keyboard.keys;
	
	this.group = group;
	this.keys = [];
	this.ids = {};
	this.pushed = {};
	
	var yPos = startY;
	for (var y = 0; y < layout.keys.length; y++) {
		var xPos = startX;
		
		for (var x = 0; x < layout.keys[y].length; x++) {
			var keyID = layout.keys[y][x];
			
			if (keyID === "{") {
				var stop = layout.keys[y].indexOf("}", x);
				if (stop < 0) break;
				xPos += layout.keys[y].substring(x + 1, stop)|0;
				x = stop;
				continue;
			}
			
			var keyData = keys[keyID] || keys.default;
			
			var decal;
			
			switch (keyData.special) {
			case "word":
				var font = game.add.retroFont("small-font", 6, 9,
					Phaser.RetroFont.TEXT_SET1, 19);
				
				font.autoUpperCase = false;
				font.text = keyData.word;
				
				decal = game.make.image(0, 0, font);
				break;
				
			case "icon":
				decal = game.make.image(0, 0, keyData.icon, keyData.frame);
				break;
				
			default:
				decal = game.make.image(0, 0, "key-font",
					keyFontChars.indexOf(keyData.char || keyID.toUpperCase()));
				break;
			}
			
			var key = group.add(new KeyCap(group.game, xPos, yPos,
				keyData.width, decal));
			this.keys.push(key);
			(this.ids[keyID] || (this.ids[keyID] = [])).push(key);
			
			xPos += keyData.width + 2;
		}
		
		yPos += 20;
	}
}
Keyboard.keys = {
	default: { width: 24 },
	M:    { width: 36, special: "word", word: "Esc"    },
	"Q":  { width: 24, special: "icon", icon: "special-keys", frame: 0 },
	B:    { width: 40, special: "word", word: "Bckspc" },
	T:    { width: 36, special: "word", word: "Tab"    },
	"\\": { width: 28 },
	U:    { width: 44, special: "word", word: "CpsLck" },
	S:    { width: 56, special: "word", word: "Shift"  },
	E:    { width: 46, special: "word", word: "Enter"  },
	$:    { width: 60, special: "word", word: "Shift"  },
	C:    { width: 38, special: "word", word: "Ctrl"   },
	H:    { width: 24, special: "icon", icon: "special-keys", frame: 1 },
	A:    { width: 24, special: "word", word: "Alt"    },
	_:    { width: 130, char: " " },
	P:    { width: 28, special: "word", word: "PgUp"   },
	N:    { width: 28, special: "word", word: "PgDn"   },
	"<":  { width: 28, special: "icon", icon: "special-keys", frame: 4 },
	">":  { width: 28, special: "icon", icon: "special-keys", frame: 5 },
	"^":  { width: 28, special: "icon", icon: "special-keys", frame: 6 },
	"D":  { width: 28, special: "icon", icon: "special-keys", frame: 7 },
};
Keyboard.layouts = {
	qwerty: {
		keys: [
			"M",
			"`1234567890-=B",
			"Tqwertyuiop[]\\",
			"Uasdfghjkl;'E",
			"Szxcvbnm,./$",
			"CHA_ACP^N",
			"{290}<D>",
		],
	}
};
Keyboard.prototype.isDown = function(id) {
	if (Array.isArray(id)) {
		for (var i = id.length - 1; i >= 0; i--) {
			if (this.isDown(id[i])) return true;
		}
		return false;
	}
	
	var array = this.ids[id];
	if (!array) return false;
	for (var i = array.length - 1; i >= 0; i--) {
		if (array[i].pressed) return true;
	}
	return false;
};
Keyboard.prototype.setActive = function(id, active) {
	if (Array.isArray(id)) {
		for (var i = id.length - 1; i >= 0; i--) {
			this.setActive(id[i], active);
		}
		return this;
	}
	
	var array = this.ids[id];
	if (!array) return this;
	
	for (var i = array.length - 1; i >= 0; i--) {
		array[i].setActive(active);
	}
	
	return this;
};

function InputMultimap() {
	this.map = {};
	this.keyUsageCounts = {};
}
InputMultimap.prototype.addMapping = function(id, key) {
	var array = (this.map[id] || (this.map[id] = []));
	
	game.input.keyboard.addKeyCapture(key);
	
	if (Array.isArray(key)) {
		for (var i = key.length - 1; i >= 0; i--) {
			this.keyUsageCounts[key[i]] = (this.keyUsageCounts[key[i]] || 0) + 1;
		}
		
		array.push.apply(array, key);
	} else {
		this.keyUsageCounts[key] = (this.keyUsageCounts[key] || 0) + 1;
		
		array.push(key);
	}
	
	return this;
};
InputMultimap.prototype.removeMapping = function(id, key) {
	var array = this.map[id];
	if (!array) return this;
	
	if (Array.isArray(key)) {
		for (var i = key.length - 1; i >= 0; i--) {
			var keyI = array.indexOf(key[i]);
			if (keyI < 0) return this;
			
			array.splice(keyI, 1);
			
			if (--this.keyUsageCounts[key[i]] <= 0) {
				delete this.keyUsageCounts[key[i]];
				game.input.keyboard.removeKeyCapture(key);
			}
		}
	} else if (key !== undefined) {
		var keyI = array.indexOf(key);
		if (keyI < 0) return this;
		
		array.splice(keyI, 1);
		
		if (--this.keyUsageCounts[key] <= 0) {
			delete this.keyUsageCounts[key];
			game.input.keyboard.removeKeyCapture(key);
		}
	} else {
		for (var i = array.length - 1; i >= 0; i--) {
			if (--this.keyUsageCounts[array[i]] <= 0) {
				delete this.keyUsageCounts[array[i]];
				game.input.keyboard.removeKeyCapture(array[i]);
			}
		}
		delete this.map[id];
	}
};
InputMultimap.prototype.isDown = function(id) {
	var array = this.map[id];
	
	if (!array) return false;
	
	for (var i = array.length - 1; i >= 0; i--) {
		if (game.input.keyboard.isDown(array[i])) {
			return true;
		}
	}
	return false;
};

var keyboardBack, desk3D, keyboard, finger, fingerShadow;
var fingerBounds = { l: 0, t: 0, r: 600, b: 350 };
var realIn;
var keyDownSound, keyUpSound;
var keyFontChars = Phaser.RetroFont.TEXT_SET1;

var game = new Phaser.Game(600, 350, Phaser.CANVAS, document.body, {
	preload: function() {
		game.scale.scaleMode = Phaser.ScaleManager.USER_SCALE;
		game.scale.setUserScale(2, 2);
		
		game.plugins.add(PhaserNineSlice.Plugin);
		
		game.load.path = "sprites/";
		
		game.load
			.image("finger", "finger.png")
			.image("keyboard-back", "keyboard-back.png")
			.image("sky", "sky.png")
			.image("wood").image("wall").image("shadow-small")
			.spritesheet("key-font", "key-font.png", 12, 12)
			.spritesheet("special-keys", "special-keys.png", 12, 12)
			.spritesheet("small-font", "small-font.png", 6, 9)
			.spritesheet("key-y", "key-y.png", 24, 24)
			.spritesheet("key-g", "key-g.png", 24, 24)
			.spritesheet("chicken", "chicken.png", 8, 8)
			.spritesheet("tilemap", "tilemap.png", 8, 8);
		
		game.load.path = "audio/";
		
		game.load
			.audio("keydown", ["keydown.mp3", "keydown.ogg"])
			.audio("keyup", ["keyup.mp3", "keyup.ogg"]);
		
		game.load.path = "levels/";
		
		game.load
			.tilemap("level1", "level1.json", null, Phaser.Tilemap.TILED_JSON);
	},
	create: function() {
		game.renderer.renderSession.roundPixels = true;
		
		game.add.tileSprite(0, 0, 600, 170, "wall");
		game.add.tileSprite(0, 170, 600, 180, "wood");
		
		keyboardBack = game.add.image(77, 0, "keyboard-back");
		
		createScreen();
		
		desk3D = game.add.group();
		
		keyboard = new Keyboard(desk3D, 87, 202);
		keyboard.setActive([
			"w", "a", "s", "d",
			"^", "<", "D", ">",
			"E", "_"], true);
		
		finger = desk3D.create(30, 200, "finger");
		finger.anchor.set(0.73, 1.1);
		finger.update = fingerUpdate;
		game.physics.enable(finger, Phaser.Physics.ARCADE);
		finger.body.setSize(15, 6, 64, 159);
		finger.body.maxVelocity.set(150, 100);
		finger.body.drag.set(90, 50);
		finger.movementSpeed = new Phaser.Point(600, 450);
		finger.isDown = false;
		finger.overSomething = false;
		
		fingerShadow = game.add.image(0, 0, "shadow-small");
		fingerShadow.anchor.set(0.5, 1);
		
		realIn = new InputMultimap()
			.addMapping("up",
				[Phaser.KeyCode.W, Phaser.KeyCode.UP])
			.addMapping("left",
				[Phaser.KeyCode.A, Phaser.KeyCode.LEFT])
			.addMapping("down",
				[Phaser.KeyCode.S, Phaser.KeyCode.DOWN])
			.addMapping("right",
				[Phaser.KeyCode.D, Phaser.KeyCode.RIGHT])
			.addMapping("interact",
				[Phaser.KeyCode.ENTER, Phaser.KeyCode.SPACEBAR]);
		
		keyDownSound = game.add.audio("keydown");
		keyUpSound = game.add.audio("keyup");
	},
	update: function() {
		
		var keysToUnpress = {};
		for (var k in keyboard.pushed) {
			keysToUnpress[k] = keyboard.pushed[k];
		}
		
		finger.overSomething = false;
		if (finger.isDown) {
			game.physics.arcade.overlap(finger, keyboard.keys, function(obj, key) {
				key.setPressed(true);
				
				var keyPos = key.x + "," + key.y;
				keyboard.pushed[keyPos] = key;
				
				delete keysToUnpress[keyPos];
			});
		} else {
			game.physics.arcade.overlap(finger, keyboard.keys, function() {
				finger.overSomething = true;
			});
		}
		
		for (var k in keysToUnpress) {
			keysToUnpress[k].setPressed(false);
			delete keyboard.pushed[k];
		}
		
		updateScreen();
		
		desk3D.sort("depth", Phaser.Group.SORT_ASCENDING);
	},
	preRender: function() {
		fingerShadow.x = finger.x;
		fingerShadow.y = finger.y + (finger.overSomething ? -4 : 0);
		
		renderScreen();
	},
	render: function() {
		if (game.showBodies) {
			game.debug.body(finger);
			for (var k of keyboard.keys) {
				game.debug.body(k);
			}
			game.debug.body(chicken);
			game.debug.body(terrainLayer);
		}
	},
}, false, false);

function fingerUpdate() {
	var elapsed = game.time.elapsed /= 1000;
	
	var dx = 0;
	var dy = 0;
	
	if (realIn.isDown("up")) dy -= 1;
	if (realIn.isDown("down")) dy += 1;
	if (realIn.isDown("left")) dx -= 1;
	if (realIn.isDown("right")) dx += 1;
	
	if (dx && dy) {
		dx *= Math.SQRT1_2;
		dy *= Math.SQRT1_2;
	}
	
	this.body.acceleration.set(
		dx * this.movementSpeed.x,
		dy * this.movementSpeed.y);
	
	this.depth = this.y;
	
	var interactPressed = realIn.isDown("interact");
	if (interactPressed && !this.isDown) {
		this.anchor.y = 1;
		this.isDown = true;
		fingerShadow.visible = false;
	} else if (!interactPressed && this.isDown) {
		this.anchor.y = 1.1;
		this.isDown = false;
		fingerShadow.visible = true;
	}
}

var screenGroup, screenRT, screenImg, chicken, tilemap, terrainLayer;
function createScreen() {
	screenGroup = game.add.group();
	screenGroup.visible = false;
	
	screenRT = game.add.renderTexture(128, 64);
	screenImg = game.add.image(84, 1, screenRT);
	screenImg.width = 128 * 3;
	screenImg.height = 64 * 3;
	
	game.add.image(0, 0, "sky", 0, screenGroup);
	
	tilemap = game.add.tilemap("level1", 8, 8);
	tilemap.addTilesetImage("tilemap");
	tilemap.setCollisionBetween(1, 3);
	
	terrainLayer = tilemap.createLayer(0, null, null, screenGroup);
	
	chicken = game.add.sprite(8 * 3.5, 8 * 4, "chicken", 0, screenGroup);
	chicken.anchor.set(0.375, 1);
	
	game.physics.enable(chicken, Phaser.Physics.ARCADE);
	chicken.body.setSize(5, 8);
	chicken.body.gravity.y = 100;
	chicken.body.linearDamping = 1;
	
	chicken.animations.add("stand", [0], 1, true);
	chicken.animations.add("walk", [1, 0], 4, true);
	chicken.animations.add("peck", [2, 2, 3, 2, 2, 3,
		2, 2, 2, 2, 2, 2, 2, 2], 8, true);
	chicken.animations.add("jump", [4, 0], 1, false);
	chicken.animations.add("fall", [5], 1, true);
}

function updateScreen() {
	game.physics.arcade.collide(chicken, terrainLayer);
	
	var inputX = 0;
	var onGround = chicken.body.blocked.down;
	
	if (keyboard.isDown(["a", "<"])) {
		inputX -= 1;
	}
	if (keyboard.isDown(["d", ">"])) {
		inputX += 1;
	}
	
	chicken.body.velocity.x = inputX * 10;
	
	if (keyboard.isDown(["_", "E"]) && onGround) {
		chicken.body.velocity.y = -40;
	}
	
	// Update animations
	
	if (inputX) {
		var facingRight = chicken.scale.x > 0;
		var shouldFaceRight = inputX > 0;
		
		if (facingRight !== shouldFaceRight) {
			chicken.scale.x *= -1;
		}
	}
	
	if (!onGround && chicken.body.velocity.y > 0) {
		chicken.animations.play("fall");
	} else if (!onGround && chicken.body.velocity.y < 0) {
		chicken.animations.play("jump");
	} else if (inputX) {
		chicken.animations.play("walk");
	} else {
		chicken.animations.play("stand");
	}
}

var ROUNDING_ERROR = 0.0000001;

function renderScreen() {
	
	var xRound = Math.round(chicken.x);
	var yRound = Math.round(chicken.y);
	
	if (Math.abs(xRound - chicken.x) < ROUNDING_ERROR) {
		chicken.position.x = xRound;
	}
	
	if (Math.abs(yRound - chicken.y) < ROUNDING_ERROR) {
		chicken.position.y = yRound;
	}
	
	screenGroup.visible = true;
	screenRT.renderRawXY(screenGroup, 0, 0);
	screenGroup.visible = !!game.showBodies;
}

game.showBodies = true;