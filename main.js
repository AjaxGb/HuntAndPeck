var qwerty = [
	"Tqwertyuiop[]\\",
	"Uasdfghjkl;'E",
	"Szxcvbnm,./S",
];
var special = {
	T: { text: "Tab",      extraW: 10, sprite: 1 },
	U: { text: "CpsLck",   extraW: 25, sprite: 2 },
	S: { text: "Shift",    extraW: 40, sprite: 3 },
	E: { text: "Enter",    extraW: 25, sprite: 2 },
};
var keyWidths = [30, 40, 55, 70];

var KeyCap = new Phaser.Class({
	Extends: Phaser.GameObjects.Group,
	
	initialize: function KeyCap(scene, x, y, key) {
		Phaser.GameObjects.Group.call(this, scene);
		
		this.create(0, 0, "key-0-y");
	}
});

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
				
				for (var i = 0; i <= 3; ++i) {
					this.load.spritesheet("key-"+i+"-g", "key-"+i+"-g.png", {
						frameWidth:  keyWidths[i],
						frameHeight: 30,
					}).spritesheet("key-"+i+"-y", "key-"+i+"-y.png", {
						frameWidth:  keyWidths[i],
						frameHeight: 30,
					});
				}
			},
			create: function() {
				for (var y = 0; y < qwerty.length; ++y) {
					var xPos = 5;
					for (var x = 0; x < qwerty[y].length; ++x) {
						var key = qwerty[y][x];
						var data = special[key] || {
							text: key.toUpperCase(),
							extraW: 0,
							sprite: 0,
							normal: true,
						};
						var width = 32 + data.extraW;
						
						var cap = this.add.sprite(xPos, 5 + y * 26, "key-"+data.sprite+"-y");
						cap.setOrigin(0, 0);
						window.cap = cap;
						window.text = this.add.text(xPos + 10, 10 + y * 26, data.text, {
							color: "#000",
							fixedWidth: 100,
							align: "right",
							fontSize: data.normal ? "16px" : "10px",
						});
						xPos += width;
					}
				}
			},
		},
	],
	
	pixelArt: true,
});