const Attacks = {};

const Characters = {
  guppy: {
    sheets: {
      first: {
        img: toImage("./spriteSheets/guppy/first.png"),
        offset: { x: 0, y: 0 },
        framePx: 32,
        width: 2,
      },
    },
    animations: {
      idle: {
        img: "first",
        speed: 20,
        start: 0,
        end: 2,
      },
    },
  },
  colten: {
    sheets: {
      "coltenidle.png": {
        img: toImage("./spriteSheets/colten/coltenidle.png"),
        offset: { x: 0, y: 0 },
        framePx: 32,
        width: 2,
      },
      "phonetype1.png": {
        img: toImage("./spriteSheets/colten/phonetype1.png"),
        offset: { x: 0, y: 0 },
        framePx: 32,
        width: 7,
      },
      "coltenwalkD.png": {
        img: toImage("./spriteSheets/colten/coltenwalkD.png"),
        offset: { x: 0, y: 0 },
        framePx: 32,
        width: 3,
      },
      "Coltensprintdown.png": {
        img: toImage("./spriteSheets/colten/Coltensprintdown.png"),
        offset: { x: 0, y: 0 },
        framePx: 32,
        width: 3,
      },
      "coltendance1_1.png": {
        img: toImage("./spriteSheets/colten/coltendance1_1.png"),
        offset: { x: 0, y: 0 },
        framePx: 32,
        width: 3,
      },
      "coltenwalksideunfinished_1.png": {
        img: toImage("./spriteSheets/colten/coltenwalksideunfinished_1.png"),
        offset: { x: 0, y: 0 },
        framePx: 32,
        width: 3,
      },
      "coltenwalkleft.png": {
        img: toImage("./spriteSheets/colten/coltenwalkleft.png"),
        offset: { x: 0, y: 0 },
        framePx: 32,
        width: 3,
      }
    },
    animations: {
      idle: { img: "coltenidle.png", speed: 10, start: 0, end: 3 },
      idle1: { img: "phonetype1.png", speed: 5, start: 0, end: 54 },
      walkD: { img: "coltenwalkD.png", speed: 5, start: 0, end: 9 },
      runD: { img: "Coltensprintdown.png", speed: 3, start: 0, end: 9 },
      dance1: { img: "coltendance1_1.png", speed: 5, start: 0, end: 9 },
      walkR:  {img: "coltenwalksideunfinished_1.png", speed: 5, start: 0, end: 9 },
      walkL:  {img: "coltenwalkleft.png", speed: 5, start: 0, end: 9 },
    },
  },
  jimbo: {
    sheets: {
      first: {
        img: toImage("./spriteSheets/jimbo/jimbofirst.png"),
        offset: { x: 0, y: 0 },
        framePx: 32,
        width: 3,
      },
    },
    animations: {
      idle: {
        img: "first",
        speed: 15,
        start: 7,
        end: 10,
      },
      run: {
        img: "first",
        speed: 4,
        start: 0,
        end: 6,
      },
    },
  },
};

const Animation = {};

const guy = {
  frame: 0,
  curAnim: "idle",
  draw: function () {
    ctx.clearRect(0, 0, 500, 500);

    const char = Characters.guppy;
    const anim = char.animations[this.curAnim];
    const sheet = char.sheets[anim.img];

    ctx.drawImage(
      sheet.img,
      (this.frame % sheet.width) * sheet.framePx,
      Math.floor(this.frame / sheet.width) * sheet.framePx,
      sheet.framePx,
      sheet.framePx,
      0,
      0,
      32,
      32
    );
    if (this.frame++ === anim.end) this.frame = anim.start;
  },
};

x = {
  sheets: {
    "New Piskel (3).png": {
      img: 'toImage("./spriteSheets/guppy/New Piskel (3).png")',
      offset: { x: 0, y: 0 },
      framePx: 32,
      width: 3,
    },
  },
  animations: {
    run: { img: "New Piskel (3).png", speed: 3, start: 0, end: 6 },
  },
};
