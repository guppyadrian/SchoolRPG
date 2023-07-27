/*

  ok
  DISABLE KEYBOARD CONTROLS SOMEHOW try changing the addEventListener()
  have a frame ticker for waiting
  maybe stop the tick() function. Make sure animation related stuff isn't in tick() so code doesn't have to be duped LOL!!1!!!1
  mmmmm I no feel good why programming hard

  showDialogue&DontWait()
  WalkToPos&Wait()
  shows dialogue then increases ticker
  walk then wait

*/

var cutCamOn = false;
var cutsceneCam = {pos: {x: 0, y: 0, z: 0}, og: {x: 0, y: 0, z: 0}, sett: {prog: 0, speed: 0}};

const testScene = {
  init: {world: 1, cam: {x: 0, y: 0, z: 1}, chars: {guppy: {x: 5, y: 2, r: 0}, jimbo: {x: 2, y: 2, r: 0}}},
  scenes: {
    start: [
      {type: "wait", wait: true, time: 60},
      {type: "anim", wait: false, char: "guppy", anim: "idle", loop: 10, speed: 1},
      {type: "anim", wait: false, char: 'jimbo', anim: "run", loop: -1, speed: 3},
      {type: "move", wait: true, char: "jimbo", pos: {x: 20, y: 2}, time: 180},
      {type: "anim", wait: false, char: 'jimbo', anim: "idle", loop: -1, speed: 3},
      {type: "cam", wait: true, cam: {x: 400, y: 0, z: 3}, time: 20}
    ]
  }
};

class CutsceneChar extends Character {
  constructor(name, pos) {
    super(name, pos);
    this.animLoop = 0;
    this.newPos = undefined;
    this.ogPos = undefined;
    this.pProg = 0; // from 0 to 1 for transition %
    this.pSpeed = 0; // how many frames it takes for le move
  }

  moveTick() {
    this.pProg += this.pSpeed;
    console.log(this.trans.pos.x);
    this.trans.pos.x = this.ogPos.x + (this.newPos.x - this.ogPos.x) * this.pProg;
    this.trans.pos.y = this.ogPos.y + (this.newPos.y - this.ogPos.y) * this.pProg;
    if (this.pProg >= 1)
      this.newPos = undefined;
  }

  cutTick() {

    if (this.newPos !== undefined)
      this.moveTick();

    this.animTick();
    if (this.anim.frame === 0 && this.anim.iFrame === 0) {
      if (this.animLoop === 0) {
        this.setAnim("idle");
      } else this.animLoop--;
      return true;
    } else return false;
  }
}

var Cutscene = {
  tickerFocus: undefined,
  ticker: 0,
  scenes: {},
  frame: 0,
  cur: "start",
  scriptPos: 0,
  world: 1,
  chars: {},
  nextCond: undefined  //sorry for lore dump but the type of condition before it goes to next line in script. integer is wait time. "move" is wait for cam/player movement. "anim" is wait for anim to finish
};

function cutsceneInit(scene) {
  const init = scene.init;
  Cutscene.frame = 0;
  Cutscene.scriptPos = 0;
  Cutscene.world = init.world;
  Cam = {...init.cam};
  Cutscene.chars = {};
  for (const char in init.chars) {
    Cutscene.chars[char] = new CutsceneChar(char, {...init.chars[char]});
  }
  Cutscene.scenes = scene.scenes;
}

function loadCutsceneAction(act) {
  if (act == undefined) return;
  Cutscene.scriptPos++;
  
  switch (act.type) {
    case "wait":
      Cutscene.nextCond = "wait";
      Cutscene.ticker = act.time;
      break;
    case "anim":
      Cutscene.nextCond = "anim";
      Cutscene.chars[act.char].setAnim(act.anim);
      Cutscene.chars[act.char].animLoop = act.loop;
      Cutscene.ticker = act.loop;
      Cutscene.tickerFocus = act.char;
      break;
    case "move":
      Cutscene.nextCond = "move";
      const char = Cutscene.chars[act.char];
      char.newPos = act.pos;
      char.ogPos = {...char.trans.pos};
      char.pProg = 0;
      char.pSpeed = 1 / act.time;
      break;
    case "cam":
      Cutscene.nextCond = "cam";
      cutCamOn = true;
      cutsceneCam.pos = act.cam;
      cutsceneCam.og = {...Cam};
      cutsceneCam.sett.prog = 0;
      cutsceneCam.sett.speed = 1 / act.time;
      break;
    default:
      console.error("loadCutsceneAction() Error: Unknown act type given: " + act.type);
  }

  if (!act.wait) {
    Cutscene.nextCond = undefined;
    loadCutsceneAction(Cutscene.scenes[Cutscene.cur][Cutscene.scriptPos]);
    return;
  }
}

function cameraTick() {
  cutsceneCam.sett.prog += cutsceneCam.sett.speed;
  Cam.x = cutsceneCam.og.x + (cutsceneCam.pos.x - cutsceneCam.og.x) * cutsceneCam.sett.prog;
  Cam.y = cutsceneCam.og.y + (cutsceneCam.pos.y - cutsceneCam.og.y) * cutsceneCam.sett.prog;
  Cam.z = cutsceneCam.og.z + (cutsceneCam.pos.z - cutsceneCam.og.z) * cutsceneCam.sett.prog;
  if (cutsceneCam.sett.prog >= 1)
    cutCamOn = false;
}

function cutsceneTick() {
  ctx.clearRect(0, 0, myCanvas.width, myCanvas.height)
  const next = Cutscene.scenes[Cutscene.cur][Cutscene.scriptPos];
  switch (Cutscene.nextCond) {
    case undefined:
      loadCutsceneAction(next);
      break;
    case "wait":
      if (--Cutscene.ticker > 0) break;
      loadCutsceneAction(next);
      break
    case "anim":
      if (Cutscene.ticker === 0) {
      console.log(Cutscene.ticker);
      loadCutsceneAction(next);
      }
      break;
    case "move":
      if (Cutscene.chars[Cutscene.tickerFocus].pProg < 1) break;
      loadCutsceneAction(next);
      break;
    case "cam":
      if (cutCamOn) break;
      loadCutsceneAction(next);
      break;
  }

  if (cutCamOn)
    cameraTick();

  BGDraw(Cutscene.world);
  
  for (const charID in Cutscene.chars) {
    const char = Cutscene.chars[charID];
    if (char.cutTick() && Cutscene.tickerFocus === char.name) {
      Cutscene.ticker--;
    }
    CharDraw(char);
  }
  
 Cutscene.frame++;
}

//cutsceneInit(testScene); 
//setInterval(cutsceneTick, 16.67);