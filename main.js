"using strict";

Math.clamp = function(a, b, x) {
	return Math.max(a, Math.min(b, x));
};

function KeyCap(game, x, y, width, decal, active) {
	PhaserNineSlice.NineSlice.call(this, game, x, y,
		active ? "key-y" : "key-g", 0, width, 24, {
			top: 0,
			bottom: 0,
			left: 3,
			right: 3,
		});
	
	this.decal = this.addChild(decal);
	
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
	} else {
		this.setSlicedTexture(this.active ? "key-y" : "key-g", 0);
		this.decal.y -= 4;
	}
	
	this.pressed = pressed;
};

KeyCap.prototype.setActive = function(active) {
	active = !!active;
	if (this.active === active) return;
	
	if (active) {
		this.setSlicedTexture("key-y", +pressed);
	} else {
		this.setSlicedTexture("key-g", +pressed);
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
	
	var yPos = startY;
	for (var y = 0; y < layout.keys.length; y++) {
		var xPos = startX;
		
		for (var x = 0; x < layout.keys[y].length; x++) {
			var keyName = layout.keys[y][x];
			var keyData = keys[keyName] || keys.default;
			var label = keyData.text || keyName.toUpperCase();
			
			var decal;
			// if (keyData.smallFont) {
			// 	decal = game.make.retroFont("small-font", 6, 9,
			// 		Phaser.RetroFont.TEXT_SET1, 19);
				
			// 	decal.autoUpperCase = false;
			// 	decal.text = label;
			// } else {
				decal = game.make.image(0, 0, "key-font",
					keyFontChars.indexOf(label));
			// }
			
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
	T: { text: "Tab",    width: 36, smallFont: true },
	"\\": { width: 28 },
	U: { text: "CpsLck", width: 44, smallFont: true },
	S: { text: "Shift",  width: 56, smallFont: true },
	E: { text: "Enter",  width: 46, smallFont: true },
	$: { text: "Shift",  width: 60, smallFont: true },
};
Keyboard.layouts = {
	qwerty: {
		keys: [
			"Tqwertyuiop[]\\",
			"Uasdfghjkl;'E",
			"Szxcvbnm,./$",
		],
	}
};

var desk3D, keyboard, finger;
var fingerBounds = { l: 0, t: 0, r: 600, b: 350 };
var realIn, hover = [];
var keyFontChars = Phaser.RetroFont.TEXT_SET1;

var game = new Phaser.Game(600, 350, Phaser.AUTO, document.body, {
	preload: function() {
		game.scale.scaleMode = Phaser.ScaleManager.USER_SCALE;
		game.scale.setUserScale(2, 2);
		
		game.plugins.add(PhaserNineSlice.Plugin);
		
		game.load.path = "sprites/";
		
		game.load
			.image("finger", "finger.png")
			.spritesheet("key-font", "key-font.png", 12, 12)
			.spritesheet("small-font", "small-font.png", 6, 9)
			.spritesheet("key-y", "key-y.png", 24, 24)
			.spritesheet("key-g", "key-g.png", 24, 24);
	},
	create: function() {
		game.stage.backgroundColor = 0x990000;
		
		desk3D = game.add.group();
		
		keyboard = new Keyboard(desk3D, 90, 250);
		
		finger = desk3D.create(30, 200, "finger");
		finger.anchor.set(0.73, 1);
		finger.update = fingerUpdate;
		game.physics.enable(finger, Phaser.Physics.ARCADE);
		finger.body.setSize(15, 6, 64, 159);
		finger.body.maxVelocity.set(150, 100);
		finger.body.drag.set(90, 50);
		finger.movementSpeed = new Phaser.Point(600, 450);
		
		realIn = game.input.keyboard.addKeys({
			up: Phaser.KeyCode.UP,
			down: Phaser.KeyCode.DOWN,
			left: Phaser.KeyCode.LEFT,
			right: Phaser.KeyCode.RIGHT,
			interact: Phaser.KeyCode.SPACE,
		});
	},
	update: function() {
		
		for (var hovered of hover) {
			hovered.setPressed(false);
		}
		hover.length = 0;
		
		game.physics.arcade.overlap(finger, keyboard.keys, function(f, k) {
			k.setPressed(true);
			hover.push(k);
		});
		
		desk3D.sort("depth", Phaser.Group.SORT_ASCENDING);
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
}