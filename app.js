const canvas = document.querySelector('#canvas');
const ctx = canvas.getContext("2d");
const modal = document.querySelector('#modal-main')
const dialogGameover = document.querySelector('.dialog.game-over')
const dialogStart = document.querySelector('.dialog.game-start')
const scoreTop = document.querySelector('#score-top')
const scoreDialog = document.querySelector('#score-dialog')
const ammoDisplay = document.querySelector('#ammo-top')

let pressedShift = false;
let pressedCtrl = false;
let dodgeDir = null;
canvas.width = window.innerWidth
canvas.height = window.innerHeight

window.onresize = function() {
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
}

// timers
let enemySpawnTimer;

let gameover = false;
let score = 0;
let ammo = 20;
let enemyCap = 12;
let reachedEnemyCap = false;

//classes
class Player {
  constructor (x,y,radius,color,dodgeDistance) {
    this.x = x
    this.y = y
    this.radius = radius
    this.color = color
    this.dodgeDistance = dodgeDistance
    this.velocity = {x: 0,y: 0}
    this.hidden = false;
  }
  draw() {
    ctx.beginPath();
    ctx.arc(this.x,this.y,this.radius,0,Math.PI * 2)
    ctx.fillStyle = this.color
    ctx.fill();
    ctx.closePath();
  }
  move(direction) {

  }
  dodge(direction) {
    // console.log(this.dodgeDistance)
    if(dodgeDir) return;
      if(direction == 'left') {
        gsap.to(this, {duration: 0.1, onComplete: () => {dodgeDir = null},x: this.x -= this.dodgeDistance.x})
        dodgeDir = 'left';
      }
      if(direction == 'right') {
        gsap.to(this, {duration: 0.1, onComplete: () => {dodgeDir = null},x: this.x += this.dodgeDistance.x})
        dodgeDir = 'right';
      }
      if(direction == 'up') {
        gsap.to(this, {duration: 0.1, onComplete: () => {dodgeDir = null},y: this.y -= this.dodgeDistance.y})
        dodgeDir = 'up';
      }
      if(direction == 'down') {
        gsap.to(this, {duration: 0.1, onComplete: () => {dodgeDir = null},y: this.y += this.dodgeDistance.y})
        dodgeDir = 'down';
      }
    
  }
  update() {
    this.draw()
  }
}

class Projectile {
  constructor(x,y,radius,color,velocity,type) {
    this.x = x
    this.y = y
    this.radius = radius * bombRadiusMult
    this.color = color
    this.velocity = velocity
    this.bounces = 2 
    this.bounced = false
    this.type = type;
  }
  draw() {
    ctx.beginPath();
    ctx.arc(this.x,this.y,this.radius,0,Math.PI * 2, false)
    ctx.fillStyle = this.color
    ctx.fill();
    ctx.closePath();
  }
  update() {
    this.draw();
    this.x += this.velocity.x
    this.y += this.velocity.y
  }
}
class Enemy {
  constructor(x,y,radius,color,velocity) {
    this.x = x
    this.y = y
    this.radius = radius
    this.color = color
    this.velocity = velocity
  }
  draw() {
    ctx.beginPath();
    ctx.arc(this.x,this.y,this.radius,0,Math.PI * 2, false)
    ctx.fillStyle = this.color
    ctx.fill();
    ctx.closePath();
  }
  update() {
    
    var angle = Math.atan2( player.y - this.y, player.x - this.x);
    this.velocity = {
      x: Math.cos(angle)*enemySpeed,
      y: Math.sin(angle)*enemySpeed,
    }
    this.x += this.velocity.x
    this.y += this.velocity.y
    // gsap.to(this,{duration: 1, x: this.x += this.velocity.x})
    // gsap.to(this,{duration: 1, y: this.y += this.velocity.y})

    this.draw();
    
  }
}
class Particle {
  constructor(x,y,radius,color,velocity,origin) {
    this.x = x
    this.y = y
    this.radius = radius
    this.color = color
    this.velocity = velocity
    this.alpha = 200;
    this.origin = origin
    this.bounces = 3;
    this.bounced = false;
  }
  draw() {
    ctx.save()
    ctx.globalAlpha = this.alpha / 200;
    ctx.beginPath();
    ctx.arc(this.x,this.y,this.radius,0,Math.PI * 2, false)
    ctx.fillStyle = this.color
    ctx.fill();
    ctx.closePath();
    ctx.restore()
  }
  update() {
    this.draw();
    this.velocity.x *= friction;
    this.velocity.y *= friction;
    this.x += this.velocity.x
    this.y += this.velocity.y
    // this.alpha -= 1;
  }
}
function spawnEnemy() {
    if(reachedEnemyCap) return;

    const radius = Math.random() * (enemyRadius - 15) + 15;
    var x = 0;
    var y = 0;
    const switchXY = Math.round(Math.random());
    if(switchXY) {
      x = Math.round(Math.random()) ? 0 - enemyRadius : canvas.width + enemyRadius;
      y = Math.random() * canvas.height;
    } else {
      x = Math.random() * canvas.width;
      y = Math.round(Math.random()) ? 0 - enemyRadius : canvas.height + enemyRadius;
    }
    
    const color = randColor('enemy');
    const angle = Math.atan2( player.y - y, player.x - x);
    const velocity = {
      x: Math.cos(angle)*enemySpeed,
      y: Math.sin(angle)*enemySpeed,
    }
    enemies.push(new Enemy(x, y, radius, color, velocity));
  
}

