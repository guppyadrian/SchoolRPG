const moveSet = {
  punch: { atks: [{ dmg: 1, kb: { x: 1, y: 0 }, pos: { x: 0, y: 0 } }], range: "melee", name: "Punch!", id: "punch" },
  fartlol: { atks: [
    { dmg: 1, kb: { x: 1, y: 0 }, pos: { x: 1, y: 0 } },
    { dmg: 1, kb: { x: -1, y: 0 }, pos: { x: -1, y: 0 } },
    { dmg: 1, kb: { x: 0, y: 1 }, pos: { x: 0, y: 1 } },
    { dmg: 1, kb: { x: 0, y: -1 }, pos: { x: 0, y: -1 } }
  ], range: "self", name: "FART ATTACK", id: "fartlol" }

};

var niceCameraEase = {x: 0, cur: 0, end: 0, cury: 0, endy: 0};

function battleInit() {
  Cam = {x: 0, y: 50, z: 2};
}

class cursorClass{
  constructor(battle, pos = {x: 0, y: 0}) {
    this.pos = pos;
    this.sel = undefined;
    this.selPos = { x: 0, y: 0 };
    this.battle = battle;
    this.selectOptions = [];
    this.phase = undefined;
    this.curAtkID = undefined;
  }

  selectOld() {
    const tar = this.battle.getGrid(this.pos);
    if (this.sel === undefined) {
      if (typeof tar === 'object' && tar.type === 'friend' && tar.moved === false) {
        this.sel = "player";
        this.selPos = {x: this.pos.x, y: this.pos.y};
        this.selectOptions = this.battle.generateWalkPath(this.pos, 3); /* CHANGE TO ACCOUNT FOR PLAYER RANGE */
      }
    } else if (this.sel === 'player') {
      const cursorTar = this.selectOptions[Cursor.pos.x][Cursor.pos.y];
      if (typeof cursorTar === "object") {
        this.battle.getGrid(Cursor.selPos).turnMoveTo(Cursor.pos);
        this.deselect();
      }
    }
  }

  select() {


    if (this.phase === 1) {
      const cursorTar = this.selectOptions[this.pos.x][this.pos.y];
      if (typeof cursorTar === 'object') {
        this.battle.getGrid(this.selPos).turnMoveTo(this.pos);
        this.selPos = {...this.pos};
        this.phase = 2;
        const tar = this.battle.getGrid(this.pos);
        this.selectOptions = this.battle.generateAttackPath(this.pos, tar.moves[0].range);
        this.curAtkID = 0;
      }
    } else if (this.phase === 2) {
      const cursorTar = this.selectOptions[this.pos.x][this.pos.y];
      if (typeof cursorTar === 'object') { //make sure it is applicable spot
        const selTar = this.battle.getGrid(Cursor.selPos);
        selTar.attack(selTar.moves[this.curAtkID], Cursor.pos, cursorTar.dir);
        this.findUnused();
      }
    }


    /* 
      this.sel = player
      on press Q/E: this.sel = otherPlayer if !moved or !attacked
      if phase === 1
      move
      if phase === 2
      get attack spots
      attack
      this.sel = new player
      if (no chars then sel = undefined)

    */
  }

  deselect() {
    this.sel = undefined;
    this.selPos = {x: 0, y: 0};
    this.selectOptions = [];
    this.phase = undefined;
  }

  findUnused(otherDir = false) {
    var noOptions = false;
    for (let u = 0; u < this.battle.units.length; u++) {
      const i = (u + (this.sel === undefined ? 0 : this.sel)) % this.battle.units.length;
      if (this.battle.units[i].moved === false) {
        if (i === this.sel) {
          noOptions = true;
          continue;
        }
        this.sel = i;
        this.phase = 1;
        this.selPos = this.battle.units[i].pos;
        console.log(this.selPos);
        this.selectOptions = this.battle.generateWalkPath(this.selPos, 3); /* CHANGE TO ACCOUNT FOR PLAYER RANGE */
        this.pos = {...this.selPos};
        return;
      }
    }
    if (!noOptions)
      this.deselect();
  }
}


class battleClass {
  constructor(rows = 5, cols = 9) {
    this.rows = rows;
    this.cols = cols;
    this.field = Array(cols).fill(0).map(x => Array(rows).fill(0));
    this.units = [];
  }

