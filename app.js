const canvas = document.querySelector('#canvas');
const ctx = canvas.getContext("2d");
let modal = document.querySelector('#modal-main')
let dialogGameover = document.querySelector('.dialog.game-over')
let dialogStart = document.querySelector('.dialog.game-start')
let scoreTop = document.querySelector('#score-top')
let scoreDialog = document.querySelector('#score-dialog')
let wavesDialog = document.querySelector('#waves-dialog')
let dispAmmoRegular = document.querySelector('#ammo-regular')
let dispAmmoShrapnel = document.querySelector('#ammo-shrapnel')
let dispAmmoCannonball = document.querySelector('#ammo-cannonball')
let dispAmmoExplosive = document.querySelector('#ammo-explosive')

let ammoSpriteRegular = document.querySelector('.ammo.regular')
let ammoSpriteShrapnel = document.querySelector('.ammo.shrapnel')
let ammoSpriteCannonball = document.querySelector('.ammo.cannonball')
let ammoSpriteExplosive = document.querySelector('.ammo.explosive')
let ammoSpriteMachine = document.querySelector('.ammo.machine')

let overlayMain = document.querySelector('.overlay-main')
let overlaysInfo = [];
canvas.width = window.innerWidth
canvas.height = window.innerHeight

window.onresize = function() {
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
}

let pressedShift = false;
let pressedCtrl = false;

let pressedLeft = false;
let pressedRight = false;
let pressedUp = false;
let pressedDown = false;

let dodgeDir = null;
let dodgeOrigin = null;
let dodgeWindow;
let windup = 0;
let dodgePosVisible = false;
// timers
let enemySpawnTimer;

let gameover = false;
let score = 0;
let ammoRegular = 0
let ammoShrapnel = 0
let ammoCannonball = 0
let ammoExplosive = 0
let ammoMachine = 0
let currentAmmoType = 'shrapnel';
let enemyCap = 12;
let minRadToKill = 20
let reachedEnemyCap = false;
let waveNumber = 1;
let waveActive = false;

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
    this.invulnerable = false;
  }
  draw() {
    ctx.beginPath();
    ctx.arc(this.x,this.y,this.radius,0,Math.PI * 2)
    if(this.invulnerable) {
      ctx.save()
      ctx.globalAlpha = 0.4;
      ctx.fillStyle = this.color
      ctx.fill();
      ctx.closePath();    
      ctx.restore()
    } else {
      ctx.fillStyle = this.color
      ctx.fill();
      ctx.closePath();
    }
  }
  move(direction) {

  }
  dodge(direction) {
    // console.log(this.dodgeDistance)
    if(dodgeDir !== null) return;
      playerMoved = true;
      player.invulnerable = true;
      if(direction == 'left') {
        gsap.fromTo(this,{x: this.x }, {duration: dodgeSpeed + (dodgeDistance/1000), onComplete: () => {dodgeFinish()},x: this.x -= this.dodgeDistance.x})
        dodgeDir = direction;
      }
      if(direction == 'right') {
        gsap.fromTo(this,{x: this.x }, {duration: dodgeSpeed + (dodgeDistance/1000), onComplete: () => {dodgeFinish()},x: this.x += this.dodgeDistance.x})
        dodgeDir = direction;
      }
      if(direction == 'up') {
        gsap.fromTo(this,{y: this.y }, {duration: dodgeSpeed + (dodgeDistance/1000), onComplete: () => {dodgeFinish()},y: this.y -= this.dodgeDistance.y})
        dodgeDir = direction;
      }
      if(direction == 'down') {
        gsap.fromTo(this,{y: this.y }, {duration: dodgeSpeed + (dodgeDistance/1000), onComplete: () => {dodgeFinish()},y: this.y += this.dodgeDistance.y})
        dodgeDir = direction;
      }
      if(direction == 'upLeft') {
        gsap.fromTo(this,{x: this.x ,y: this.y}, {duration: dodgeSpeed + (dodgeDistance/1000), onComplete: () => {dodgeFinish()},x: this.x -= this.dodgeDistance.x / 1.414, y: this.y -= this.dodgeDistance.y / 1.414})
        dodgeDir = direction;
      }
      if(direction == 'downLeft') {
        gsap.fromTo(this,{x: this.x ,y: this.y}, {duration: dodgeSpeed + (dodgeDistance/1000), onComplete: () => {dodgeFinish()},x: this.x -= this.dodgeDistance.x / 1.414, y: this.y += this.dodgeDistance.y / 1.414})
        dodgeDir = direction;
      }
      if(direction == 'upRight') {
        gsap.fromTo(this,{x: this.x ,y: this.y}, {duration: dodgeSpeed + (dodgeDistance/1000), onComplete: () => {dodgeFinish()},x: this.x += this.dodgeDistance.x / 1.414, y: this.y -= this.dodgeDistance.y / 1.414})
        dodgeDir = direction;
      }
      if(direction == 'downRight') {
        gsap.fromTo(this,{x: this.x ,y: this.y}, {duration: dodgeSpeed + (dodgeDistance/1000), onComplete: () => {dodgeFinish()},x: this.x += this.dodgeDistance.x / 1.414, y: this.y += this.dodgeDistance.y / 1.414})
        dodgeDir = direction;
      }
    
  }
  update() {
    this.draw()
  }
}

