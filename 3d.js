/*
  Reverse x for draw image??? idk why it does that
  change normal Cam to special var
  add a drawgrid var
  re-add all trigonometry vars
  don't think I need cv()
  I'm going to keep myself safe lol
*/
var Cam3 = {x: 0, y: 0, z: -150, r: 0.85};
var focalLength = 600;
var sinY = 0;
var sinX = 0;
var cosY = 1;
var cosX = 1;

function centerPos(pos) {
  const tPos = [(pos[0] - Cam.x) + ((pos[0] - Cam.x) * ((200 + pos[1]) / 200) * Cam.r), (pos[1] * (1 - Cam.r))];

  return [pos[0] + myCanvas.width / 2, pos[1] + myCanvas.height / 2];
}

function camPos(pos) {
  return [(pos[0] - Cam.x) * Cam.z, (pos[1] - Cam.y) * Cam.z];
}

/*
function vector3(pos) {
  return [pos[0], pos[1] * Math.cos(Cam.r * 2 * Math.PI), -focalLength - pos[1] * Math.sin(Cam.r * 2 * Math.PI)];
}

function project2(pos) {
  var pos1 = [(pos[2] - Cam.z) * sinY + (pos[0] - Cam.x) * cosY, pos[1] - Cam.y, (pos[2] - Cam.z) * cosY - (pos[0] - Cam.x) * sinY];
  var pos2 = [pos1[0], pos1[1] * cosX - pos1[2] * sinX, pos1[1] * sinX + pos1[2] * cosX];
  //console.log(pos1);
  return [focalLength * pos2[0] / pos2[2], focalLength * pos2[1] / pos2[2]];
}

function drawImage(img, pos, scale = 1) {
  const scl = focalLength + pos[1] * Math.sin(Cam.r * 2 * Math.PI);
  const iWidth = focalLength * img.width / scl;
  const iHeight = focalLength * img.height / scl;
  const cPos = [pos[0] + img.width / 2, pos[1]]; // centered position
  const vPos = cv(project2(vector3(cPos)));
  
  ctx.drawImage(img, vPos[0], vPos[1] - iHeight, iWidth, iHeight);
} 
*/

function project2d(pos) {
  var pos3 = [pos[0], pos[1] * Math.cos(Cam3.r * 2 * Math.PI), focalLength + pos[1] * Math.sin(Cam3.r * 2 * Math.PI)]; /* 3d Pos */
  var cPos = [pos3[0] - Cam3.x, pos3[1] - Cam3.y, pos3[2] - Cam3.z]; /* Camera adjusted Pos */
  var pos1 = [cPos[2] * sinY + cPos[0] * cosY, cPos[1], cPos[2] * cosY - cPos[0] * sinY]; /* idk cool stuff */
  var pos2 = [pos1[0], pos1[1] * cosX - pos1[2] * sinX, pos1[1] * sinX + pos1[2] * cosX];

  return [focalLength * pos2[0] / pos2[2], focalLength * pos2[1] / pos2[2]];
}

function draw3dImage(img, pos, scale = 1) {
  const size = focalLength + pos[1] * Math.sin(Cam3.r * 2 * Math.PI) - Cam3.z;
  const iWidth = focalLength * (scale * img.width) / size;
  const iHeight = focalLength * (scale * img.height) / size;
  const cPos = [pos[0] - (scale * img.width / 2), pos[1]]; // centered position
  const vPos = project2d(cPos);
  const fPos = centerPos(camPos(vPos));  // stands for final pos

  ctx.drawImage(img, fPos[0], fPos[1] - iHeight * Cam.z, iWidth * Cam.z, iHeight * Cam.z);
}

function draw3dSquare(pos, size, fill = false) {
  const points = [[pos[0] + size[0], pos[1]], [pos[0] + size[0], pos[1] + size[1]], [pos[0], pos[1] + size[1]], pos];
  ctx.beginPath();
  ctx.moveTo(...centerPos(camPos(project2d(pos))));
  for (const point of points) {
    const point3d = project2d(point);
    ctx.lineTo(...centerPos(camPos(point3d)));
   // console.log(project2d(point));
  }
  if (fill)
    ctx.fill();
  else
    ctx.stroke();
}