  getGrid(pos) {
    if (!this.inBound(pos)) return undefined;
    return this.field[pos.x][pos.y];
  }

  /* Get all possible paths to tiles in range */
  generateWalkPath(origin, range) {
    var map = Array(this.cols).fill(0).map(x => Array(this.rows).fill(0));
    for (const x in map) {
      for (const y in map[x]) {
        if (this.getGrid({x: x, y: y}) !== 0)
          map[x][y] = 1;
      }
    }
    function spread(pos, stepsLeft, retrace) {
      for (let i = 0; i < 4; i++) {
        const tar = addPos(pos, rotateCoord(undefined, i));
        if (tar.x < 0 || tar.x >= map.length) continue;
        if (tar.y < 0 || tar.y >= map[0].length) continue;
        map[pos.x][pos.y] = {stepsLeft: stepsLeft, retrace: [...retrace, pos]}
        if (stepsLeft === 0) continue;
        if (map[tar.x][tar.y] === 0 || (map[tar.x][tar.y] !== 1 && map[tar.x][tar.y].stepsLeft < stepsLeft)) {
          spread(tar, stepsLeft - 1, [...retrace, pos]);
        }
      }
    }
    spread({...origin}, range, []);
    return (map);
  }

  getDamageAmount(origin, attack) {
    var bestDamage = 0;
    for (let r = 0; r < 4; r++) {
      var damage = 0;
      for (const atk of attack.atks) {
        const rot = rotateCoord(atk.pos, r);
        const pos = {x: origin.x + rot.x, y: origin.y + rot.y};
        if (!this.inBound(pos)) continue;
        if (typeof this.field[pos.x][pos.y] !== "object" || this.field[pos.x][pos.y].type !== "friend") continue;
        damage += atk.dmg;
      }
      if (damage > bestDamage) bestDamage = damage;
    }
    return bestDamage;
  }

  /*  Generate attack path for an attack at every position reachable  */
  generateAttackSpots(origin, range, attacks) {
    var map = Array(this.cols).fill(0).map(x => Array(this.rows).fill(0));
    const moveMap = this.generateWalkPath(origin, range);

    /* Loop through movement map and find available spots to move to */
    for (let x = 0; x < map.length; x++) {
      for (let y = 0; y < map.length; y++) {
        if (typeof moveMap[x][y] !== 'object') continue;
        for (const atk of attacks) {

          /* Get attack map for the spot and see if a player is on it */
          var attackMap = this.generateAttackPath({x: x, y: y}, atk.range);
          for (let ax = 0; ax < attackMap.length; ax++) {
            for (let ay = 0; ay < attackMap[ax].length; ay++) {
              
              if (typeof attackMap[ax][ay] !== "object") continue;
              const dmg = this.getDamageAmount({x: ax, y: ay}, atk);
              if (dmg === 0) continue;
              if (map[ax][ay] === 0 || dmg > map[ax][ay].dmg) {
                map[ax][ay] = {dmg: dmg, atk: atk.id, move: {x: x, y: y}, dir: attackMap[ax][ay].dir};
              }
            }
          }
        }
      }
    }
    return map;
  }

  generateAttackPath(origin, range) {
    var map = Array(this.cols).fill(0).map(x => Array(this.rows).fill(0));
    for (const x in map) {
      for (const y in map[x]) {
        if (this.getGrid({x: x, y: y}) !== 0)
          map[x][y] = 1;
      }
    }

    function atkObj(dmg = 1, dir = 0) {
      return {dir: dir, dmg: dmg};
    }

    switch(range) {
      case 'melee':
        for (let i = 0; i < 4; i++) {
          const rang = addPos(rotateCoord(undefined, i), origin);
          if (!this.inBound(rang)) continue;
          map[rang.x][rang.y] = atkObj(1, i); 
        }
        break;

      case 'self':
        map[origin.x][origin.y] = {dir: 0};
        break;

      default:
        console.error("Error! Invalid Range Option given for generateAttackPath()");
        break;
    }
    return map;
  }

  inBound(pos) {
    if (pos.x < 0 || pos.x >= this.cols) return false;
    if (pos.y < 0 || pos.y >= this.rows) return false;
    return true;
  }
}