class Projectile {
  constructor(x,y,radius,color,velocity,type) {
    if(!type) console.log('Error: Missing projectile type.')
    if(type == 'regular') {
      this.x = x;
      this.y = y;
      this.radius = radius;
      this.color = color;
      this.velocity = velocity;
      this.bounces = 1;
      this.bounced = false;
      this.power = 1.5
      this.type = type;
    }
    if(type == 'shrapnel') { // problematic, the projectiles aren't visible
      this.x = x;
      this.y = y;
      this.radius = radius * shrapnelRadiusMult;
      this.color = color;
      this.velocity = {
        x: velocity.x *0.8,
        y: velocity.y *0.8,
      };
      this.bounces = 0;
      this.bounced = false;
      this.power = 2
      this.type = type;
    }
    if(type == 'cannonball') { // problematic, the projectiles aren't visible
      this.x = x;
      this.y = y;
      this.radius = radius * cannonballRadiusMult;
      this.color = color;
      this.velocity = {
        x: velocity.x *0.5,
        y: velocity.y *0.5,
      };
      this.bounces = 0;
      this.bounced = false;
      this.life = 4;
      this.power = 5
      this.type = type;
    }
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
    this.velInhibition = 1
    this.destroy = false;
    this.dead = false;
    this.target = 'player';
    this.changingTarget = false;

  }
  draw() {
    if(this.radius < 1) return;
    ctx.beginPath();
    ctx.arc(this.x,this.y,this.radius,0,Math.PI * 2, false)
    ctx.fillStyle = this.color
    ctx.fill();
    ctx.closePath();
  }
  update() {

    // check whether base or player is the closest thing
    let distPlayer = Math.hypot(player.x - this.x, player.y - this.y)
    let distBase = Math.hypot(mainbase.x - this.x, mainbase.y - this.y) 
    
    // if player is the closest
    if(distPlayer < distBase) {
      this.target = 'player'
      if(playerMoved) {  // this might break at some point, since this is only run when player is closer to the enemy, but not when the base is //issue
        setTimeout(()=>{
          var angle = Math.atan2( player.y - this.y, player.x - this.x);
          gsap.fromTo(this.velocity,{x: this.velocity.x,y: this.velocity.y},{x: Math.cos(angle)*enemySpeed, y: Math.sin(angle)*enemySpeed, duration: 1})
          playerMoved = false;
        },150)
      }
    } 
    else if(distPlayer > distBase) {
      this.target = 'base'
      setTimeout(()=>{
        var angle = Math.atan2( mainbase.y - this.y, mainbase.x - this.x);
        gsap.fromTo(this.velocity,{x: this.velocity.x,y: this.velocity.y},{x: Math.cos(angle)*enemySpeed, y: Math.sin(angle)*enemySpeed, duration: 1})
        
      },150)
    }
    this.x += this.velocity.x / this.velInhibition
    this.y += this.velocity.y / this.velInhibition

    if(this.velInhibition > 1.02) { // -0.5 * 0.02 => 
     var decrease = (1 - this.velInhibition) * 0.01 // the smaller the last number, the slower the return to 1
     this.velInhibition += decrease
    //  console.log(this.velInhibition)
    } 
    else if(this.velInhibition > 1 && this.velInhibition < 1.02) {
      this.velInhibition = 1;
    }
    this.draw();
    
  }
}
class Leader extends Enemy {
  constructor(x,y,radius,color,velocity,velInhibition,destroy,dead,target,changingTarget) {
    super(x,y,radius,color,velocity,velInhibition,destroy,dead,target,changingTarget)
    this.radius = radius * 1.5 + 10
    this.leader = true;
  }
}

