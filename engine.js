const myCanvas = document.getElementById("myCanvas");
const ctx = myCanvas.getContext("2d");
ctx.imageSmoothingEnabled = false;
const GAME = {
	bits: 32
}

var Keys = {
	KeyW: false,
	KeyA: false,
	KeyS: false,
	KeyD: false,
	ShiftLeft: false
};

const fps = {
	prev: [0, 0, 0],
	average: 0,
	counter: 0,
	updateFPS: function () {
		this.prev.push(this.counter);
		this.prev.shift();
		this.counter = 0;
		this.average = Math.round(this.prev.reduce((a, b) => a + b, 0) / this.prev.length);
	}
};

setInterval(() => {fps.updateFPS()}, 1000);

function keyEvent(key, down = true) {
	Keys[key.code] = down;
}

function toImage(link) {
  const img = new Image();
  img.src = link;
  return img;
}

var Cam = { x: 0, y: 0, z: 5 };
const exampleImage = new Image();
exampleImage.src = "gd1.png";
addEventListener('keydown', k => keyEvent(k, true));

addEventListener('keyup', k => keyEvent(k, false));

class SpriteClass {
	constructor() {
		this.trans = {pos: {x: 0, y: 0, z: 1}};

	}
}