const centerX = canvas.width/2;
const centerY = canvas.height/2;
const dodgeDistance = 200
const player = new Player(centerX, centerY, 20, 'white', {x: dodgeDistance, y: dodgeDistance})

const projectiles = [];
const enemies = [];
const particles = [];

let projRadius = 6;
let bombRadiusMult = 2;
let enemyRadius = 35;
let enemySpeed = 1;
let particleRadius = 5;
let particleVariance = 3;
let particleSpeed = 4;
let friction = 0.999;

function init() {
  gameover = false
  dodgeDir = null;
  score = 0;
  ammo = 20;
  player.x = centerX
  player.y = centerY
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, canvas.width, canvas.height, 'black');

  enemies.splice(0, enemies.length);
  projectiles.splice(0, projectiles.length);
  particles.splice(0, particles.length);

  cancelAnimationFrame(drawId);
  draw()
  
  clearInterval(enemySpawnTimer);
  enemySpawnTimer = setInterval(() => {
    spawnEnemy();
  },1000);
  
  updateScoreVisual();
  updateAmmoVisual()
  closeModal();
}

canvas.addEventListener('click', fire)

function fire(e) {
  if(!ammo || gameover) return;
  ammo--
  spawnProjectile(e)
}
function spawnProjectile(e) {
  const angle = Math.atan2( e.clientY - player.y, e.clientX - player.x);
  const velocity = {
    x: Math.cos(angle) *5,
    y: Math.sin(angle) *5,
  }
  projectiles.push(new Projectile(player.x, player.y, projRadius, 'lightblue', velocity, 'bomb' ))
}

function drawBackground() {
  ctx.beginPath();
  ctx.rect(0,0,canvas.width,canvas.height)
  ctx.fillStyle = 'rgba(0,0,0,1)'
  ctx.fill()
  ctx.closePath();
}