/* Rotates coords by increments of 90 deg */
function rotateCoord(pos = {x: 1, y: 0}, dir = "None!!!") {
 switch(dir) {
  case 0:
    return { x: pos.x, y: pos.y };
  case 1:
    return { x: -pos.y, y: pos.x };
  case 2:
    return { x: -pos.x, y: -pos.y };
  case 3:
    return { x: pos.y, y: -pos.x };
  default:
    console.error("rotate Coord Error: Invalid direction given: " + dir);
    return { x: pos.x, y: pos.y };
 }
}

/* adds together 2 position objects */
function addPos(obj1, obj2) {
  return { x: obj1.x + obj2.x, y: obj1.y + obj2.y }
}

class unit {
  constructor(name, battle, pos = {x: 0, y: 1}) {
    this.type = "neutral";
    this.char = name;
    this.hp = 5;
    this.maxHp = 5;
    this.moves = [moveSet.punch, moveSet.fartlol];
    this.pos = pos;
    this.battle = battle;
  }

  attack(move, targetPos, dir = 0) {
    for (const atk of move.atks) {
      const atktar = { x: atk.pos.x + targetPos.x, y: atk.pos.y + targetPos.y };
      const localTar = this.battle.getGrid(atktar);
      if (localTar !== 0 && localTar !== undefined) { /* Target located, attack time */
        localTar.recieveAttack(atk, dir);
        console.log(`Hit at (${atktar.x}, ${atktar.y})!`);
      }
    }
    
  }

  recieveAttack(atk, dir) {
    console.log("I am " + this.char + " and Ouchies!!!");
    this.hp -= atk.dmg;
    if ('kb' in atk) {
      this.push(dir, atk.kb);
    }
  }

  push(dir, force = {x: 1, y: 0}) {
    const tarPos = addPos(this.pos, rotateCoord(force, dir));
    if (this.battle.getGrid(tarPos) === 0) {
      console.log(`Moved from (${this.pos.x}, ${this.pos.y}) to (${tarPos.x}, ${tarPos.y})`)
      this.moveTo(tarPos);
    } else console.log("character " + this.char + " hit wall");
  }

  moveTo(pos) {
    this.battle.field[this.pos.x][this.pos.y] = 0;
    this.pos = {...pos};
    this.battle.field[pos.x][pos.y] = this;
  }
}

class Friend extends unit {
  constructor(name, battle, pos) {
    super(name, battle, pos);
    this.moved = false;
    this.attacked = false;
    this.type = "friend";
  }

  turnMoveTo(pos) {
    this.moveTo(pos);
    this.moved = true;
  }

  turnAttack(move, targetPos, dir = 0) {
    this.attack(move, targetPos, dir);
    this.attacked = true;
  }
}

class Enemy extends unit {
  constructor(name, battle, pos) {
    super(name, battle, pos);
    this.type = "enemy";
  }

  executeAI() {
    const atkSpots = this.battle.generateAttackSpots(this.pos, 3, this.moves);
    var bestAttack = 0;
    for (let x = 0; x < atkSpots.length; x++) {
      for (let y = 0; y < atkSpots[x].length; y++) {
        const spot = atkSpots[x][y];
        if (spot === 0) continue;
        if (bestAttack === 0 || spot.dmg > bestAttack.dmg) {
          bestAttack = {...spot, tarPos: {x: x, y: y}};
        }
      }
    }
    return {atk: [moveSet[bestAttack.atk], bestAttack.tarPos, bestAttack.dir], move: bestAttack.move};
  }
}

function createUnit(name, battle, pos = { x: 0, y: 1 }) {
  const plyr = new unit(name, battle, pos);
  battle.field[pos.x][pos.y] = plyr;
  battle.units.push(plyr);
  return plyr;
}

function createFriend(name, battle, pos = { x: 0, y: 1}) {
  const plyr = new Friend(name, battle, pos);
  battle.field[pos.x][pos.y] = plyr;
  battle.units.push(plyr);
  return plyr;
}

function createEnemy(name, battle, pos = { x: 0, y: 1}) {
  const plyr = new Enemy(name, battle, pos);
  battle.field[pos.x][pos.y] = plyr;
  battle.units.push(plyr);
  return plyr;
}

