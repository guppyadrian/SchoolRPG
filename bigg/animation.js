var sheetList = {};
var animations = {};
var frameTime = 10;
var frameTT = 0;
var frame = 0;
var curSheet;
var curAnim;
var startFrame = 0;
var endFrame = 2;
var usingEZ = false;
var characterName = "guppy";

const ctxBound = sheetCanvas.getBoundingClientRect();


const ctx = myCanvas.getContext('2d');
const ctx2 = sheetCanvas.getContext('2d');
ctx2.lineWidth = 2;
function loadFile(event) {
  const file = event.target.files[0];
  sheetList[file.name] = {img: new Image(), offset: {x: 0, y: 0}, framePx: 32, width: 2};
  const sheet = sheetList[file.name];
  sheet.img.src = URL.createObjectURL(file);
  curSheet = file.name;
  curAnim = undefined;
  usingEZ = false;
  animations[curSheet] = {};
  sheet.img.onload = () => {
    sheet.framePx = sheet.img.width / 2;
  }

  const para = document.createElement("button");
  para.classList.add("w3-bar-item");
  para.classList.add("w3-button");
  para.innerHTML = file.name;
  para.onclick = () => {curSheet = file.name; curAnim = undefined;};
  const element = document.getElementById("sheetDiv");
  element.appendChild(para);
}

function importAnim() {
  const p = prompt("paste le code!!!");
  if (p === undefined || p === "" || p == null) return;
  const imp = JSON.parse(p);
  console.log(imp);
}
'{"sheets":{"New Piskel.png":{"img":toImage(./spriteSheets/guppy/New Piskel.png),"offset":{"x":0,"y":0},"framePx":32,"width":2}},"animations":{"coltenidle":{"img":"New Piskel.png","speed":10,"start":0,"end":3}}}'

function setCharName() {
  const p = prompt("paste le code!!!");
  if (p === undefined || p === "" || p == null) return;
  characterName = p;
}

function combineAnim() {
  var p = prompt("paste le code!!!");
  if (p === undefined || p === "" || p == null) return;
  p = p.replaceAll(/:toImage/g, ':"toImage');
  p = p.replaceAll(/\),/g, ')",');
  var imp = JSON.parse(p);

  for (const i in sheetList) {
    imp.sheets[i] = {...sheetList[i]};
    imp.sheets[i].img = `toImage('./spriteSheets/${characterName}/${i}')`;
  }
  for (const anim in animations) {
    for (const an in animations[anim]) {
      imp.animations[an] = animations[anim][an];
    }
  }

  var exportJSON = JSON.stringify(imp); 
  exportJSON = exportJSON.replaceAll(/"toImage/g, 'toImage'); 
  exportJSON = exportJSON.replaceAll(/\)",/g, '),');

  navigator.clipboard.writeText(exportJSON).then(function() {
    console.log('Async: Copying to clipboard was successful!');
  }, function(err) {
    console.error('Async: Could not copy text: ', err);
    console.log(exportJSON);
  });
}

function setFrameTime() {
  const p = prompt("How many frames does each image hold for? (60 fps)");
  if (p === undefined || p === "" || p == null) return;
  if (curSheet === undefined || curAnim === undefined) return;
  animations[curSheet][curAnim].speed = parseInt(p);
}

function setWidth() {
  const p = prompt("How many frames per row? (amount of images from left to right)");
  if (p === undefined || p === "" || p == null) return;
  if (curSheet === undefined) return;
  sheetList[curSheet].width = parseInt(p);
  sheetList[curSheet].framePx = sheetList[curSheet].img.width / p;
}

function setEZFrame() {
  console.log("Starting EZ Frame!!!")
  if (curSheet === undefined || curAnim === undefined) return;
  usingEZ = 1;
}

function setStartFrame() {
  const p = prompt("Start frame??? (First frame is 0)");
  if (p === undefined || p === "" || p == null) return;
  if (curSheet === undefined || curAnim === undefined) return;
  animations[curSheet][curAnim].start = parseInt(p);
}

function setEndFrame() {
  const p = prompt("End frame??? (First frame is 0)");
  if (p === undefined || p === "" || p == null) return;
  if (curSheet === undefined || curAnim === undefined) return;
  animations[curSheet][curAnim].end = parseInt(p);
}

