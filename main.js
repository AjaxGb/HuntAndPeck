"using strict";

function KeyCap(scene, x, y, width, text, fontSize) {
	width = (width|0) || 30;
	
	this.sprites = [
		scene.add.sprite(x, y, "key-sliced", 0),
		scene.add.sprite(x + 10, y, "key-sliced", 1),
		scene.add.sprite(x + width - 10, y, "key-sliced", 2),
	];
	this.sprites[0].setOrigin(0, 0);
	this.sprites[1].setOrigin(0, 0).displayWidth = width - 20;
	this.sprites[2].setOrigin(0, 0);
	
	this.text = scene.add.text(x + 10, y + 5, text, {
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
		
		yPos += 26;
	}
}
Keyboard.keys = {
	default: { width: 30 },
	T: { text: "Tab",    width: 40, smallFont: true },
	"\\": { width: 38 },
	U: { text: "CpsLck", width: 55, smallFont: true },
	S: { text: "Shift",  width: 70, smallFont: true },
	$: { text: "Shift",  width: 72, smallFont: true },
	E: { text: "Enter",  width: 55, smallFont: true },
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
	width: 550,
	height: 350,
	zoom: 2,
	
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
						frameWidth:  10,
						frameHeight: 30,
					});
			},
			create: function() {
				window.keyboard = new Keyboard(this, 5, 5);
			},
		},
	],
	
	pixelArt: true,
});