let test = true;
// main draw function
let drawId = null;
function draw() {
  if(test) {
    gsap.to(player,{x: player.x += 100, duration: 0.5})
  }
  test = false;
  // ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBackground();

  projectiles.forEach((projectile, indexProj)=> {
    projectile.update()

    // ricochet projectile off walls
    if( (projectile.x > (canvas.width - projRadius) || projectile.x < (0 + projRadius)) || 
        (projectile.y > (canvas.height - projRadius) || projectile.y < (0 + projRadius)) &&
        projectile.bounces > 0
      ) {
      projectile.bounced = true
      projectile.bounces--
      projectile.velocity.x *= -1
      projectile.velocity.y *= -1
      setTimeout(()=>{projectile.bounced = false},100)
    }
    else if( (projectile.x > (canvas.width + projRadius*2 ) || projectile.x < (0 - projRadius*2)) || (projectile.y > (canvas.height + projRadius*2) || projectile.y < (0 - projRadius*2)) ) {
      setTimeout(()=> {
        projectiles.splice(indexProj, 1);
      },0)
    }
  })

  enemies.forEach((enemy, indexEnemy) => {
    enemy.update();
    const distance = Math.hypot(player.x - enemy.x,player.y - enemy.y)
    
    // when player is touched by an enemy
    if(distance - player.radius - enemy.radius < 0) {
      endGame();
    }
    if( (enemy.x > (canvas.width + enemyRadius*2 ) || enemy.x < (0 - enemyRadius*2)) || (enemy.y > (canvas.height + enemyRadius*2) || enemy.y < (0 - enemyRadius*2)) ) {
      enemies.splice(indexEnemy, 1);
    }

    projectiles.forEach((projectile, indexProj) => {
      const distance = Math.hypot(projectile.x - enemy.x,projectile.y - enemy.y) // draws a right-angle triangle and calculates the distance between two points
      
      // when projectile hits an enemy
      if(distance - enemy.radius - projectile.radius < -2) {
        
        // spawn particles if projectile.type == bomb
        if (projectile.type == 'bomb') {

          for (let i = 0; i < enemy.radius/3; i++) {
            particles.push(new Particle(
              (projectile.x + (Math.random()*20 - 10)), 
              (projectile.y + (Math.random()*20 - 10)), 
              (Math.random()*particleVariance + (particleRadius - particleVariance)), 
              enemy.color, 
            { 
              x: (Math.random()*2 - 1) + projectile.velocity.x, 
              y: (Math.random()*2 - 1) + projectile.velocity.y,
            },
            enemy
            ))
          }
        }
        gainAmmo()

        // shrink enemy on hit
        if (enemy.radius > 18 && projectile.type !== 'bomb') {
          gsap.to(enemy, {radius: enemy.radius - 10})
          setTimeout(()=> {
            projectiles.splice(indexProj, 1);
          },0)
          updateScore('shrink-enemy')
        } 
        
        // remove enemy if it's < 18px radius
        else if(projectile.type !== 'bomb') {

          setTimeout(()=> {
            enemies.splice(indexEnemy, 1);
            projectiles.splice(indexProj, 1);
          },0)
          updateScore('kill-enemy')
        }
        else if(projectile.type == 'bomb') {
          setTimeout(()=> {
            enemies.splice(indexEnemy, 1);
            projectiles.splice(indexProj, 1);
          },0)
          updateScore('kill-enemy')
        }
      }
    })
    particles.forEach((particle, particleIndex) => {

      // draws a right triangle and calculates the distance between two points
      const distance = Math.hypot(particle.x - enemy.x,particle.y - enemy.y) 
        
      // when particle hits an enemy, which isn't its origin, invert it's velocity, 
      if( (distance - enemy.radius - particle.radius < (Math.max(particle.velocity.x,particleSpeed) + enemySpeed)) && 
          (distance - enemy.radius - particle.radius < (Math.max(particle.velocity.y,particleSpeed) + enemySpeed)) && 
          particle.origin !== enemy && 
          particle.bounced == false
        ) {
        
        // if a particle by any accident gets inside an enemy, destroy the particle
        if((distance - enemy.radius - particle.radius < 0)) {
          particles.splice(particleIndex,1)
          return;
        }
        particle.bounced = true;
        particle.bounces--
        //if the particle has run out of bounces, destroy the particle
        if(particle.bounces <= 0) {
          particles.splice(particleIndex,1)
          return
        }
        particle.origin = enemy;
        particle.velocity.x *= 0.8
        particle.velocity.y *= 0.8
        particle.velocity.x *= -1
        particle.velocity.y *= -1
        setTimeout(()=>{particle.bounced = false},150)

        //decrease the enemy radius upon hit
        enemy.radius -= 5;
        if(enemy.radius <= 5) {
          enemies.splice(indexEnemy,1)
        }
      }
      
    })
  })

  // update and delete particles with alpha <= 0
  particles.forEach((particle, index) => {
    particle.update();
    if(particle.alpha < 1) {
      particles.splice(index,1)
    }
  })
  
  //spawning mechanic
  if(enemies.length >= 12) {
    reachedEnemyCap = true;
  } else if(enemies.length <= 2) {
    reachedEnemyCap = false;

  }

  player.update();
  
  
  drawId = requestAnimationFrame(draw)
  if(gameover) cancelAnimationFrame(drawId);
}
// ↑↑↑↑↑↑ end of draw()

