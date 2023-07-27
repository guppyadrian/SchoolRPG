const ctx = myCanvas.getContext('2d');
const rBar = rightBar.getContext('2d');

var Scene = {
  init: {world: 0, cam: {x: 0, y: 0, z: 1}, chars: {}},
  scenes: {
    start: []
  }
};

var previewChar = {
  name: undefined,
  pos: {x: 0, y: 0, r: 0}
}

function addChar(name, pos) {
  if (name in Scene.init.chars) return false;
  Scene.init.chars[name] = {...pos};
}

function setWorld(worldID) {
  Scene.init.world = worldID;
}

function setCharName() {
  prompt("Enter Char Name (the id)");
}

function setCharPos() {
  
}


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