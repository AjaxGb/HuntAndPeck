"using strict";

Math.clamp = function(a, b, x) {
	return Math.max(a, Math.min(b, x));
};

function KeyCap(scene, x, y, width, text, fontSize) {
	width = (width|0) || 30;
	
	this.sprites = [
		scene.add.sprite(x, y, "key-sliced", 0),
		scene.add.sprite(x + 8, y, "key-sliced", 1),
		scene.add.sprite(x + width - 8, y, "key-sliced", 2),
	];
	this.sprites[0].setOrigin(0, 0);
	this.sprites[1].setOrigin(0, 0).displayWidth = width - 16;
	this.sprites[2].setOrigin(0, 0);
	
	this.text = scene.add.text(x + 7, y + 2, text, {
		color: "#000",
		fixedWidth: 100,
		align: "right",
		fontSize: fontSize,
	});
	
	this.pressed = false;
}
KeyCap.prototype.setPressed = function(pressed) {
	pressed = !!pressed;
	if (this.pressed === pressed) return;
	
	var frameOffset;
	if (pressed) {
		frameOffset = 3;
		this.text.y += 4;
	} else {
		frameOffset = 0;
		this.text.y -= 4;
	}
	
	for (var i = 0; i < 3; i++) {
		this.sprites[i].setFrame(i + frameOffset);
	}
	
	this.pressed = pressed;
};

function Keyboard(scene, startX, startY, layout, keys) {
	layout = layout || Keyboard.layouts.qwerty;
	keys = keys || Keyboard.keys;
	
	this.scene = scene;
	this.keys = [];
	
	var yPos = startY;
	for (var y = 0; y < layout.keys.length; y++) {
		var xPos = startX;
		
		for (var x = 0; x < layout.keys[y].length; x++) {
			var keyName = layout.keys[y][x];
			var keyData = keys[keyName] || keys.default;
			
			this.keys.push(new KeyCap(scene, xPos, yPos,
				keyData.width,
				keyData.text || keyName.toUpperCase(),
				keyData.smallFont ? "10px" : "16px"));
			
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

var game = new Phaser.Game({
	type: Phaser.AUTO,
	width: 600,
	height: 350,
	zoom: 2,
	
	pixelArt: true,
	roundPixels: true,
	
	scene: [
		{
			key: "virtual",
		},
		{
			key: "desk",
			active: true,
			preload: function() {
				this.load.setBaseURL("sprites");
				
				this.load
					.image("finger", "finger.png")
					.spritesheet("key-sliced", "key-0-y.png", {
						frameWidth:  8,
						frameHeight: 24,
					});
			},
			create: function() {
				var scene = this;
				
				this.bounds = { l: 0, t: 0, r: 600, b: 350 };
				
				window.keyboard = new Keyboard(this, 90, 250);
				
				window.finger = this.add.sprite(30, 200, "finger");
				finger.setOrigin(0.73, 1);
				finger.setInteractive();
				finger.update = fingerUpdate;
				finger.velX = 0;
				finger.velY = 0;
				finger.maxVelX = 70;
				finger.maxVelY = 50;
				finger.accelX = 10;
				finger.accelY = 7;
				finger.drag = 0.5;
				
				this.realUp = this.input.keyboard.addKey(
					Phaser.Input.Keyboard.KeyCodes.UP);
				this.realDown = this.input.keyboard.addKey(
					Phaser.Input.Keyboard.KeyCodes.DOWN);
				this.realLeft = this.input.keyboard.addKey(
					Phaser.Input.Keyboard.KeyCodes.LEFT);
				this.realRight = this.input.keyboard.addKey(
					Phaser.Input.Keyboard.KeyCodes.RIGHT);
			},
			update: function(now, elapsed) {
				
				finger.update(now, elapsed);
			}
		},
	],
});

function fingerUpdate(now, elapsed) {
	elapsed /= 1000;
	
	var dx = 0;
	var dy = 0;
	
	if (this.scene.realUp.isDown) dy -= 1;
	if (this.scene.realDown.isDown) dy += 1;
	if (this.scene.realLeft.isDown) dx -= 1;
	if (this.scene.realRight.isDown) dx += 1;
	
	if (dx && dy) {
		dx *= Math.SQRT1_2;
		dy *= Math.SQRT1_2;
	}
	
	if (dx) {
		finger.velX = Math.clamp(
			-finger.maxVelX, finger.maxVelX,
			finger.velX + elapsed * dx * finger.accelX);
	} else {
		finger.velX -= elapsed * finger.velX * finger.drag;
		if (Math.abs(finger.velX) < 0.1) finger.velX = 0;
	}
	
	if (dy) {
		finger.velY = Math.clamp(
			-finger.maxVelY, finger.maxVelY,
			finger.velY + elapsed * dy * finger.accelY);
	} else {
		finger.velY -= elapsed * finger.velY * finger.drag;
		if (Math.abs(finger.velY) < 0.1) finger.velY = 0;
	}
	
	finger.x += finger.velX;
	if (finger.x < this.scene.bounds.l) {
		finger.x = this.scene.bounds.l;
		finger.velX = 0;
	}
	if (finger.x > this.scene.bounds.r) {
		finger.x = this.scene.bounds.r;
		finger.velX = 0;
	}
	finger.y += finger.velY;
	if (finger.y < this.scene.bounds.t) {
		finger.y = this.scene.bounds.t;
		finger.velY = 0;
	}
	if (finger.y > this.scene.bounds.b) {
		finger.y = this.scene.bounds.b;
		finger.velY = 0;
	}
}