class Particle {
  constructor(x,y,radius,color,velocity,origin,type) {
    if(type == 'shrapnel') {
      this.x = x
      this.y = y
      this.radius = radius * 2
      this.color = color
      this.velocity = velocity
      this.alpha = 1000
      this.origin = origin
      this.bounces = 2
      this.bounced = false
      this.type = type
    }
    if(type == 'particle') {
      this.x = x
      this.y = y
      this.radius = radius
      this.color = color
      this.velocity = velocity
      this.alpha = 100
      this.origin = origin
      this.bounces = 3
      this.bounced = false
      this.type = type

    }
  }
  draw() {
    ctx.save()
    ctx.globalAlpha = this.alpha / 100;
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
    if(this.type == 'particle') {
      this.alpha -= 1;
    }
  }
}

class Base {
  constructor(x,y,radius,color,health) {
    this.x = x
    this.y = y
    this.radius = radius
    this.color = color
    this.health = health
  }
  draw() {
    ctx.beginPath()
    ctx.arc(centerX,centerY,this.radius,0, Math.PI*2, false)
    ctx.fillStyle = this.color
    ctx.fill()
    ctx.closePath()
  }
  update() {
    this.draw()
  }
}

class Info {
  constructor(x,y,text) {
    this.x = x
    this.y = y
    this.text = text
    this.life = 100
    this.dead = false;

    this.visual = document.createElement('div')
    this.visual.classList.add('info-blip')
    this.visual.style.position = 'absolute'
    this.visual.style.left = this.x + 'px'
    this.visual.style.top = this.y + 'px'
    this.visual.innerText = '+2 AMMO'
    overlayMain.append(this.visual)
    overlaysInfo.push(this)
  }
  update() {
    this.life--
    this.visual.style.filter = `opacity(${this.life/100})`
    // console.log(this.visual.style.filter)
    if(this.life <= 0) {
      this.visual.remove()
      this.dead = true;
    }
  }
}

function spawnEnemy() {
    if(reachedEnemyCap) return;

    var radius = Math.random() * (enemyRadius - 15) + 15;
    var x = 0;
    var y = 0;
    var switchXY = Math.round(Math.random());
    if(switchXY) {
      x = Math.round(Math.random()) ? 0 - enemyRadius : canvas.width + enemyRadius;
      y = Math.random() * canvas.height;
    } else {
      x = Math.random() * canvas.width;
      y = Math.round(Math.random()) ? 0 - enemyRadius : canvas.height + enemyRadius;
    }
    
    var color = getColor('enemy');
    var angle = Math.atan2( player.y - y, player.x - x);
    var velocity = {
      x: Math.cos(angle)*enemySpeed,
      y: Math.sin(angle)*enemySpeed,
    }

    var leaderchance = Math.random() * 10
    if(leaderchance > 9) {
      color = getColor('leader')
      enemies.push(new Leader(x, y, radius, color, velocity));
    } else {
      enemies.push(new Enemy(x, y, radius, color, velocity));
    }
  
}