const BATTLE = new battleClass(5, 9);
const PLAYER = createFriend("gup", BATTLE, {x: 2, y: 2});
const PLAYER2 = createFriend("bup", BATTLE, {x: 2, y: 1})
const ENEMY = createEnemy("gus", BATTLE, { x: 4, y: 2 });
var Cursor = new cursorClass(BATTLE);

function battleTick() {
  if (Keys.KeyA) { Cursor.pos.x -= 1; Keys.KeyA = false; }
  if (Keys.KeyD) { Cursor.pos.x += 1; Keys.KeyD = false; }
  if (Keys.KeyW) { Cursor.pos.y -= 1; Keys.KeyW = false; }
  if (Keys.KeyS) { Cursor.pos.y += 1; Keys.KeyS = false; }
  if (Keys.Space) { Cursor.select(); Keys.Space = false; }
  if (Keys.KeyE) {
    if (Cursor.phase === 1)
      Cursor.findUnused();
    else {
      const plyr = BATTLE.units[Cursor.sel];
      Cursor.curAtkID = (Cursor.curAtkID + 1) % plyr.moves.length;
      Cursor.selectOptions = BATTLE.generateAttackPath(Cursor.selPos, plyr.moves[Cursor.curAtkID].range);
      console.log(Cursor.curAtkID);
    }
    Keys.KeyE = false;
  }

  function sinEase(x) {
    return -(Math.cos(Math.PI * x) - 1) / 2;
  }

  Cam3.x = sinEase(niceCameraEase.x) * 16 - 8;
  niceCameraEase.x += 0.003;
  if (niceCameraEase >= 2)
    niceCameraEase.x = 0;

  /*  CODE FOR TURNING CAMERA. Not enabled cause it will mess with textures
  niceCameraEase.end = -(Cursor.pos.x - Math.floor(BATTLE.cols / 2)) / 200;
  niceCameraEase.cur += (niceCameraEase.end - niceCameraEase.cur) / 5;
  cosY = Math.cos(niceCameraEase.cur * Math.PI * 2);
  sinY = Math.sin(niceCameraEase.cur * Math.PI * 2);

  niceCameraEase.endy = (Cursor.pos.y - Math.floor(BATTLE.rows / 2)) / 300;
  niceCameraEase.cury += (niceCameraEase.endy - niceCameraEase.cury) / 5;
  cosX = Math.cos(niceCameraEase.cury * Math.PI * 2);
  sinX = Math.sin(niceCameraEase.cury * Math.PI * 2);
  */

  battleDraw2(BATTLE);
}

function battleDraw(battle) {
  ctx.lineWidth = 1;
  ctx.clearRect(0, 0, myCanvas.width, myCanvas.height);

  for (let x = 0; x < battle.cols; x++) {
    for (let y = 0; y < battle.rows; y++) {
      ctx.strokeRect(x * 64, y * 64, 64, 64);
      if (battle.getGrid({x: x, y: y}) !== 0) {
        ctx.fillRect(x * 64 + 8, y * 64 + 8, 48, 48);
      }
    }
  }

  
  ctx.globalAlpha = 0.25;
  if (Cursor.phase === 1) { /* Draw for movement phase */
    ctx.fillStyle = "green";
    for (let x = 0; x < Cursor.selectOptions.length; x++) {
      for (let y = 0; y < Cursor.selectOptions[0].length; y++) {
        if (typeof Cursor.selectOptions[x][y] === 'object')
          ctx.fillRect(x * 64, y * 64, 64, 64);
      }
    }
    
    const cursorTar = Cursor.selectOptions[Cursor.pos.x][Cursor.pos.y];
    if (typeof cursorTar === "object") {
      ctx.globalAlpha = 1;
      mapPath(cursorTar.retrace);
    }
  } else if (Cursor.phase === 2) { /* Draw for attack phase */
    ctx.fillStyle = "blue";
    for (let x = 0; x < Cursor.selectOptions.length; x++) {
      for (let y = 0; y < Cursor.selectOptions[0].length; y++) {
        if (typeof Cursor.selectOptions[x][y] === 'object') {
          if (Cursor.pos.x === x && Cursor.pos.y === y) { /* If cursor is hovered over attack spot preview it */
            ctx.fillStyle = 'red';
            for (const atk of battle.units[Cursor.sel].moves[Cursor.curAtkID].atks) { /* I'm so good at coding */
              const atkPos = addPos({x: x, y: y}, atk.pos);
              ctx.fillRect(atkPos.x * 64, atkPos.y * 64, 64, 64);
              if ('kb' in atk && battle.getGrid(atkPos) !== 0) {
                ctx.globalAlpha = 1;
                drawArrow(atkPos, addPos(atkPos, rotateCoord(atk.kb, Cursor.selectOptions[x][y].dir)), Cursor.selectOptions[x][y].dir); /* wtf is this */
                ctx.globalAlpha = 0.25;
              }
            }
          }
          ctx.fillStyle = 'blue';
          ctx.fillRect(x * 64, y * 64, 64, 64);
        }
      }
    }
  }
  ctx.globalAlpha = 1;
  ctx.fillStyle = "black";

  ctx.lineWidth = 4;
  ctx.strokeStyle = "red";
  ctx.strokeRect(Cursor.pos.x * 64, Cursor.pos.y * 64, 64, 64);
  ctx.strokeStyle = "black";
}

