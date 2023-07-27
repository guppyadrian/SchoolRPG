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