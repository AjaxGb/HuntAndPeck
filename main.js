"using strict";

Math.clamp = function(a, b, x) {
	return Math.max(a, Math.min(b, x));
};

function KeyCap(game, x, y, width, text, fontSize) {
	PhaserNineSlice.NineSlice.call(this, game, x, y, "key-y", 0, width, 24, {
		top: 0,
		bottom: 0,
		left: 3,
		right: 3,
	});
	
	this.text = this.addChild(game.make.text(0, 0, text, {
		color: "#000",
		fixedWidth: 100,
		boundsAlignH: "center",
		boundsAlignV: "middle",
		fontSize: fontSize,
	}).setTextBounds(0, 0, width, 24));
	
	this.pressed = false;
	
	this.aabb = { l: 0, r: width, t: 4, b: 24};
}
KeyCap.prototype = Object.create(PhaserNineSlice.NineSlice.prototype);
KeyCap.prototype.constructor = KeyCap;

KeyCap.prototype.setPressed = function(pressed) {
	pressed = !!pressed;
	if (this.pressed === pressed) return;
	
	// Save render texture for later
	var renderTexture = this.texture;
	
	if (pressed) {
		this.loadTexture("key-y", 1);
		this.text.y += 4;
	} else {
		this.loadTexture("key-y", 0);
		this.text.y -= 4;
	}
	this.baseTexture = this.texture.baseTexture;
	this.baseFrame = this.texture.frame;
	
	// Put render texture back
	this.loadTexture(renderTexture);
	this.renderTexture();
	
	this.pressed = pressed;
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
			
			this.keys.push(
				group.add(
					new KeyCap(group.game, xPos, yPos,
						keyData.width,
						keyData.text || keyName.toUpperCase(),
						keyData.smallFont ? "10px" : "16px")));
			
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
var realKeys, hover = [];

var game = new Phaser.Game(600, 350, Phaser.AUTO, document.body, {
	preload: function() {
		game.plugins.add(PhaserNineSlice.Plugin);
		
		game.load.path = "sprites/";
		
		game.load
			.image("finger", "finger.png")
			.spritesheet("key-y", "key-0-y.png", 24, 24);
	},
	create: function() {
		game.scale.scaleMode = Phaser.ScaleManager.USER_SCALE;
		game.scale.setUserScale(2, 2);
		
		desk3D = game.add.group();
		
		keyboard = new Keyboard(desk3D, 90, 250);
		
		finger = desk3D.create(30, 200, "finger");
		finger.anchor.set(0.73, 1);
		finger.update = fingerUpdate;
		finger.velX = 0;
		finger.velY = 0;
		finger.maxVelX = 70;
		finger.maxVelY = 50;
		finger.maxAccelX = 10;
		finger.maxAccelY = 7;
		finger.drag = 1.2;
		finger.aabb = { l: -7, t: -6, r: 7, b: 0 };
		
		realKeys = game.input.keyboard.addKeys({
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
		hover = [];
		for (var key of keyboard.keys) {
			if (aabbCollide(key.x, key.y, key.aabb,
				finger.x, finger.y, finger.aabb)) {
				
				key.setPressed(true);
				hover.push(key);
			}
		}
	}
}, false, false);

function fingerUpdate() {
	var elapsed = game.time.elapsed /= 1000;
	
	var dx = 0;
	var dy = 0;
	
	if (realKeys.up.isDown) dy -= 1;
	if (realKeys.down.isDown) dy += 1;
	if (realKeys.left.isDown) dx -= 1;
	if (realKeys.right.isDown) dx += 1;
	
	if (dx && dy) {
		dx *= Math.SQRT1_2;
		dy *= Math.SQRT1_2;
	}
	
	if (dx) {
		this.velX = Math.clamp(
			-this.maxVelX, this.maxVelX,
			this.velX + elapsed * dx * this.maxAccelX);
	} else {
		this.velX -= elapsed * this.velX * this.drag;
		if (Math.abs(this.velX) < 0.1) this.velX = 0;
	}
	
	if (dy) {
		this.velY = Math.clamp(
			-this.maxVelY, this.maxVelY,
			this.velY + elapsed * dy * this.maxAccelY);
	} else {
		this.velY -= elapsed * this.velY * this.drag;
		if (Math.abs(this.velY) < 0.1) this.velY = 0;
	}
	
	this.x += this.velX;
	if (this.x < fingerBounds.l) {
		this.x = fingerBounds.l;
		this.velX = 0;
	}
	if (this.x > fingerBounds.r) {
		this.x = fingerBounds.r;
		this.velX = 0;
	}
	this.y += this.velY;
	if (this.y < fingerBounds.t) {
		this.y = fingerBounds.t;
		this.velY = 0;
	}
	if (this.y > fingerBounds.b) {
		this.y = fingerBounds.b;
		this.velY = 0;
	}
	
	this.depth = this.y;
}

function aabbCollide(x1, y1, rect1, x2, y2, rect2) {
	return (
		x1 + rect1.l < x2 + rect2.r &&
		x1 + rect1.r > x2 + rect2.l &&
		y1 + rect1.t < y2 + rect2.b &&
		y1 + rect1.b > y2 + rect2.t);
}
function aabbCollidePoint(x1, y1, rect1, x2, y2) {
	return (
		x1 + rect1.l < x2 &&
		x1 + rect1.r > x2 &&
		y1 + rect1.t < y2 &&
		y1 + rect1.b > y2);
}