function battleDraw2(battle) {
  ctx.lineWidth = 1;
  ctx.clearRect(0, 0, myCanvas.width, myCanvas.height);
  ctx.globalAlpha = 1;
  /* Draw the grid */
  for (let y = 0; y < battle.rows; y++) {
    for (let x = 0; x < battle.cols; x++) {
      draw3dSquare([(x - battle.cols / 2) * 64, y * 64], [64, 64]);
      if (battle.getGrid({x: x, y: y}) !== 0) {
        //draw3dSquare([x * 64, y * 64], [64, 64]);
        //draw3dImage(exampleImage, [(x - battle.cols / 2) * 64 + 32, y * 64 + 48], 1.5);
      }
    }
  }

  ctx.globalAlpha = 0.25;
  if (Cursor.phase === 1) { /* Draw for movement phase */
    ctx.fillStyle = "green";
    for (let x = 0; x < Cursor.selectOptions.length; x++) {
      for (let y = 0; y < Cursor.selectOptions[0].length; y++) {
        if (typeof Cursor.selectOptions[x][y] === 'object')
          draw3dSquare([(x - battle.cols / 2) * 64, y * 64], [64, 64], true);
      }
    }
    
    const cursorTar = Cursor.selectOptions[Cursor.pos.x][Cursor.pos.y];
    if (typeof cursorTar === "object") {
      ctx.globalAlpha = 1;
      mapPath3d(cursorTar.retrace, battle); /* Rewrite this crap bruh */
    }
  } else if (Cursor.phase === 2) { /* Draw for attack phase */
    ctx.fillStyle = "blue";
    for (let x = 0; x < Cursor.selectOptions.length; x++) {
      for (let y = 0; y < Cursor.selectOptions[0].length; y++) {
        if (typeof Cursor.selectOptions[x][y] === 'object') {
          if (Cursor.pos.x === x && Cursor.pos.y === y) { /* If cursor is hovered over attack spot preview it */
            ctx.fillStyle = 'red';
            for (const atk of battle.units[Cursor.sel].moves[Cursor.curAtkID].atks) { /* I'm so good at coding */
              const atkPos = addPos({x: x, y: y}, atk.pos);
              draw3dSquare([(atkPos.x - battle.cols / 2) * 64, atkPos.y * 64], [64, 64], true);
              if ('kb' in atk && battle.getGrid(atkPos) !== 0) {
                ctx.globalAlpha = 1;
                const arrowD = addPos(atkPos, rotateCoord(atk.kb, Cursor.selectOptions[x][y].dir));
                drawArrow3d({x: atkPos.x - battle.cols / 2, y: atkPos.y}, {x: arrowD.x - battle.cols / 2, y: arrowD.y}, Cursor.selectOptions[x][y].dir); /* wtf is this */
                ctx.globalAlpha = 0.25;
              }
            }
          }
          ctx.fillStyle = 'blue';
          draw3dSquare([(x - battle.cols / 2) * 64, y * 64], [64, 64], true);
        }
      }
    }
  }

  ctx.globalAlpha = 1;
  ctx.fillStyle = "black";

  ctx.lineWidth = 4;
  ctx.strokeStyle = "red";
  draw3dSquare([(Cursor.pos.x - battle.cols / 2) * 64, Cursor.pos.y * 64], [64, 64]); /* Cursor draw */
  ctx.strokeStyle = "black";

  for (let y = 0; y < battle.rows; y++) {
    for (let x = 0; x < battle.cols; x++) {
      if (battle.getGrid({x: x, y: y}) !== 0) {
        //draw3dSquare([x * 64, y * 64], [64, 64]);
        draw3dImage(exampleImage, [(x - battle.cols / 2) * 64 + 32, y * 64 + 48], 1.5);
      }
    }
  }
}