function init() {
  gameover = false
  dodgeDir = null;
  waveActive = true;
  waveNumber = 1;
  score = 0;
  ammoRegular = 30
  ammoShrapnel = 3
  ammoCannonball = 2
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

let centerX = canvas.width/2;
let centerY = canvas.height/2;
let mouseX;
let mouseY;

let dodgeDistance = 300

let cursorRadius = 10;
let playerMoved = false;
let dodgeSpeed = 0.1;
let dodgeSpeedMod = dodgeDistance; // interesting idea
let dodgeResizing = false;

let baseHealth = 500;
let baseRadius = 80;

const projectiles = [];
const enemies = [];
const particles = [];

let projRadius = 7;
let projectileSpeed = 7;
let shrapnelRadiusMult = 1.5;
let cannonballRadiusMult = 4;
let enemyRadius = 40;
let enemySpeed = 1;
let particleRadius = 3;
let particleVariance = 3;
let particleSpeed = 4;
let friction = 0.999;

const player = new Player(centerX, centerY, 20, 'white', {x: dodgeDistance, y: dodgeDistance})
const mainbase = new Base(centerX, centerY, baseRadius, 'hsl(234,50%,12%)', baseHealth)


canvas.addEventListener('mousemove', function(e) {
  mouseX = e.offsetX
  mouseY = e.offsetY
  // console.log(mouseX + ' ' + mouseY)
})
canvas.addEventListener('wheel', processWheelEvents, {passive: true})

function processWheelEvents(e) {
  console.log(e.deltaY)
  if(pressedShift) {
    resizeDodge(e)
  } else {
    if(e.deltaY > 0) 
    cycleAmmo('normal')
    else if(e.deltaY < 0) 
    cycleAmmo('reverse')
  }

}
function resizeDodge(e) {
  var resize = e.deltaY / 5
  dodgeDistance -= resize;

  if(!dodgeResizing) {
    dodgeResizing = true
  }
  gsap.fromTo(player.dodgeDistance,{
    x: player.dodgeDistance.x,
    y: player.dodgeDistance.y,
  },{
    x: dodgeDistance,
    y: dodgeDistance,
    duration: 0.2,
    onComplete: ()=> {dodgeResizing = false}
  })
}
canvas.addEventListener('click', fire)

function fire(e) {
  if(gameover) return;

  if(currentAmmoType == 'regular' && ammoRegular > 0) {
    ammoRegular--
    spawnProjectile(e)
  }
  if(currentAmmoType == 'shrapnel' && ammoShrapnel > 0) {
    ammoShrapnel--
    spawnProjectile(e)
  }
  if(currentAmmoType == 'cannonball' && ammoCannonball > 0) {
    ammoCannonball--
    spawnProjectile(e)
  }
  if(currentAmmoType == 'explosive' && ammoExplosive > 0) {
    ammoExplosive--
    spawnProjectile(e)
  }
  // spawnProjectile(e)
  updateAmmoVisual();

}
function spawnProjectile(e) {
  const angle = Math.atan2( e.clientY - player.y, e.clientX - player.x);
  const velocity = {
    x: Math.cos(angle) * projectileSpeed,
    y: Math.sin(angle) * projectileSpeed,
  }
  projectiles.push(new Projectile(player.x, player.y, projRadius, 'lightblue', velocity, currentAmmoType ))
}

function drawBackground() {
  ctx.beginPath();
  ctx.rect(0,0,canvas.width,canvas.height)
  ctx.fillStyle = 'rgba(0,0,0,1)'
  ctx.fill()
  ctx.closePath();
}

function drawCursor() {
  ctx.beginPath();
  ctx.arc(mouseX,mouseY,cursorRadius,0,Math.PI * 2, false)
  ctx.strokeStyle = 'hsl(0,100%,100%)'
  ctx.stroke()
  ctx.closePath();
}
// main draw function
let drawId = null;
function draw() {
  // ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBackground();
  mainbase.update();
  projectiles.forEach((projectile, indexProj)=> {
    projectile.update()

    // ricochet projectile off walls if bounces > 0
    if( ((projectile.x > (canvas.width - projRadius) || projectile.x < (0 + projRadius)) || 
        (projectile.y > (canvas.height - projRadius) || projectile.y < (0 + projRadius))) &&
        projectile.bounces > 0
      ) {
        console.log('projectile bounces: ' + projectile.bounces)
      projectile.bounced = true
      projectile.bounces -= 1
      projectile.velocity.x *= -1
      projectile.velocity.y *= -1
      setTimeout(()=>{projectile.bounced = false},100)
    }
    // destroy projectile if it went off the canvas
    else if( (projectile.x > (canvas.width + projRadius*2 ) || projectile.x < (0 - projRadius*2)) || (projectile.y > (canvas.height + projRadius*2) || projectile.y < (0 - projRadius*2)) ) {
      setTimeout(()=> {
        projectiles.splice(indexProj, 1);
      },0)
    }
  })

  enemies.forEach((enemy, indexEnemy) => {
    enemy.update();

    //automatic cleanup of enemies with radius <=1
    if(enemy.radius <= 1) enemies.splice(indexEnemy,1);
    // avoid running any more code on dead enemies, they will be removed automatically
    if(enemy.dead == true) return;
    const distance = Math.hypot(player.x - enemy.x,player.y - enemy.y)
    
    // when player is touched by an enemy
    if(distance - player.radius - enemy.radius < 0) {
      if(player.invulnerable == false) {

        endGame();
      }
    }
    // remove enemy after it travels too far outside canvas bounds
    if( (enemy.x > (canvas.width + enemyRadius*2 ) || enemy.x < (0 - enemyRadius*2)) || (enemy.y > (canvas.height + enemyRadius*2) || enemy.y < (0 - enemyRadius*2)) ) {
      enemies.splice(indexEnemy, 1);
    }

    projectiles.forEach((projectile, indexProj) => {


      const distance = Math.hypot(projectile.x - enemy.x,projectile.y - enemy.y) // draws a right-angle triangle and calculates the distance between two points
      
      // when projectile hits an enemy
      if(distance - enemy.radius - projectile.radius < -2) {
        
        if(Math.random()*9 > 5) {
          gainAmmo('regular')
          gainAmmo('regular')
          displayPopup('plus-ammo', enemy.x, enemy.y)
        }

        // calculate enemy slowdown
        enemy.velInhibition *= projectile.power

        // spawn regular particles
        if (projectile.type == 'regular') {
          for (let i = 0; i < enemy.radius/3; i++) {
            particles.push(new Particle(
              (projectile.x + (Math.random()*20 - 10)), 
              (projectile.y + (Math.random()*20 - 10)), 
              (Math.random()*particleVariance/2 + (particleRadius - particleVariance/2)), 
              enemy.color, 
              { 
                x: Math.random()*10 - 5 , 
                y: Math.random()*10 - 5 ,
              },
              enemy,
              'particle'
              ))
            }
          }
          
          // spawn shrapnel + regular particles
          if (projectile.type == 'shrapnel') {

          for (let i = 0; i < enemy.radius/6; i++) {
            particles.push(new Particle(
              (projectile.x + (Math.random()*20 - 10)), 
              (projectile.y + (Math.random()*20 - 10)), 
              (Math.random()*particleVariance/2 + (particleRadius - particleVariance/2)), 
              enemy.color, 
            { 
              x: Math.random()*10 - 5 , 
              y: Math.random()*10 - 5 ,
            },
            enemy,
            'particle'
            ))
          }
          for (let i = 0; i < enemy.radius/3; i++) {
            particles.push(new Particle(
              (projectile.x + (Math.random()*20 - 10)), 
              (projectile.y + (Math.random()*20 - 10)), 
              (Math.random()*particleVariance/2 + (particleRadius - particleVariance/2)), 
              enemy.color, 
            { 
              x: (Math.random()*2 - 1) + projectile.velocity.x, 
              y: (Math.random()*2 - 1) + projectile.velocity.y,
            },
            enemy,
            'shrapnel'
            ))
          }
        }
        
        

        // shrink enemy on hit by 'regular'
        if (enemy.radius > minRadToKill && projectile.type == 'regular') {
          gsap.to(enemy, {radius: enemy.radius - 10})
          setTimeout(()=> {
            projectiles.splice(indexProj, 1);
          },0)
          updateScore('shrink-enemy')
        } 

        // kill enemy by cannonball
        if (projectile.type == 'cannonball') {
          gsap.to(enemy, {radius: 1})
          projectile.life--
          if(projectile.life < 1) {
            setTimeout(()=> {
              projectiles.splice(indexProj, 1);
            },0)
          }
          enemy.dead = true;
          console.log(enemy)
          updateScore('kill-enemy')
        } 
        // kill the enemy hit by shrapnel projectile
        if(projectile.type == 'shrapnel') {
          setTimeout(()=> {
            enemies.splice(indexEnemy, 1);
            projectiles.splice(indexProj, 1);
          },0)
          updateScore('kill-enemy')
          enemy.dead = true;
        }
        
        // kill enemy if it's less than the minimum radius required to kill an enemy, but use GSAP, because gsap == fancy++
        if(enemy.radius < minRadToKill) {
          enemy.dead = true;
          gsap.to(enemy,{radius: 1, onComplete: () => {
            enemies.forEach((en, ind) => {
              if(en.dead == true) enemies.splice(ind,1)
          })}})
          setTimeout(()=> {
            // enemies.splice(indexEnemy, 1);
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
        if(particle.type == 'regular') {

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
        }
        if(particle.type == 'shrapnel') {

          
          //decrease the enemy radius upon hit by shrapnel particle
          enemy.destroy = true;
          console.log(enemy)
          gsap.to(enemy, {radius: enemy.radius - 5, duration: 0.1, onComplete:()=> {
            if(enemy.radius <= 10) {
              gsap.to(enemy, {radius: 1, duration: 0.1, onComplete:()=> {
                enemies.forEach((enemyy, indexx)=>{
                  if(
                    enemyy.destroy == true && 
                    enemyy.radius < 5
                    ) {
                    enemies.splice(indexx,1)
                    console.log(enemyy)
                  }
                })
              }})
            }
          }})
        }
          
          particles.splice(particleIndex,1)
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

  //player mechanics
  player.update();
  
  if(pressedShift) {
    displayDodgePositions()
  }
  if(dodgePosVisible == true && !pressedShift) {
    windup = 0;
    dodgePosVisible = false
  }
  // draw various UI bits
  overlaysInfo.forEach((overlay, index) => {
    overlay.update()
    if(overlay.dead == true) {
      overlaysInfo.splice(index,1)
    }
  })
  drawCursor();

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

// utility functions 

function randColor(arg) {
  if(arg == 'enemy') {
    var hue = Math.round(Math.random() * 360)
    var sat = Math.round(Math.random() * 50 + 50)
    var light = Math.round((Math.random() * 10) + 40)
    var color = `hsl(${hue},${sat}%,${light}%)`
    return color
  }
}
function getColor(arg) {
  if(arg == 'enemy') {
    return 'rgb(56, 39, 218)'
  }
  if(arg == 'leader') {
    return 'rgb(223, 43, 97)'
  }
}

function calcHypotenuse(a, b) {
  return (Math.sqrt((a * a) + (b * b)));
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
    // console.log('[Shift] down')
    setDodgeOrigin();
  }
  if(e.code == 'KeyA' && pressedShift) {
    pressedLeft = true
    prepareDodge()
  }
  if(e.code == 'KeyD' && pressedShift) {
    pressedRight = true
    prepareDodge()
  }
  if(e.code == 'KeyW' && pressedShift) {
    pressedUp = true
    prepareDodge()
  }
  if(e.code == 'KeyS' && pressedShift) {
    pressedDown = true
    prepareDodge()
  }
  if(e.code == 'KeyC') {
    cycleAmmo('normal');
  }
}

//keyup
document.addEventListener('keyup', processKeyup, false)

function processKeyup(e) {
  if(e.code == 'ShiftLeft') {
    pressedShift = false
    // clearInterval(dodgeWindow)

  }
  if(e.code == 'KeyA') {
    pressedLeft = false
    // prepareDodge()
  }
  if(e.code == 'KeyD') {
    pressedRight = false
    // prepareDodge()
  }
  if(e.code == 'KeyW') {
    pressedUp = false
    // prepareDodge()
  }
  if(e.code == 'KeyS') {
    pressedDown = false
    // prepareDodge()
  }
}

//player movement
function setDodgeOrigin() {
  dodgeOrigin = {
    x: player.x,
    y: player.y,
  }
}

function prepareDodge() {
  if(!pressedShift) {
    console.log('Dodge canceled.')
  }
  //check if only two are active and more than one is active
  if(
    ((+pressedLeft + +pressedRight + +pressedDown + +pressedUp) > 2 &&
    (+pressedLeft + +pressedRight + +pressedDown + +pressedUp) < 1) 
    ||
    pressedLeft && pressedRight 
    ||
    pressedUp && pressedDown
    ) {
      console.log('Cannot call player.dodge(), directions are invalid or dodge canceled.')
      return
  }

  clearTimeout(dodgeWindow)
  var direction;

  if(pressedLeft && !pressedUp && !pressedDown) {
    direction = 'left'
  }
  
  if(pressedRight && !pressedUp && !pressedDown) {
    direction = 'right'
  }

  if(pressedUp && !pressedLeft && !pressedRight) {
    direction = 'up'
  }

  if(pressedDown && !pressedLeft && !pressedRight) {
    direction = 'down'
  }

  if(pressedUp && pressedLeft) {
    direction = 'upLeft'
  }
  if(pressedDown && pressedLeft) {
    direction = 'downLeft'
  }

  if(pressedUp && pressedRight) {
    direction = 'upRight'
  }
  if(pressedDown && pressedRight) {
    direction = 'downRight'
  }

  if((+pressedLeft + +pressedRight + +pressedDown + +pressedUp) > 1) {
    dodgeWindow = setTimeout(()=>{
      player.dodge(direction)
    },20)
  } else {
    dodgeWindow = setTimeout(()=>{
      player.dodge(direction)
    },120)
  }
}
function dodgeFinish() {
  dodgeDir = null;
  player.invulnerable = false;
  setDodgeOrigin();
  windup = 0;
}

function displayDodgePositions() {
  dodgePosVisible = true;
  if(windup < 42) windup += 6
  ctx.save()
  ctx.globalAlpha = windup / 100
  ctx.strokeStyle = player.color

  //left
  ctx.beginPath();
  ctx.arc(
    dodgeOrigin.x - player.dodgeDistance.x,
    dodgeOrigin.y,
    player.radius,
    0,
    Math.PI * 2, 
    false
    )
  ctx.stroke();
  ctx.closePath();

  // right
  ctx.beginPath();
  ctx.arc(
    dodgeOrigin.x + player.dodgeDistance.x,
    dodgeOrigin.y,
    player.radius,
    0,
    Math.PI * 2, 
    false
    )
  ctx.stroke();
  ctx.closePath();

  //down
  ctx.beginPath();
  ctx.arc(
    dodgeOrigin.x,
    dodgeOrigin.y + player.dodgeDistance.y,
    player.radius,
    0,
    Math.PI * 2, 
    false
    )
  ctx.stroke();
  ctx.closePath();

  // up
  ctx.beginPath();
  ctx.arc(
    dodgeOrigin.x,
    dodgeOrigin.y - player.dodgeDistance.y,
    player.radius,
    0,
    Math.PI * 2, 
    false
    )
  ctx.stroke();
  ctx.closePath();

  // upLeft
  ctx.beginPath();
  ctx.arc(
    dodgeOrigin.x - (player.dodgeDistance.x / 1.414),
    dodgeOrigin.y - (player.dodgeDistance.y / 1.414),
    player.radius,
    0,
    Math.PI * 2, 
    false
    )
  ctx.stroke();
  ctx.closePath();

  // downLeft
  ctx.beginPath();
  ctx.arc(
    dodgeOrigin.x - (player.dodgeDistance.x / 1.414),
    dodgeOrigin.y + (player.dodgeDistance.y / 1.414),
    player.radius,
    0,
    Math.PI * 2, 
    false
    )
  ctx.stroke();
  ctx.closePath();

  // upRight
  ctx.beginPath();
  ctx.arc(
    dodgeOrigin.x + (player.dodgeDistance.x / 1.414),
    dodgeOrigin.y - (player.dodgeDistance.y / 1.414),
    player.radius,
    0,
    Math.PI * 2, 
    false
    )
  ctx.stroke();
  ctx.closePath();

  // downRight
  ctx.beginPath();
  ctx.arc(
    dodgeOrigin.x + (player.dodgeDistance.x / 1.414),
    dodgeOrigin.y + (player.dodgeDistance.y / 1.414),
    player.radius,
    0,
    Math.PI * 2, 
    false
    )
  ctx.stroke();
  ctx.closePath();

  ctx.restore()
}
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

function gainAmmo(type) {
  if(type == 'regular') {
    ammoRegular++
  }
  updateAmmoVisual();
}

//UI functionality
function updateScoreVisual() {
  scoreTop.innerHTML = score;
}
function updateAmmoVisual() {
  ammoSpriteRegular.classList.remove('selected')
  ammoSpriteShrapnel.classList.remove('selected')
  ammoSpriteCannonball.classList.remove('selected')
  ammoSpriteExplosive.classList.remove('selected')
  ammoSpriteMachine.classList.remove('selected')

  if(currentAmmoType == 'regular') {
    ammoSpriteRegular.classList.add('selected')
  }
  if(currentAmmoType == 'shrapnel') {
    ammoSpriteShrapnel.classList.add('selected')
  }
  if(currentAmmoType == 'cannonball') {
    ammoSpriteCannonball.classList.add('selected')
  }
  if(currentAmmoType == 'explosive') {
    ammoSpriteExplosive.classList.add('selected')
  }
  if(currentAmmoType == 'machine') {
    ammoSpriteMachine.classList.add('selected')
  }
  dispAmmoRegular.innerHTML = ammoRegular;
  dispAmmoShrapnel.innerHTML = ammoShrapnel;
  dispAmmoCannonball.innerHTML = ammoCannonball;
  dispAmmoExplosive.innerHTML = ammoExplosive;
}
function switchAmmo(arg) {
  currentAmmoType = arg;
  updateAmmoVisual()
}
function cycleAmmo(arg) { // ima do some bad coding here
  if(arg == 'normal')
  if(currentAmmoType == 'regular') {
    currentAmmoType = 'shrapnel';
    updateAmmoVisual();
  }
  else if(currentAmmoType == 'shrapnel') {
    currentAmmoType = 'cannonball';
    updateAmmoVisual();
  }
  else if(currentAmmoType == 'cannonball') {
    currentAmmoType = 'explosive';
    updateAmmoVisual();
  }
  else if(currentAmmoType == 'explosive') {
    currentAmmoType = 'machine';
    updateAmmoVisual();
  }
  else if(currentAmmoType == 'machine') {
    currentAmmoType = 'regular';
    updateAmmoVisual();
  }

  if(arg == 'reverse') {
    if(currentAmmoType == 'machine') {
      currentAmmoType = 'explosive';
      updateAmmoVisual();
    }
    else if(currentAmmoType == 'explosive') {
      currentAmmoType = 'cannonball';
      updateAmmoVisual();
    }
    else if(currentAmmoType == 'cannonball') {
      currentAmmoType = 'shrapnel';
      updateAmmoVisual();
    }
    else if(currentAmmoType == 'shrapnel') {
      currentAmmoType = 'regular';
      updateAmmoVisual();
    }
    else if(currentAmmoType == 'regular') {
      currentAmmoType = 'machine';
      updateAmmoVisual();
    }
  }
}
function openModal(arg) {
  modal.style.display = ''
  switch (arg) {
    case 'gameover' : {
      dialogGameover.classList.remove('hidden')
      dialogStart.classList.add('hidden')
      scoreDialog.innerHTML = score;
      wavesDialog.innerHTML = waveNumber;
      break
    }
  }
}

function closeModal() {
  modal.style.display = 'none'
}

function displayPopup(arg, x, y) {
  if(arg == 'plus-ammo') {
    var info = new Info(x, y, '+2 AMMO')
  }
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



// wave logic

function startWave() {

}

function endWave() {
  waveActive = false;
  waveNumber++
}