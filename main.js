"using strict";

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
				
				window.keyboard = new Keyboard(this, 90, 250);
				
				window.finger = this.add.sprite(30, 200, "finger");
				finger.setOrigin(0, 1);
				finger.setInteractive();
				
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
				elapsed = elapsed / 1000;
				var dx = 0;
				var dy = 0;
				
				if (this.realUp.isDown) dy -= 20;
				if (this.realDown.isDown) dy += 20;
				if (this.realLeft.isDown) dx -= 30;
				if (this.realRight.isDown) dx += 30;
				
				if (!dx) {
					finger.x = Math.round(finger.x);
				}
				if (!dy) {
					finger.y = Math.round(finger.y);
				}
				if (dx && dy) {
					dx *= Math.SQRT1_2;
					dy *= Math.SQRT1_2;
				}
				
				finger.x += elapsed * dx;
				finger.y += elapsed * dy;
				
			}
		},
	],
});