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
			
			this.keys.push(
				group.add(
					new KeyCap(group.game, xPos, yPos,
						keyData.width, decal)));
			
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

var keyboardBack, desk3D, keyboard, finger, fingerShadow, screenGroup;
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
			.image("wood").image("wall").image("shadow-small")
			.spritesheet("key-font", "key-font.png", 12, 12)
			.spritesheet("special-keys", "special-keys.png", 12, 12)
			.spritesheet("small-font", "small-font.png", 6, 9)
			.spritesheet("key-y", "key-y.png", 24, 24)
			.spritesheet("key-g", "key-g.png", 24, 24);
		
		game.load.path = "audio/";
		
		game.load
			.audio("keydown", ["keydown.mp3", "keydown.ogg"])
			.audio("keyup", ["keyup.mp3", "keyup.ogg"]);
	},
	create: function() {
		game.renderer.renderSession.roundPixels = true;
		
		game.add.tileSprite(0, 0, 600, 170, "wall");
		game.add.tileSprite(0, 170, 600, 180, "wood");
		
		keyboardBack = game.add.image(80, 0, "keyboard-back");
		
		// In-game screen group
		screenGroup = game.add.group();
		screenGroup.x = 87;
		// Mask to prevent graphics from escaping screen
		var screenMask = game.make.graphics(0, 0);
		screenMask.beginFill(0x000000);
		screenMask.drawRect(87, 0, 378, 181);
		screenMask.endFill();
		screenGroup.mask = screenMask;
		// Background for screen
		game.add.image(0, 0, "finger", 0, screenGroup);
		
		desk3D = game.add.group();
		
		keyboard = new Keyboard(desk3D, 87, 190);
		for (var k of keyboard.keys)
			if (Math.random() > 0.6) k.setActive(true);
		
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
		
		realIn = game.input.keyboard.addKeys({
			up: Phaser.KeyCode.UP,
			down: Phaser.KeyCode.DOWN,
			left: Phaser.KeyCode.LEFT,
			right: Phaser.KeyCode.RIGHT,
			interact: Phaser.KeyCode.SPACEBAR,
		});
		
		game.input.keyboard.addKeyCapture([
			Phaser.KeyCode.UP,
			Phaser.KeyCode.DOWN,
			Phaser.KeyCode.LEFT,
			Phaser.KeyCode.RIGHT,
			Phaser.KeyCode.SPACEBAR
		]);
		
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
		
		desk3D.sort("depth", Phaser.Group.SORT_ASCENDING);
	},
	preRender: function() {
		fingerShadow.x = finger.x;
		fingerShadow.y = finger.y + (finger.overSomething ? -4 : 0);
	},
	render: function() {
		if (game.showBodies) {
			game.debug.body(finger);
			for (var k of keyboard.keys) {
				game.debug.body(k);
			}
		}
	},
}, false, false);

function fingerUpdate() {
	var elapsed = game.time.elapsed /= 1000;
	
	var dx = 0;
	var dy = 0;
	
	if (realIn.up.isDown) dy -= 1;
	if (realIn.down.isDown) dy += 1;
	if (realIn.left.isDown) dx -= 1;
	if (realIn.right.isDown) dx += 1;
	
	if (dx && dy) {
		dx *= Math.SQRT1_2;
		dy *= Math.SQRT1_2;
	}
	
	this.body.acceleration.set(
		dx * this.movementSpeed.x,
		dy * this.movementSpeed.y);
	
	this.depth = this.y;
	
	if (realIn.interact.isDown && !this.isDown) {
		this.anchor.y = 1;
		this.isDown = true;
		fingerShadow.visible = false;
	} else if (!realIn.interact.isDown && this.isDown) {
		this.anchor.y = 1.1;
		this.isDown = false;
		fingerShadow.visible = true;
	}
}