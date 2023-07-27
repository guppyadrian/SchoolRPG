/* Converts from a grid integer to an xy position object */
function G2P(g, w) {
  return { x: g % w, y: Math.floor(g / w) };
}

/* Same but other direction */
function P2G(p, w) {
  return p.x + p.y * w;
}

var inputDisabled = false;

/* Object containing data about the world and its levels */

class Character {
  constructor(name, pos = {x: 0, y: 0, r: 0}, world = 1) {
    this.name = name;
    this.trans = { pos: pos, world: world, grid: {x: 0, y: 0} };
    this.walkSpeed = 1;
    this.sprintSpeed = 2;
    this.sprinting = false;
    this.idleTime = 0;
    this.anim = {frame: 0, cur: "none", iFrame: 0, loop: -1};
  }

  collision(pos) {
    const x1 = Math.floor(pos.x / GAME.bits + 0.1);
    const y1 = Math.floor(pos.y / GAME.bits + 0.4);
    const x2 = Math.floor(pos.x / GAME.bits - 0.1) + 1;
    const y2 = Math.floor(pos.y / GAME.bits - 0.1) + 1;

    var colls = [{x: x1, y: y1}, {x: x2, y: y1}, {x: x2, y: y2}, {x: x1, y: y2}];
    for (const pos of colls) {
      if (Universe.getColl(this.trans.world, pos) === 1) {
        return true;
      }
    }
    return false;
  }

  move({ x = 0, y = 0, sprint = false }) {
    if (this.collision({x: this.trans.pos.x + x, y: this.trans.pos.y + y})) {
      return false;
    }
    this.trans.pos.x += x;
    this.trans.pos.y += y;

    this.sprinting = sprint;
    if (sprint)
      this.setAnim("runD", false);
    else
      this.setAnim("walkD", false);
    this.idleTime = 0;
    this.updateGrid();
  }

  updateGrid() {
    this.trans.grid = {x: Math.floor(this.trans.pos.x / GAME.bits), y: Math.floor(this.trans.pos.y / GAME.bits)};
  }

  tick() {

    // silly idles!!
    if (this.idleTime >= 1000 && Math.random() > 0.998) {
      this.setAnim("idle1", true, 1);
      this.idleTime = 3;
    }

    // tick up counter + if idle do idle anim
    this.idleTime++;
    if (this.idleTime === 2)
      this.setAnim("idle");
  }

  animTick() {
    if (this.anim.cur === "none") return;

    const char = Characters[this.name];
    const anim = char.animations[this.anim.cur];

    if (anim == undefined) {
      console.error("Invalid animation was played by " + this.name);
      return;
    }

    if (this.anim.iFrame++ >= anim.speed) {
      this.anim.iFrame = 0;
      if (this.anim.frame++ >= anim.end) {
        if (--this.anim.loop === 0)
          this.setAnim("idle");
        this.anim.frame = anim.start;
      }
    }
  }

  setAnim(name, reset = true, loop = true) {
    this.anim.loop = loop;
    if (loop === true)
      this.anim.loop = -1;
    this.anim.cur = name;
    if (reset) {
      this.anim.frame = Characters[this.name].animations[name].start;
      this.anim.iFrame = 0;
    }
  }
}

class PlayableCharacter extends Character {
  constructor(name, pos, world) {
    super(name, pos, world);
  }
}

const MainPlayer = new PlayableCharacter("colten", {x: 224, y: 224, r: 0}, 2);
MainPlayer.setAnim("idle");

function WorldTick() {
  MainPlayer.tick();
  MainPlayer.animTick();
  if (!inputDisabled)
    playerMovement();

  Cam.x = (MainPlayer.trans.pos.x + GAME.bits / 2 - myCanvas.width / 2 / Cam.z);
  Cam.y = (MainPlayer.trans.pos.y + GAME.bits / 2 - myCanvas.height / 2 / Cam.z);

  Cam.x = Math.max(Math.min(Cam.x, (Universe.getWorld(MainPlayer.trans.world).size[0] * GAME.bits - myCanvas.width / Cam.z)), 0); // Clamp X
  Cam.y = Math.max(Math.min(Cam.y, (Universe.getWorld(MainPlayer.trans.world).size[1] * GAME.bits - myCanvas.height / Cam.z)), 0); // Clamp Y

  WorldDraw();
}

