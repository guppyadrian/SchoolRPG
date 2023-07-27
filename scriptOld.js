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
  constructor(name, pos = {x: 0, y: 0, r: 0}) {
    this.name = name;
    this.trans = { pos: pos, world: 1 };
    this.walkInfo = { frame: 0, prev: { x: 0, y: 0 }, endAnim: false };
    this.walkSpeed = 25;
    this.sprintSpeed = 15;
    this.idleTime = 0; // Timer for Silly Idle Animations 1!1!!
    this.sprinting = false;
    this.anim = {frame: 0, cur: "none", iFrame: 0, loop: -1};
  }

  move({ x = 0, y = 0, sprint = false }) {
    if (
    	Universe.getColl(
			this.trans.world, 
			{ x: this.trans.pos.x + x, y: this.trans.pos.y + y }
		) === 1) {
      console.log("collision!");
      return;
    }
	if (this.walkInfo.frame !== 0) return;
	this.walkInfo.prev = { ...this.trans.pos };
  this.trans.pos.x += x;
  this.trans.pos.y += y;
	this.walkInfo.frame = 1;
  this.walkInfo.endAnim = false;
  this.idleTime = 0;
  this.sprinting = sprint;
  if (sprint)
    this.setAnim("runD", false);
  else
    this.setAnim("walkD", false);
  }

  changeWorld(world, spawnPos) {
    this.trans.world = world;
    this.trans.pos = G2P(spawnPos, Universe.getWorld(world).size[0]);
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

  tick() {

    // silly idles!!
    if (this.idleTime >= 1000 && Math.random() > 0.998) {
      this.setAnim("idle1", true, 1);
      this.idleTime = 0;
    }

    // If idle then tick up counter and exit function
    if (this.walkInfo.frame === 0) {
      this.idleTime++;
      if (this.walkInfo.endAnim) return;
      this.walkInfo.endAnim = true;
      this.setAnim("idle");
      return;
    }

    // otherwise increase the walk frame + check to see if on a special tile
    this.walkInfo.frame += 1;
    const spd = this.sprinting ? this.sprintSpeed : this.walkSpeed;
	  if (this.walkInfo.frame === spd) {
	    this.walkInfo.frame = 0;
		  this.walkInfo.prev = { ...this.trans.pos };
      const worl = Universe.getWorld(this.trans.world);
      const gp = P2G(this.trans.pos, worl.size[0]);
      if (gp in worl.transition) {
        this.changeWorld(...worl.transition[gp]);
      }
	  }
  }
}

class PlayableCharacter extends Character {
  constructor(name, pos) {
    super(name, pos);
  }
}

const MainPlayer = new PlayableCharacter("colten", {x: 2, y: 2, r: 0});
MainPlayer.setAnim("idle");

function WorldTick() {
  MainPlayer.tick();
  MainPlayer.animTick();
  if (!inputDisabled)
    playerMovement();
  Cam.x = (GAME.bits * (MainPlayer.trans.pos.x + 0.5) - myCanvas.width / 2 / Cam.z);
  Cam.y = (GAME.bits * (MainPlayer.trans.pos.y + 0.5) - myCanvas.height / 2 / Cam.z);
  if (MainPlayer.walkInfo.frame !== 0) { /* Account for player transition */
    const spd = (MainPlayer.sprinting ? MainPlayer.sprintSpeed : MainPlayer.walkSpeed);
    Cam.x -= (MainPlayer.trans.pos.x - MainPlayer.walkInfo.prev.x) / spd * (spd - MainPlayer.walkInfo.frame) * GAME.bits;
    Cam.y -= (MainPlayer.trans.pos.y - MainPlayer.walkInfo.prev.y) / spd * (spd - MainPlayer.walkInfo.frame) * GAME.bits;
  }
  Cam.x = Math.max(Math.min(Cam.x, (Universe.getWorld(MainPlayer.trans.world).size[0] * GAME.bits - myCanvas.width / Cam.z)), 0); // Clamp X
  Cam.y = Math.max(Math.min(Cam.y, (Universe.getWorld(MainPlayer.trans.world).size[1] * GAME.bits - myCanvas.height / Cam.z)), 0); // Clamp Y
  WorldDraw();
}

function playerMovement() {
  if (Keys.KeyA) {
  	MainPlayer.move({x: -1, sprint: Keys.ShiftLeft});
  }
  if (Keys.KeyD) {
	  MainPlayer.move({x: 1, sprint: Keys.ShiftLeft});
  }
  if (Keys.KeyW) {
  	MainPlayer.move({y: -1, sprint: Keys.ShiftLeft});
  }
  if (Keys.KeyS) {
	  MainPlayer.move({y: 1, sprint: Keys.ShiftLeft});
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
  /* Currently draws collision, should be only enabled when in debug*/
  for (let x = 0; x < Universe.worlds[worldID].coll.length; x++) {
    let curTilePos = G2P(x, Universe.getWorld(worldID).size[0]);
    let curTile = Universe.getColl(worldID, curTilePos);
    if (curTile === 1)
      rectDraw2d(curTilePos.x * px, curTilePos.y * px, px, px);
  }
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

  var drawX = 0;
  var drawY = 0;

  if (char.walkInfo.frame === 0) {
    drawX = char.trans.pos.x * px;
    drawY = char.trans.pos.y * px;
  } else {
    const spd = char.sprinting ? char.sprintSpeed : char.walkSpeed;
    drawX = ease(char.trans.pos.x, char.walkInfo.prev.x, char.walkInfo.frame / spd) * px
    drawY = ease(char.trans.pos.y, char.walkInfo.prev.y, char.walkInfo.frame / spd) * px;  
  }
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