function initBackground() {
  ctx.beginPath();
  ctx.rect(0,0,canvas.width,canvas.height)
  ctx.fillStyle = 'rgb(0,0,0)'
  ctx.fill()
  ctx.closePath();
}
initBackground()
player.draw();

function randColor(arg) {
  if(arg == 'enemy') {
    var hue = Math.round(Math.random() * 360)
    var sat = Math.round(Math.random() * 50 + 50)
    var light = Math.round((Math.random() * 10) + 40)
    var color = `hsl(${hue},${sat}%,${light}%)`
    return color
  }
}

function start() {
  init()
}
function endGame() {
  gameover = true;
  openModal('gameover')
}

//keydown
document.addEventListener('keydown', processKeydown, false)

function processKeydown(e) {
  if(e.code == 'KeyR' ) {
    start();
  }
  if(e.code == 'KeyE' ) {
    endGame()
  }
  if(e.code == 'ShiftLeft') {
    pressedShift = true
    console.log('[Shift] down')
  }

  if(e.code == 'KeyA' && pressedShift) {
    player.dodge('left')
  }
  if(e.code == 'KeyD' && pressedShift) {
    player.dodge('right')
  }
  if(e.code == 'KeyW' && pressedShift) {
    player.dodge('up')
  }
  if(e.code == 'KeyS' && pressedShift) {
    player.dodge('down')
  }
}

//keyup
document.addEventListener('keyup', processKeyup, false)

function processKeyup(e) {
  if(e.code == 'ShiftLeft') {
    pressedShift = false
    console.log('[Shift] up')

  }
}

//player movement


function updateScore(arg) {
  switch (arg) {
    case 'shrink-enemy' : {
      score += 1;
      break
    }
    case 'kill-enemy' : {
      score += 2;
      break
    }
  }
  updateScoreVisual()
}

function gainAmmo() {
  ammo++
  updateAmmoVisual();
}

//UI functionality
function updateScoreVisual() {
  scoreTop.innerHTML = score;
}
function updateAmmoVisual() {
  ammoDisplay.innerHTML = ammo;
}

function openModal(arg) {
  modal.style.display = ''
  switch (arg) {
    case 'gameover' : {
      dialogGameover.classList.remove('hidden')
      dialogStart.classList.add('hidden')
      scoreDialog.innerHTML = score;
      break
    }
  }
}

function closeModal() {
  modal.style.display = 'none'
}

//neon effect experiment

var drawRectangle = function(x, y, w, h, border){
  ctx.beginPath();
  ctx.moveTo(x+border, y);
  ctx.lineTo(x+w-border, y);
  ctx.quadraticCurveTo(x+w-border, y, x+w, y+border);
  ctx.lineTo(x+w, y+h-border);
  ctx.quadraticCurveTo(x+w, y+h-border, x+w-border, y+h);
  ctx.lineTo(x+border, y+h);
  ctx.quadraticCurveTo(x+border, y+h, x, y+h-border);
  ctx.lineTo(x, y+border);
  ctx.quadraticCurveTo(x, y+border, x+border, y);
  ctx.closePath();
  ctx.stroke();
}
var neonRect = function(x,y,w,h,r,g,b){
ctx.shadowColor = "rgb("+r+","+g+","+b+")";
ctx.shadowBlur = 10;
ctx.strokeStyle= "rgba("+r+","+g+","+b+",0.2)";
ctx.lineWidth=7.5;
drawRectangle(x,y,w,h,1.5);
};

function addGlow(x, y){
  ctx.globalCompositeOperation = "lighter";
  neonRect(25+x,25+y,50,50,243,243,21);
  neonRect(225-x,25+y,50,50,193,253,51);
  neonRect(25+x,225-y,50,50,255,153,51);
  neonRect(225-x,225-y,50,50,252,90,184);
  neonRect(125,125,50,50,13,213,252); 
  ctx.globalCompositeOperation = "normal";
}