function playerMovement() {
  const spd = MainPlayer.sprinting ? MainPlayer.sprintSpeed : MainPlayer.walkSpeed;
  if (Keys.KeyA) {
  	MainPlayer.move({x: -spd, sprint: Keys.ShiftLeft});
  }
  if (Keys.KeyD) {
	  MainPlayer.move({x: spd, sprint: Keys.ShiftLeft});
  }
  if (Keys.KeyW) {
  	MainPlayer.move({y: -spd, sprint: Keys.ShiftLeft});
  }
  if (Keys.KeyS) {
	  MainPlayer.move({y: spd, sprint: Keys.ShiftLeft});
  }
}

function rectDraw2d(px, py, sx, sy, stroke = true) {
  const adjPos = [(px - Cam.x) * Cam.z, (py - Cam.y) * Cam.z, sx * Cam.z, sy * Cam.z];
  if (stroke) {
    ctx.strokeRect(...adjPos);
  } else {
    ctx.fillRect(...adjPos);
  }
}

function BGDraw(worldID) {
  const px = GAME.bits;
  ctx.fillStyle = "black";
  
  if (false) { // Debug mode (should be false)
    for (let x = 0; x < Universe.worlds[worldID].coll.length; x++) {
      let curTilePos = G2P(x, Universe.getWorld(worldID).size[0]);
      let curTile = Universe.getColl(worldID, curTilePos);
      if (curTile === 1)
        rectDraw2d(curTilePos.x * px, curTilePos.y * px, px, px);
    }
  } else { 
    const img = Universe.getWorld(worldID).bg;
    console.log(worldID)
    imageDrawSmp(img, 0, 0, img.width, img.height);
  }
}

function imageDrawSmp(img, px, py, wx, wy) {
  ctx.drawImage(img, (px - Cam.x) * Cam.z, (py - Cam.y) * Cam.z, wx * Cam.z, wy * Cam.z);
}

function imageDrawAdv(img, px, py, sx, sy, s) {
  ctx.drawImage(img, s.x, s.y, s.s, s.s, (px - Cam.x) * Cam.z, (py - Cam.y) * Cam.z, sx * Cam.z, sy * Cam.z);
} 



function CharDraw(char) {
  const px = GAME.bits;
  /* Easing stuff for player movement animation */
  function ease(b, a, percent) {
    return a + (b - a) * percent;
  }

  const drawX = char.trans.pos.x;
  const drawY = char.trans.pos.y;

  const charRef = Characters[char.name];
  if (char.anim.cur === "none") {
    const sheets = charRef.sheets;
    const sheet = sheets[Object.keys(sheets)[0]]; //trust me bro idk how either but this gets the first spritesheet if cur is set to "none"
    const s = {x: 0, y: 0, s: sheet.framePx};
    
    imageDrawAdv(sheet.img, drawX, drawY, px, px, s); 
  } else {
    const anim = charRef.animations[char.anim.cur];
    const sheet = charRef.sheets[anim.img];

    const s = {x: (char.anim.frame % sheet.width) * sheet.framePx, y: Math.floor(char.anim.frame / sheet.width) * sheet.framePx, s: sheet.framePx};
    imageDrawAdv(sheet.img, drawX, drawY, px, px, s);
  }
  
}

function WorldDraw() {
  ctx.clearRect(0, 0, myCanvas.width, myCanvas.height);
  const px = GAME.bits;

  BGDraw(MainPlayer.trans.world);
  ctx.fillStyle = "red";

  CharDraw(MainPlayer);

  var img = new Image();
  img.src = 'greencursor.png';
  ctx.shadowBlur = 25;
  ctx.shadowColor = "green";
  //ctx.drawImage(img, 200, 200, 128, 128);
  ctx.shadowBlur = 0;
}


setInterval(WorldTick, 16.67);