function addAnimation() {
  const p = prompt("Set Name!!!!");
  if (p === undefined || p === "" || p == null) return;
  if (curSheet === undefined) return;
  animations[curSheet][p] = {img: curSheet, speed: 10, start: 0, end: 2};
  curAnim = p;
  usingEZ = false;

  const para = document.createElement("button");
  para.classList.add("w3-bar-item");
  para.classList.add("w3-button");
  para.innerHTML = p;
  const cs = curSheet;
  para.onclick = () => {curSheet = cs; curAnim = p; frameTT = 0};
  const element = document.getElementById("animDiv");
  element.appendChild(para);
}

function exportAnim() {
  var ex = {sheets: {}, animations: {}};
  ex.sheets = {}
  for (const i in sheetList) {
    ex.sheets[i] = {...sheetList[i]};
    ex.sheets[i].img = `toImage('./spriteSheets/${characterName}/${i}')`;
  }
  for (const anim in animations) {
    for (const an in animations[anim]) {
      ex.animations[an] = animations[anim][an];
    }
  }

  var exportJSON = JSON.stringify(ex); 
  exportJSON = exportJSON.replaceAll(/"toImage/g, 'toImage'); 
  exportJSON = exportJSON.replaceAll(/\)",/g, '),');

  navigator.clipboard.writeText(exportJSON).then(function() {
    console.log('Async: Copying to clipboard was successful!');
  }, function(err) {
    console.error('Async: Could not copy text: ', err);
  });
}

function tick() {
  if (curSheet === undefined) return;
  ctx.clearRect(0, 0, 500, 500);
  ctx2.clearRect(0, 0, 500, 500);

  const sheet = sheetList[curSheet];
  sheetCanvas.height = sheet.img.height;
  ctx2.drawImage(sheet.img, 0, 0);
  ctx2.strokeStyle = "black";
  for (let i = 0; i < sheet.width * Math.ceil(sheet.img.height / sheet.framePx); i++) {
    if (curAnim !== undefined) {
      ctx2.globalAlpha = 0.25;
      if (animations[curSheet][curAnim].start === i) {
        ctx2.fillStyle = "green";
        ctx2.fillRect((i % sheet.width) * sheet.framePx, Math.floor(i / sheet.width) * sheet.framePx, sheet.framePx, sheet.framePx);
      } else if (animations[curSheet][curAnim].end === i) {
        ctx2.fillStyle = "red";
        ctx2.fillRect((i % sheet.width) * sheet.framePx, Math.floor(i / sheet.width) * sheet.framePx, sheet.framePx, sheet.framePx);
      }
        ctx2.globalAlpha = 1;
    }
    ctx2.strokeRect((i % sheet.width) * sheet.framePx, Math.floor(i / sheet.width) * sheet.framePx, sheet.framePx, sheet.framePx);
  }

  if (curAnim === undefined) return;
  ctx.drawImage(sheet.img, (frame % sheet.width) * sheet.framePx, Math.floor(frame / sheet.width) * sheet.framePx, sheet.framePx, sheet.framePx, 0, 0, 32, 32);
  if (frame <= animations[curSheet][curAnim].start) frame = animations[curSheet][curAnim].start;
  if (++frameTT >= animations[curSheet][curAnim].speed) {
    frameTT = 0;
    if (frame++ >= animations[curSheet][curAnim].end)
      frame = animations[curSheet][curAnim].start;
  }
}

sheetCanvas.addEventListener("mousedown", event => {
  if (usingEZ === false) return;
  const posX = event.clientX - ctxBound.left;
  const posY = event.clientY - ctxBound.top;
  const sheet = sheetList[curSheet];
  var hitLocX;
  var hitLocY;

  if (posX < 0 || posX > (sheet.width * sheet.framePx)) return;
  if (posY < 0 || posY > Math.ceil(sheet.img.height / sheet.framePx) * sheet.framePx) return;
  hitLocX = Math.floor(posX / sheet.framePx);
  hitLocY = Math.floor(posY / sheet.framePx);
  console.log(`(${hitLocX}, ${hitLocY})`);

  

  if (usingEZ === 1) {
    animations[curSheet][curAnim].start = hitLocX + hitLocY * sheet.width;
    usingEZ = 2;
  } else {
    usingEZ = false;
    animations[curSheet][curAnim].end = hitLocX + hitLocY * sheet.width;
  }
});

var tut = 0;
const tutList = [
  "Process of making an animation",
  "Adding in the image",
  "Choosing the width of the image",
  "Adding in animation",
  "Choose the start and end point of the animation",
  "Choose the speed of the animation",
  "Repeat for other animation"
]

addEventListener('keydown', key => {
  if (key.key === " ") {
    document.getElementById("tutorial").innerHTML = tutList[++tut];
  }
});

setInterval(tick, 16.67);