/* Visualize a path from battle.generateWalkPath() */
function mapPath(dest) {
  ctx.beginPath();
  ctx.moveTo(dest[0].x * 64 + 32, dest[0].y * 64 + 32);
  for (let i = 1; i < dest.length; i++) {
    ctx.lineTo(dest[i].x * 64 + 32, dest[i].y * 64 + 32);
  }
  ctx.lineWidth = 8;
  ctx.stroke();
}

function mapPath3d(dest, battle) {
  const dest3d = [];
  for (let i = 0; i < dest.length; i++) {
    dest3d.push(centerPos(camPos(project2d([(dest[i].x - battle.cols / 2) * 64 + 32, dest[i].y * 64 + 32]))));
  }

  ctx.beginPath();
  ctx.moveTo(...dest3d[0]);
  for (let i = 1; i < dest3d.length; i++) {
    ctx.lineTo(...dest3d[i]);
  }
  ctx.lineWidth = 8;
  ctx.stroke();
}

/* Draws a silly little knockback arrow */
function drawArrow(origin, dest) {
  var dir = 0;
  if (dest.x < origin.x) dir = 2;
  if (dest.x > origin.x) dir = 0;
  if (dest.y < origin.y) dir = 3;
  if (dest.y > origin.y) dir = 1;

  ctx.beginPath();
  ctx.moveTo(origin.x * 64 + 32, origin.y * 64 + 32); // bottom point
  ctx.lineTo(dest.x * 64 + 32, dest.y * 64 + 32); // point
  ctx.moveTo(dest.x * 64 + 32 + rotateCoord({x: -24, y: -24}, dir).x, dest.y * 64 + 32 + rotateCoord({x: -24, y: -24}, dir).y); // left wing
  ctx.lineTo(dest.x * 64 + 32, dest.y * 64 + 32); // point
  ctx.lineTo(dest.x * 64 + 32 + rotateCoord({x: -24, y: 24}, dir).x, dest.y * 64 + 32 + rotateCoord({x: -24, y: 24}, dir).y); // right wing
  ctx.lineWidth = 8;
  ctx.stroke();
}

function drawArrow3d(origin, dest) {
  var dir = 0;
  if (dest.x < origin.x) dir = 2;
  if (dest.x > origin.x) dir = 0;
  if (dest.y < origin.y) dir = 3;
  if (dest.y > origin.y) dir = 1;
  const points3d = [centerPos(camPos(project2d([origin.x * 64 + 32, origin.y * 64 + 32])))];
  for (let i = 1; i < 4; i++) {
    const lol = [0, rotateCoord({x: 20, y: 0}, dir), rotateCoord({x: -4, y: -24}, dir), rotateCoord({x: -4, y: 24}, dir)];
    points3d.push(centerPos(camPos(project2d([dest.x * 64 + 32 + lol[i].x, dest.y * 64 + 32 + lol[i].y]))));
  } /* 0: bottom point, 1: point, 2: left, 3: right*/
  ctx.beginPath();
  ctx.moveTo(...points3d[0]);
  ctx.lineTo(...points3d[1]);
  ctx.moveTo(...points3d[2]);
  ctx.lineTo(...points3d[1]);
  ctx.lineTo(...points3d[3]);
  ctx.lineWidth = 8;
  ctx.stroke();
}

/* More of a debug thing lol */
function showAllPaths(map) {
  for (const x in map) {
    for (const y in map[x]) {
      if (typeof map[x][y] !== "object") continue;
      mapPath(map[x][y].retrace)
    }
  }
}
Cursor.findUnused();

/*
battleInit();
setInterval(battleTick, 16.67);
//*/



/*
so the enemy gets its attacks, function to turn all attacks into a map, with higher damages overriding old ones. Make walk map. Get overlaps and pick the higher damage one.

*/