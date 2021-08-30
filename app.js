const canvas = document.querySelector('#canvas');
const ctx = canvas.getContext("2d");

const pi = Math.PI

let shipSprite = new Image(); //issue i think the ship sprite should be contained within Player class
shipSprite.src = 'assets/moth_default.png'
let shipSize = 128;

let ghosts = []
let ghostNumber = 5
let ghostOpacity = 0.3

let modal = document.querySelector('#modal-main')
let dialogGameover = document.querySelector('.dialog.game-over')
let dialogStart = document.querySelector('.dialog.game-start')
let dialogOverlay = document.querySelector('.overlay-dialog')

let scoreTop = document.querySelector('#score-top')
let scoreDialog = document.querySelector('#score-dialog')
let wavesDialog = document.querySelector('#waves-dialog')

let mapContainer = document.querySelector('#map-container')
let arrowContainer = document.querySelector('#arrow-container')
let dialogContainer = document.querySelector('#dialog-container')

let sectorMap = document.querySelector('#sector-map')

let arrows = Array.from(document.querySelectorAll('.arrow'))
arrows[0].direction = 'left'
arrows[1].direction = 'right'
arrows[2].direction = 'up'
arrows[3].direction = 'down'
let dispAmmoRegular = document.querySelector('#ammo-regular')
let dispAmmoShrapnel = document.querySelector('#ammo-shrapnel')
let dispAmmoCannonball = document.querySelector('#ammo-cannonball')
let dispAmmoExplosive = document.querySelector('#ammo-explosive')
let dispAmmoMachine = document.querySelector('#ammo-machine')

let ammoSpriteRegular = document.querySelector('.ammo.regular')
let ammoSpriteShrapnel = document.querySelector('.ammo.shrapnel')
let ammoSpriteCannonball = document.querySelector('.ammo.cannonball')
let ammoSpriteExplosive = document.querySelector('.ammo.explosive')
let ammoSpriteMachine = document.querySelector('.ammo.machine')

let healthbar = document.querySelector('.healthbar')
let healthSegments = Array.from(document.querySelectorAll('.armor-segment'))
let overlayMain = document.querySelector('.overlay-main')
let overlaysInfo = [];
canvas.width = window.innerWidth
canvas.height = window.innerHeight

let dialogs = []
let deadShipDialogs = []


let cw = canvas.width //idea replace the lenghty canvas.width with cw
let ch = canvas.height
let drawId = null;

window.onresize = function() {
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
  centerX = canvas.width/2;
  centerY = canvas.height/2;
  cw = canvas.width 
  ch = canvas.height
}
let energy = 100; //idea //this could be used for the jumps, they consume energy, which has to be recovered
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
let dodgePreview = null;

let turningCCW = false
let turningCW = false
let movingForward = false
let movingBackward = false

let fired = false;
let firedFadeout = 10;
// timers
let enemySpawnTimer;
let machineTimer;
let accelerateTimer;
let firedTimer;

let gameover = false;
let score = 0;
let ammoRegular = 0
let ammoShrapnel = 0
let ammoCannonball = 0
let ammoExplosive = 0
let ammoMachine = 0
let ammoTotal = 0;
let currentAmmoType = 'regular';
let enemyCap = 12;
let minRadToKill = 20
let minRadToBurn = 13
let velInhibBase = 1
let burnDamage = 5
let leaderChanceMult = 1
let reachedEnemyCap = false;
let waveNumber = 1;
let waveActive = false;



//classes
class Player {
  constructor (x,y,radius,rotation,color,dodgeDistance) {
    this.x = x
    this.y = y
    this.radius = radius
    this.rotation = rotation
    this.steerSpeed = 3 // 360 % this.steerSpeed must == 0
    this.color = color
    this.dodgeDistance = dodgeDistance
    this.velocity = { //basically movement speed, //idea // could be upgraded by some way, as a simple engine upgrade
      x: 0,
      y: 0,
    }

    this.maxVel = 3
    this.movingLeft = false
    this.movingRight = false
    this.movingUp = false
    this.movingDown = false
    this.hidden = false
    this.invulnerable = false

    this.weight = 25
    this.impactResistance = 5
    this.armor = 8
    this.spriteDim = {
      x: 128,
      y: 128
    }
    this.turret = new Image()
    this.turret.src = 'assets/moth_default_turret.png'
    this.turretDim = this.spriteDim
    this.turretRotation = 0

    this.dashInd = new Image()
    this.dashInd.src = 'assets/moth_default_dash_indicator.png'

    this.reactorPower = 2 //idea, try the reactor power now, so i know whether that's something interesting for the game
    this.powerMax = 10 //im not sure what these numbers mean just yet
    this.power = 10

    this.dashTimer = 0 //idea it should go up to around 30 or 40 so you can dash once a second just fine

    this.currentWeapons = [
      {
        key: 'regular',
        ammo: 20
      },
    ]
  }
  draw() {
    //idea blue glow behind ship
    ctx.save()
    ctx.beginPath()
    ctx.arc(this.x,this.y,60,0,pi*2,false)
    ctx.fillStyle = 'hsla(246, 71%, 50%, 0.75)'
    ctx.filter = 'blur(70px)'
    ctx.fill()
    ctx.closePath()
    ctx.restore()


    //draw ship body and dash indicator
    ctx.save()

    ctx.translate(this.x,this.y)
    ctx.rotate(this.rotation * pi / 180)


    if(this.invulnerable) {
      ctx.globalAlpha = 0.4;
      ctx.filter = 'saturate(0)'
    }
    ctx.drawImage(shipSprite, 0 - this.spriteDim.x/2, 0 - this.spriteDim.y/2, this.spriteDim.x, this.spriteDim.y)
    ctx.globalAlpha = 1 / (this.dashTimer/7)
    ctx.drawImage(this.dashInd, 0 - this.spriteDim.x/2, 0 - this.spriteDim.y/2, this.spriteDim.x, this.spriteDim.y)
    ctx.globalAlpha = 1
    ctx.restore()

    //draw turret
    this.rotateTurret()
    ctx.save()
    ctx.translate(this.x,this.y)
    ctx.rotate(this.turretRotation * pi / 180)
    if(this.invulnerable) {
      ctx.globalAlpha = 0.4;
      ctx.filter = 'saturate(0)'
    }
    ctx.drawImage(this.turret, 0 - this.spriteDim.x/2, 0 - this.spriteDim.y/2, this.spriteDim.x, this.spriteDim.y)
    ctx.restore()

  }
  rotateTurret() {
    var angle = Math.atan2(player.y - mouseY, player.x - mouseX);
    this.turretRotation = 270 + (angle * 180) / pi
  }
  drawGhosts() {
    ghosts.forEach((ghost, index) => {
      if(ghost.alpha <= 0) {
       setTimeout(()=>{
        ghosts.splice(index,1)
       },0)
       return
      }
      ghost.draw()
      ghost.alpha -= ghostOpacity / ghostNumber
    })
  }

  saveGhost() {
    ghosts.push(new Ghost(this.x,this.y,this.rotation))
  }
  accelerate() {
    if(!movingForward) return;
    if(dodgeDir) return;
    // if(this.velocity.x * this.velocity.y > this.maxVel ** 2) return 

    //issue, so far I don't have a good way to limit player speed, it's all jank, the speed needs to somehow be the same in all directions, 
    // but so far vel.x and vel.y don't work nicely together, i need to use triangles, but not yet sure how
      var rad; 
      if(this.rotation >= 0 && this.rotation < 90) {
        rad = (90 - this.rotation) * (pi/180);
        this.velocity.x += Math.abs(Math.cos(rad) * this.maxVel/15 )
        this.velocity.y += -Math.abs(Math.sin(rad) * this.maxVel/15 )
      }

      if(this.rotation >= 90 && this.rotation < 180) {
        rad = (90 - (90 - (90 - this.rotation))) * (pi/180);
        this.velocity.x += Math.abs(Math.cos(rad) * this.maxVel/15 )
        this.velocity.y += Math.abs(Math.sin(rad) * this.maxVel/15 )
      }

      if(this.rotation >= 180 && this.rotation < 270) {
        rad = (90 - (90 - (90 - this.rotation))) * (pi/180);
        this.velocity.x += -Math.abs(Math.cos(rad) * this.maxVel/15 )
        this.velocity.y += Math.abs(Math.sin(rad) * this.maxVel/15 )
      }

      if(this.rotation >= 270 && this.rotation < 360) {
        rad = (90 - (90 - (90 - this.rotation))) * (pi/180);
        this.velocity.x += -Math.abs(Math.cos(rad) * this.maxVel/15 )
        this.velocity.y += -Math.abs(Math.sin(rad) * this.maxVel/15 )
      }
      // console.log('Ship angle: ' + (rad*180)/pi)

      //isssue, this doesn't work as it creates the infamous diagonal movement == faster
      // if(this.velocity.x > this.maxVel) {
      //   this.velocity.x = this.maxVel
      // }
      // if(this.velocity.y > this.maxVel) {
      //   this.velocity.y = this.maxVel
      // }
  }

  decelerate() {
    if(movingForward) return;
    
    if(this.velocity.x !== 0) {
      var decrease = (0 - this.velocity.x) * 0.04 // the smaller the last number, the slower the return to 1
      this.velocity.x += decrease
    }
    if(this.velocity.y !== 0) {
      var decrease = (0 - this.velocity.y) * 0.04 // the smaller the last number, the slower the return to 1
      this.velocity.y += decrease
    }
    if(Math.abs(this.velocity.x) < 0.02) {
      this.velocity.x = 0
    }
    if(Math.abs(this.velocity.y) < 0.02) {
      this.velocity.y = 0
    }
  }
  
  move() {
    this.x += this.velocity.x
    this.y += this.velocity.y
  }

  steer() {
    if(turningCCW + turningCW == 0) return;

    // rotate the player sprite to begin with
    if(turningCCW) {
      this.rotation -= this.steerSpeed
      if(this.rotation < 0) this.rotation = 359
    }
    if(turningCW) {
      this.rotation += this.steerSpeed
      if(this.rotation >= 359) this.rotation = 0

    }
  }

  damage() {
    if(this.invulnerable) return;
    if(this.armor <= 0) {
      endGame()
    }
    this.armor--
    updateHealthBar()
    this.invulnerable = true
    setTimeout(()=>{this.invulnerable = false},500)
  }


  dodge(direction) {
    // console.log(this.dodgeDistance)
    if(dodgeDir !== null) return;
      playerMoved = true;
      player.invulnerable = true;
      if(direction == 'left') {
        gsap.fromTo(this,{x: this.x}, {duration: dodgeSpeed + (dodgeDistance/1200), onComplete: () => {dodgeFinish()},x: this.x -= this.dodgeDistance.x})
        dodgeDir = direction;
      }
      if(direction == 'right') {
        gsap.fromTo(this,{x: this.x}, {duration: dodgeSpeed + (dodgeDistance/1200), onComplete: () => {dodgeFinish()},x: this.x += this.dodgeDistance.x})
        dodgeDir = direction;
      }
      if(direction == 'up') {
        gsap.fromTo(this,{y: this.y}, {duration: dodgeSpeed + (dodgeDistance/1200), onComplete: () => {dodgeFinish()},y: this.y -= this.dodgeDistance.y})
        dodgeDir = direction;
      }
      if(direction == 'down') {
        gsap.fromTo(this,{y: this.y}, {duration: dodgeSpeed + (dodgeDistance/1200), onComplete: () => {dodgeFinish()},y: this.y += this.dodgeDistance.y})
        dodgeDir = direction;
      }
      if(direction == 'upLeft') {
        gsap.fromTo(this,{x: this.x ,y: this.y}, {duration: dodgeSpeed + (dodgeDistance/1200), onComplete: () => {dodgeFinish()},x: this.x -= this.dodgeDistance.x / 1.414, y: this.y -= this.dodgeDistance.y / 1.414})
        dodgeDir = direction;
      }
      if(direction == 'downLeft') {
        gsap.fromTo(this,{x: this.x ,y: this.y}, {duration: dodgeSpeed + (dodgeDistance/1200), onComplete: () => {dodgeFinish()},x: this.x -= this.dodgeDistance.x / 1.414, y: this.y += this.dodgeDistance.y / 1.414})
        dodgeDir = direction;
      }
      if(direction == 'upRight') {
        gsap.fromTo(this,{x: this.x ,y: this.y}, {duration: dodgeSpeed + (dodgeDistance/1200), onComplete: () => {dodgeFinish()},x: this.x += this.dodgeDistance.x / 1.414, y: this.y -= this.dodgeDistance.y / 1.414})
        dodgeDir = direction;
      }
      if(direction == 'downRight') {
        gsap.fromTo(this,{x: this.x ,y: this.y}, {duration: dodgeSpeed + (dodgeDistance/1200), onComplete: () => {dodgeFinish()},x: this.x += this.dodgeDistance.x / 1.414, y: this.y += this.dodgeDistance.y / 1.414})
        dodgeDir = direction;
      }
      this.velocity.x = this.velocity.y = 0
  }

  dash(dir) {
    // if(dir == 'left') {
    //   // add a substantial momentary boost towards the ship's left
    // }
    // if(dir == 'right') {
      // add a substantial momentary boost towards the ship's right
      if(this.dashTimer) return;
      if(dodgeDir) return;
      var rad;
      if(this.rotation >= 0 && this.rotation < 90) {
        rad = (90 - this.rotation) * (pi/180);
        this.velocity.x += Math.abs(Math.cos(rad) * this.maxVel*5 )
        this.velocity.y += -Math.abs(Math.sin(rad) * this.maxVel*5 )
      }
      if(this.rotation >= 90 && this.rotation < 180) {
        rad = (90 - (90 - (90 - this.rotation))) * (pi/180);
        this.velocity.x += Math.abs(Math.cos(rad) * this.maxVel*5 )
        this.velocity.y += Math.abs(Math.sin(rad) * this.maxVel*5 )
      }

      if(this.rotation >= 180 && this.rotation < 270) {
        rad = (90 - (90 - (90 - this.rotation))) * (pi/180);
        this.velocity.x += -Math.abs(Math.cos(rad) * this.maxVel*5 )
        this.velocity.y += Math.abs(Math.sin(rad) * this.maxVel*5 )
      }

      if(this.rotation >= 270 && this.rotation < 360) {
        rad = (90 - (90 - (90 - this.rotation))) * (pi/180);
        this.velocity.x += -Math.abs(Math.cos(rad) * this.maxVel*5 )
        this.velocity.y += -Math.abs(Math.sin(rad) * this.maxVel*5 )
      }
    // }
    this.dashTimer = 45
  }
  dashRecharge() {
    if(this.dashTimer >= 1) {
      this.dashTimer--
    }
  }
  update() {
    this.steer()
    this.accelerate()
    this.move()
    this.decelerate()
    this.saveGhost()
    this.drawGhosts()
    this.draw()
    this.dashRecharge()
  }
}

class Ghost {
  constructor(x,y,rotation) {
    this.x = x
    this.y = y
    this.rotation = rotation
    this.alpha = ghostOpacity
  }
  draw() {
    ctx.save()
    ctx.translate(this.x,this.y)
    ctx.rotate(this.rotation * pi / 180)
    if(player.invulnerable) ctx.filter = 'saturate(0)'
    ctx.globalAlpha = this.alpha;
    ctx.drawImage(shipSprite, 0 - shipSize/2, 0 - shipSize/2, shipSize, shipSize)

    ctx.restore()
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
      this.bounces = 3;
      this.bounced = false;
      this.power = 1.3
      this.type = type;
      this.damage = 8
      this.damageFalloff = {
        distance: 200,
        amount: 1,
      }
      this.dead = false;
    }
    if(type == 'shrapnel') {
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
      this.damage = 100
      this.type = type;
      this.dead = false;
    }
    if(type == 'cannonball') {
      this.x = x;
      this.y = y;
      this.radius = radius * cannonballRadiusMult;
      this.color = color;
      this.velocity = {
        x: velocity.x *0.7,
        y: velocity.y *0.7,
      };
      this.bounces = 0;
      this.bounced = false;
      this.life = 4;
      this.power = 6
      this.type = type;
      this.dead = false;
    }
    if(type == 'explosive') {
      this.x = x;
      this.y = y;
      this.radius = radius * explosiveRadiusMult;
      this.color = color;
      this.velocity = {
        x: velocity.x *0.8,
        y: velocity.y *0.8,
      };
      this.bounces = 0;
      this.bounced = false;
      this.power = 6
      this.type = type;
      this.dead = false;
    }
    if(type == 'machine') {
      this.x = x;
      this.y = y;
      this.radius = radius;
      this.color = color;
      this.velocity = {
        x: velocity.x *1.3,
        y: velocity.y *1.3,
      };
      this.bounces = 0;
      this.bounced = false;
      this.power = 1.3
      this.damage = 7
      this.type = type;
      this.dead = false;
    }
  }
  draw() {
    ctx.beginPath();
    ctx.arc(this.x,this.y,this.radius,0,pi * 2, false)
    ctx.fillStyle = this.color
    ctx.fill();
    ctx.closePath();
  }
  saveGhost() {
    projectileGhosts.push(new ProjectileGhost(this.x,this.y,this.radius, this.color))
  }
  
  drawGhosts() {
    projectileGhosts.forEach((ghost)=> {
      ghost.update()
    })
  }
  update() {
    this.saveGhost()
    this.drawGhosts()
    this.draw();
    this.x += this.velocity.x
    this.y += this.velocity.y
    // damagefalloff should affect damage, but how to calculate the distance traveled? 
    // probably log the coordinates of player into the projectile, and then every frame (performance?) do the math.hypot check to know how far it has traveled from that point,
    // this will also need to account for bounces, so each time it bounces, log the projectile position and add the previous distance somewhere to the total distance traveled
    //idea // this shit is ridiculous but it may turn out to be a cool mechanic, perhaps add a special ricochet bullets, or a beam laser that reflects off of surfaces
  }
}

class ProjectileGhost {
  constructor(x,y,radius,color) {
    this.x = x
    this.y = y
    this.radius = radius
    this.color = color
    this.alpha = 0.2
    this.dead = false
  }
  draw() {
    ctx.save()
    ctx.globalAlpha = this.alpha
    // ctx.filter = 'blur(2px)' //issue, this is extremely poor in performance, only about 15 projectiles can screw with the framerate
    ctx.beginPath()
    ctx.arc(this.x,this.y,this.radius,0,pi*2,false)
    ctx.fillStyle = this.color
    ctx.fill()
    ctx.closePath()
    ctx.restore()
  }
  update() {
    this.alpha -= 0.05
    if(this.alpha <= 0) {
      this.dead = true
      return
    }
    this.draw()
  }
} 
class EnemyShip {
  constructor(x,y,radius,rotation) {
    this.x = x
    this.y = y
    this.radius = radius
    this.rotation = rotation
    this.maxVel = 4
    this.velocity = {
      x: 1,
      y: 1,
    }
    this.velAbsorb = 0

    this.armor = 5
    this.invulnerable = false;
    this.destroy = false
    this.dead = false
    this.exploded = false
    this.target = 'player'
    this.tracking = false
    this.hasLineOfSight = false
    this.changingTarget = false
    this.sprite = new Image()
    this.sprite.src = 'assets/wasp_default.png'
    this.spriteDim = {
      x: 128,
      y: 128,
    }
    this.weight = 5
    this.fireTimer = 180
  }
  draw() {
    ctx.save()
    ctx.beginPath()
    ctx.translate(this.x,this.y)
    ctx.rotate(this.rotation * pi / 180)
    if(this.invulnerable) {
      ctx.filter = 'saturate(0)'
    }
    else if (this.dead) {
      ctx.filter = 'brightness(0.8)'
    }

    ctx.drawImage(this.sprite, 0 - this.spriteDim.x/2, 0 - this.spriteDim.y/2,this.spriteDim.x,this.spriteDim.y)

    ctx.closePath()
    ctx.restore()
  }
  followPlayer() {
  
    var angle = Math.atan2( player.y - this.y, player.x - this.x);

    //idea cool mechanic where the ship is looking at your projectiles ↓↓
    
    // if(projectiles[0]) {
    //   angle = Math.atan2( projectiles[0].y - this.y, projectiles[0].x - this.x);
    // }


    // if(!this.tracking) {
    //   this.tracking = true
    //   gsap.fromTo(this,{rotation: this.rotation},{rotation: 90 + (angle * 180) / pi, duration: 1, onComplete:()=>{this.tracking = false}})
    // }

    gsap.fromTo(this,
      {rotation: this.rotation},
      {rotation: 90 + (angle * 180) / pi, duration: 1}
    )
    
    // console.log('Rotation in deg: ' + this.rotation) 
    
    //issue here is the problem with player and enemy colliding -  the enemy ship is constantly accelerating
    
    var dist = Math.hypot(player.x - this.x, player.y - this.y) 

    if(dist < player.spriteDim.x + this.spriteDim.x ) {
      this.velocity.x *= 0.9
      this.velocity.y *= 0.9
    }
    else {
      gsap.fromTo(this.velocity,
        {x: this.velocity.x,y: this.velocity.y},
        {x: Math.cos(angle)*this.maxVel, y: Math.sin(angle)*this.maxVel, duration: 1.5}
      )
    }
    
  }
  accelerate() {

  }

  move() {
    this.x += this.velocity.x
    this.y += this.velocity.y

    if(this.dead) {
      this.velocity.x *= 0.95
      this.velocity.y *= 0.95
    }
  }
  fire() {
    let angle = Math.atan2(player.y - this.y, player.x - this.x );
    let velocity = {
    x: Math.cos(angle) * projectileSpeed,
    y: Math.sin(angle) * projectileSpeed,
    }
    enemyProjectiles.push(new EnemyProjectile(this.x, this.y, projRadius, 'red', velocity, 'regular' ))
  }
  prepareShot() {
    // if(!this.hasLineOfSight) return // unfinished, this will check whether there are any obstacles between player and ship
    if(this.fireTimer <= 0) {
      this.fire()
      this.fireTimer = 180
    }
    else {
      this.fireTimer--
    }
  }

  damage() {
    if(this.dead) return
    if(this.invulnerable) return;
    if(this.armor <= 0) {
      this.dead = true
      deadShipDialogs.push(new DeadShipDialog(this.x,this.y, 
        `Some placeholder text before I figure out what goes here.
        <br><br>
        Loot: 
        <br>
        <span class='loot-item'>• Some scrap </span>
        <br>
        <span class='loot-item'>• Cheap laser mount </span>
        <br>
        `
        ,this))
      return
    }
    this.armor--
    this.invulnerable = true
    setTimeout(()=>{this.invulnerable = false},400)
    
  }
  update() {
    if(!this.dead) {
      this.followPlayer()
      this.prepareShot()
    }
    
    this.move()
    this.draw()
  }
}
class EnemyProjectile {
  constructor(x,y,radius,color,velocity,type) {
    if(type == 'regular') {
      this.x = x;
      this.y = y;
      this.radius = radius;
      this.color = color;
      this.velocity = velocity;
      this.bounces = 3;
      this.bounced = false;
      this.power = 1.3
      this.type = type;
      this.damage = 8
      this.damageFalloff = {
        distance: 200,
        amount: 1,
      }
      this.dead = false;
    }
  }
  draw() {
    ctx.beginPath();
    ctx.arc(this.x,this.y,this.radius,0,pi * 2, false)
    ctx.fillStyle = this.color
    ctx.fill();
    ctx.closePath();
  }
  // drawGhosts() { //unfinished - ghosts of enemy projectiles will be dealt with later
  //   projectileGhosts.forEach((ghost)=> {
  //     ghost.update()
  //   })
  // }
  update() {
    // this.drawGhosts()
    this.x += this.velocity.x
    this.y += this.velocity.y
    this.draw();
  }
}

class Enemy {
  constructor(x,y,radius,color,velocity,velInhibition) {
    this.x = x
    this.y = y
    this.radius = radius
    this.color = color
    this.velocity = velocity
    this.velInhibition = velInhibition
    this.destroy = false;
    this.dead = false;
    this.exploded = false;
    this.target = 'player';
    this.changingTarget = false;

  }
  draw() {
    if(this.radius < 1) return;
    ctx.beginPath();
    ctx.arc(this.x,this.y,this.radius,0,pi * 2, false)
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
      if(true) { //issue // this might break at some point, since this is only run when player is closer to the enemy, but not when the base is closer 
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
    this.x += this.velocity.x / Math.max(this.velInhibition, 1)
    this.y += this.velocity.y / Math.max(this.velInhibition, 1)

    if(this.velInhibition > 1.02) { // -0.5 * 0.02 => 
     var decrease = (1 - this.velInhibition) * 0.01 // the smaller the last number, the slower the return to 1
     this.velInhibition += decrease
    
    } 
    else if(this.velInhibition > 1 && this.velInhibition < 1.02) {
      this.velInhibition = 1;
    }
    this.draw();
    
  }
}
class Leader extends Enemy {
  constructor(x,y,radius,color,velocity, velInhibition) {
    super(x,y,radius,color,velocity, velInhibition);
    this.x = x
    this.y = y
    this.radius = radius * 1.5 + 10
    this.color = color
    this.velocity = velocity
    this.velInhibition = velInhibition / 2
    this.leader = true;
  }
}

class Particle {
  constructor(x,y,radius,color,velocity,origin,type) {
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
      this.power = 1.2
      this.type = type
    }
    if(type == 'explosive') {
      this.x = x
      this.y = y
      this.radius = radius
      this.color = color
      this.velocity = velocity
      this.alpha = 300
      this.origin = origin
      this.bounces = 0
      this.bounced = false
      this.type = type
    }
  }
  draw() {
    ctx.save()
    ctx.globalAlpha = this.alpha / 100;
    ctx.beginPath();
    ctx.arc(this.x,this.y,this.radius,0,pi * 2, false)
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
    if(this.type == 'particle' || this.type == 'explosive') {
      this.alpha -= 1;
    }
  }
}

class Explosion {
  constructor(x,y,radius,color) {
    this.x = x 
    this.y = y 
    this.radius = radius 
    this.color = color
    this.lifeinit = 20
    this.life = this.lifeinit
  }
  draw() {
    ctx.save()
    ctx.globalAlpha = this.life / this.lifeinit
    ctx.beginPath()
    ctx.arc(this.x,this.y,this.radius,0,pi * 2, false)
    ctx.fillStyle = this.color
    ctx.fill();
    ctx.closePath();
    ctx.restore()
  }
  update() {
    this.draw()
    this.life--
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
    ctx.arc(this.x,this.y,this.radius,0, pi*2, false)
    ctx.fillStyle = this.color
    ctx.fill()
    ctx.closePath()
  }
  update() {
    this.draw()
  }
}

class Debris {
  constructor(x,y,rotation,velocity,type) {
    this.x = x
    this.y = y
    this.rotation = rotation
    this.velocity = velocity
    this.type = type
    this.sprite = new Image()
    if(type == 'basic') this.sprite.src = 'assets/debris_basic.png'
    if(type == '2') this.sprite.src = 'assets/debris_2.png'
    if(type == '3') this.sprite.src = 'assets/debris_3.png'
    this.spriteDim = {
      x: 64,
      y: 64,
    }
  }
  draw() {
    ctx.save()
    ctx.translate(this.x,this.y)
    ctx.rotate(this.rotation * pi/180)
    ctx.drawImage(this.sprite, 0 - this.spriteDim.x/2, 0 - this.spriteDim.y/2,this.spriteDim.x,this.spriteDim.y)
    ctx.restore()
    //draw hitbox
    // ctx.beginPath()
    // ctx.arc(this.x,this.y,this.spriteDim.x/2,0,pi*2,false)
    // ctx.strokeStyle = 'white'
    // ctx.lineWidth = '1px'
    // ctx.stroke()
    // ctx.closePath()
  }
  update() {
    this.draw()
    this.x += this.velocity.x
    this.y += this.velocity.y
  }
}

class Asteroid {
  constructor(x,y,rotation,velocity,type) {
    this.x = x
    this.y = y
    this.rotation = rotation
    this.velocity = velocity
    this.type = type
    this.sprite = new Image()
    this.sprite.src = 'assets/asteroid_1.png'
    this.spriteDim = {
      x: 128,
      y: 128
    }
    this.weight = 200
    this.velAbsorb = 0.5
  }
  draw() {
    ctx.save()
    ctx.translate(this.x,this.y)
    ctx.rotate(this.rotation * pi/180)
    ctx.drawImage(this.sprite, 0 - this.spriteDim.x/2, 0 - this.spriteDim.y/2,this.spriteDim.x,this.spriteDim.y)
    ctx.restore()
  }
  update() {
    this.draw()
    this.x += this.velocity.x
    this.y += this.velocity.y
  }
}

class DeadShipDialog {
  constructor(x,y,text,source) {
    this.x = x
    this.y = y
    this.text = text
    this.source = source

    this.visual = document.createElement('div')
    this.visual.classList.add('dialog', 'dead-ship')
    this.visual.innerHTML = this.text

    this.trigger = document.createElement('div')
    this.trigger.classList.add('dialog','trigger-box')
    this.trigger.style.left = (Math.round(this.x) - this.source.radius/2) + 'px'
    this.trigger.style.top = (Math.round(this.y) - this.source.radius/2) + 'px'
    this.trigger.style.pointerEvents = 'none'

    this.indicator = document.createElement('div')
    this.indicator.classList.add('dead-ship-indicator')
    this.trigger.append(this.indicator)
    this.trigger.append(this.visual)
    dialogOverlay.append(this.trigger)
  }

  update() {
    if(
      this.x !== this.source.x || 
      this.y !== this.source.y) 
    {
      this.x = this.source.x
      this.y = this.source.y
      this.trigger.style.left = (Math.round(this.x) - this.source.radius/2) + 'px'
      this.trigger.style.top = (Math.round(this.y) - this.source.radius/2) + 'px'
    }
    if(Math.hypot(player.x - this.x, player.y - this.y) < player.spriteDim.x + this.source.spriteDim.x) {
      this.trigger.style.pointerEvents = 'all'
      this.indicator.style.borderColor = 'white'
    } else {
      this.trigger.style.pointerEvents = 'none'
      this.indicator.style.borderColor = 'hsl(221, 100%, 75%)'

    }
  }
}

class InfoPopup {
  constructor(x,y,text) {
    this.x = x
    this.y = y
    this.text = text
    this.life = 75
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
    if(this.life <= 50) this.visual.style.filter = `opacity(${this.life/50})`
    if(this.life <= 0) {
      this.visual.remove()
      this.dead = true;
    }
  }
}

class Dialog {
  constructor(text) {
    this.text = text
    this.visual = document.createElement('div')
    this.visual.classList.add('dialog','lore')
    this.visual.innerText = this.text
    this.visual.onclick = ()=> {
      init();
      this.visual.remove()
      dialogContainer.style.display = 'none'
      dialogs.splice(0,1)
    }
    dialogContainer.append(this.visual)
  }
}
function spawnEnemy() {
    if(reachedEnemyCap) return;

    var radius = Math.random() * (enemyRadius - 20) + 20; //randomize enemy sizes
    var x = Math.round(Math.random()) ? 0 - enemyRadius : canvas.width + enemyRadius;
    var y = Math.random() * canvas.height;
    var switchXY = Math.round(Math.random());
    if(switchXY) [x,y] = [y,x]
    var color = getColor('enemy');
    var angle = Math.atan2( player.y - y, player.x - x);
    var velocity = {
      x: Math.cos(angle)*enemySpeed,
      y: Math.sin(angle)*enemySpeed,
    }

    var leaderchance = Math.random() * 15 * leaderChanceMult
    leaderChanceMult += 0.05
    if(leaderchance > 14) {
      color = getColor('leader')
      enemies.push(new Leader(x, y, radius, color, velocity, velInhibBase));
      leaderChanceMult = 1
    } else {
      enemies.push(new Enemy(x, y, radius, color, velocity, velInhibBase));
    }
  
}

function spawnEnemyShip() {
  enemyships.push(new EnemyShip(centerX,centerY,50,0))
}

function init() { //this is a hard reset, this resets (almost) everything to the initial state
  
  gameover = false
  
  rooms = []
  currRoom = null
  sectorIndex = 1
  currSector = null
  currRoom = null
  roomIndex = 0
  generateSector()
  arrowContainer.classList.remove('hidden')
  dodgeDir = null;
  waveActive = true;
  waveNumber = 1;
  score = 0;
  // regular amounts
  ammoRegular = 30
  ammoShrapnel = 3
  ammoCannonball = 2
  ammoExplosive = 0
  ammoMachine = 0
  // playtesting amounts
  ammoRegular = 100
  ammoShrapnel = 100
  ammoCannonball = 100
  ammoExplosive = 100
  ammoMachine = 100

  ammoTotal = ammoRegular + ammoShrapnel + ammoCannonball + ammoExplosive + ammoMachine
  player.x = centerX
  player.y = centerY
  player.armor = 8
  player.velocity.x = player.velocity.y = 0
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, canvas.width, canvas.height, 'black');

  enemies = []
  enemyships = []
  enemyProjectiles = []
  projectiles = []
  particles = []
  explosions = []
  asteroids = []
  debriss = []


  cancelAnimationFrame(drawId)
  draw()
  

  // spawnEnemyShip()

  updateScoreVisual()
  updateAmmoVisual()
  updateHealthBar()
  clearRoom()
}

let centerX = canvas.width/2
let centerY = canvas.height/2
let mouseX
let mouseY

let dodgeDistance = 300
let maxDodge = 550
let minDodge = 200
let cursorRadius = 10
let playerMoved = false
let dodgeSpeed = 0.05
let dodgeSpeedMod = dodgeDistance; // interesting idea
let dodgeResizing = false

let baseHealth = 500;
let baseRadius = 80;

let projectiles = []
let projectileGhosts = []
let enemies = []
let enemyProjectiles = []
let particles = []
let explosions = []
let enemyships = []
let asteroids = []
let debriss = []
const projRadius = 5
const projectileSpeed = 9
let shrapnelRadiusMult = 1.5
let cannonballRadiusMult = 4
let explosiveRadiusMult = 2.5
let enemyRadius = 40
let enemySpeed = 1
let particleRadius = 3
let particleVariance = 3
let particleSpeed = 4
let friction = 0.999
let machineFireRate = 12
let explosionColor = 'orange'
let explosionRadius = 220

const player = new Player(centerX, centerY, 20,0, 'white', {x: dodgeDistance, y: dodgeDistance})
let mainbase = new Base(centerX, centerY, baseRadius, 'hsl(234,50%,12%)', baseHealth)


canvas.addEventListener('mousemove', function(e) {
  mouseX = e.offsetX
  mouseY = e.offsetY
  // console.log(mouseX + ' ' + mouseY)
  if(pressedShift) {
    determineDodgeDirection()
  }
})
function determineDodgeDirection() {
  let distLeft = 
  Math.hypot(
    (player.x - player.dodgeDistance.x) - mouseX, 
    player.y - mouseY) 

  let distRight = 
  Math.hypot(
    (player.x + player.dodgeDistance.x) - mouseX, 
    player.y - mouseY) 

  let distUp = 
  Math.hypot(
    player.x - mouseX, 
    (player.y - player.dodgeDistance.y) - mouseY) 

  let distDown = 
  Math.hypot(
    player.x  - mouseX, 
    (player.y + player.dodgeDistance.y) - mouseY) 

  let distUpLeft = 
  Math.hypot(
    (player.x - (player.dodgeDistance.x / 1.414)) - mouseX, 
    (player.y - (player.dodgeDistance.y / 1.414)) - mouseY)

  let distDownLeft = 
  Math.hypot(
    (player.x - (player.dodgeDistance.x / 1.414)) - mouseX, 
    (player.y + (player.dodgeDistance.y / 1.414)) - mouseY) 

  let distUpRight = 
  Math.hypot(
    (player.x + (player.dodgeDistance.x / 1.414)) - mouseX, 
    (player.y - (player.dodgeDistance.y / 1.414)) - mouseY)

  let distDownRight = 
  Math.hypot(
    (player.x + (player.dodgeDistance.x / 1.414)) - mouseX, 
    (player.y + (player.dodgeDistance.y / 1.414)) - mouseY) 

   
  let min = Math.min(
    distLeft,
    distRight,
    distUp,
    distDown,
    distUpLeft,
    distDownLeft,
    distUpRight,
    distDownRight
    );

  if(min == distLeft) {
    dodgePreview = 'left'
  }
  else
  if(min == distRight) {
    dodgePreview = 'right'
  }
  else
  if(min == distUp) {
    dodgePreview = 'up'
  }
  else
  if(min == distDown) {
    dodgePreview = 'down'
  }
  else
  if(min == distUpLeft) {
    dodgePreview = 'upLeft'
  }
  else
  if(min == distUpRight) {
    dodgePreview = 'upRight'
  }
  else
  if(min == distDownLeft) {
    dodgePreview = 'downLeft'
  }
  else
  if(min == distDownRight) {
    dodgePreview = 'downRight'
  }
  else dodgePreview = null

}
canvas.addEventListener('wheel', processWheelEvents, {passive: true})

function processWheelEvents(e) {
  // console.log(e.deltaY)
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
  var resize = e.deltaY / 3
  if(dodgeDistance <= maxDodge && dodgeDistance >= minDodge) {
    dodgeDistance -= resize;
    if(dodgeDistance >= maxDodge) {
      dodgeDistance = maxDodge
    } else if(dodgeDistance <= minDodge) {
      dodgeDistance = minDodge
    }
  
  } else return;

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

canvas.addEventListener('mousedown', function(e) {
  if(!pressedShift) {
    fire(e)
  }
  if(pressedShift) {
    player.dodge(dodgePreview)
  }
})
canvas.addEventListener('mouseup', function() {
  clearInterval(machineTimer);
})

function autoFire() {
  if(currentAmmoType == 'machine' && ammoMachine > 0) {
    machineTimer = setInterval(()=>{
      spawnProjectile({clientX: mouseX,clientY: mouseY})
      if(ammoMachine <= 0) {
        clearInterval(machineTimer);
        return;
      }
      ammoMachine--
      updateAmmoVisual();

    },1000/machineFireRate)
  }
}

function fire(e) {
  if(gameover) return;
  if(ammoTotal < 1) return;
  if(dodgeDir) return;
  calcAmmoTotal()

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
  if(currentAmmoType == 'machine' && ammoMachine > 0) {
    autoFire()
  }
  // spawnProjectile(e)
  updateAmmoVisual();

  //fire animation prototype
  fired = true;
  firedFadeout = 10;

}
function spawnProjectile(e) {
  const angle = Math.atan2( e.clientY - player.y, e.clientX - player.x);
  const velocity = {
    x: Math.cos(angle) * projectileSpeed,
    y: Math.sin(angle) * projectileSpeed,
  }
  projectiles.push(new Projectile(player.x, player.y, projRadius, getProjectileColor(), velocity, currentAmmoType ))
}

function drawBackground() {
  ctx.save()
  ctx.beginPath();
  // ctx.filter = 'blur(2px)'
  ctx.rect(0,0,canvas.width,canvas.height)
  ctx.fillStyle = 'hsla(0,0%,2%,1)'
  ctx.fill()
  ctx.closePath();
  // ctx.drawImage(canvas,0,0,cw,ch)
  ctx.restore()
}

function drawCursor() {
  ctx.beginPath();
  ctx.arc(mouseX,mouseY,cursorRadius,0,pi * 2, false)
  ctx.strokeStyle = 'hsl(0,100%,100%)'
  ctx.stroke()
  ctx.closePath();
}

// main draw function
function draw() {
  ctx.save()
  drawBackground();
  projectiles.forEach((projectile, indexProj)=> {
    

    // ricochet projectile off walls if bounces > 0
    // for left and right wall
    if(
      (projectile.x > (canvas.width - projRadius) || projectile.x < (0 + projRadius)) &&
      projectile.bounces > 0
      ) 
      {
      projectile.bounced = true
      projectile.bounces -= 1
      projectile.velocity.x *= -1
      setTimeout(()=>{projectile.bounced = false},50)
    }

    // top and bottom wall
    if(  
        (projectile.y > (canvas.height - projRadius) || projectile.y < (0 + projRadius)) &&
        projectile.bounces > 0
      ) {
      projectile.bounced = true
      projectile.bounces -= 1
      projectile.velocity.y *= -1
      setTimeout(()=>{projectile.bounced = false},50)
    }

    // destroy projectile if it went off the canvas
    if( (projectile.x > (canvas.width + projRadius*2 ) || projectile.x < (0 - projRadius*2)) || (projectile.y > (canvas.height + projRadius*2) || projectile.y < (0 - projRadius*2)) ) {
      setTimeout(()=> {
        projectiles.splice(indexProj, 1);
      },0)
    }
    projectile.update()
  })
  projectileGhosts.forEach(projectile => {
    projectile.update()
  })
  enemyships.forEach((ship, shipIndex)=> {
    ship.update()
    
    // detect player collision

    let dist = Math.hypot(player.x - ship.x, player.y - ship.y)
    if(
      dist < player.radius + ship.radius &&
      !player.invulnerable
    ) {

      var velTotal = {
        x: (player.velocity.x + ship.velocity.x), 
        y: (player.velocity.y + ship.velocity.y),
      }
      
      // calculate the balance which will determine how much
      var playerBalance = ship.weight / player.weight //issue ,this is a super janky way to write this, it could be just a few lines
      var shipBalance =  player.weight / ship.weight 
      
      var min = Math.min(playerBalance,shipBalance)
      
      playerBalance = 1 - min
      shipBalance = min
      // console.log(playerBalance + ' ' + shipBalance)

      player.velocity.x = velTotal.x * playerBalance
      player.velocity.y = velTotal.y * playerBalance

      ship.velocity.x = velTotal.x * shipBalance
      ship.velocity.y = velTotal.y * shipBalance
    }

    // detect hit by player projectiles 
    if(!ship.invulnerable) 
    projectiles.forEach((projectile,projectileIndex)=> {

        let dist =  Math.hypot(projectile.x - ship.x, projectile.y - ship.y)

        if(dist < ship.radius + projectile.radius) {
          ship.damage()
          projectile.dead = true
        }
    })
  
  })


  enemyProjectiles.forEach((projectile)=> {
    projectile.update()

    //calculate player distance
    let dist = Math.hypot(player.x - projectile.x, player.y - projectile.y)
    if(
      dist < player.radius + projectile.radius &&
      !player.invulnerable
    ) {
      player.damage()
    }

  })
  //debug stopped running all code for enemies, as they are not being used currently
  // enemies.forEach((enemy, indexEnemy) => {
  //   enemy.update();

  //   //automatic cleanup of enemies with radius <=1
  //   if(enemy.radius <= 1) enemies.splice(indexEnemy,1);

  //   //automatic cleanup of enemies which are very small and were burned by an explosion
  //   if(enemy.exploded == true && enemy.radius < minRadToBurn) {
  //     enemy.dead = true;
  //     gsap.to(enemy,{radius: 1, duration: enemy.radius/8 , onComplete: () => {
  //       enemies.forEach((en, ind) => {
  //         if(en.dead == true) enemies.splice(ind,1)
  //     })}})
  //   }

  //   // avoid running any more code on dead enemies, they will be removed automatically
  //   if(enemy.dead == true) return;
  //   let distance = Math.hypot(player.x - enemy.x,player.y - enemy.y)
    
  //   // when player is touched by an enemy
  //   if(distance - player.radius - enemy.radius < 0 && enemy.dead == false) {
  //     if(player.invulnerable == false) {

  //       endGame();
  //     }
  //   }
  //   // remove enemy after it travels too far outside canvas bounds
  //   if( (enemy.x > (canvas.width + enemyRadius*2 ) || enemy.x < (0 - enemyRadius*2)) || (enemy.y > (canvas.height + enemyRadius*2) || enemy.y < (0 - enemyRadius*2)) ) {
  //     enemies.splice(indexEnemy, 1);
  //   }
    
  //   // projectile logic 
  //   projectiles.forEach((projectile, indexProj) => {


  //     let distance = Math.hypot(projectile.x - enemy.x,projectile.y - enemy.y)
      
  //     // when projectile hits an enemy
  //     if(distance - enemy.radius - projectile.radius < -1) {
        
  //       if(Math.random()*9 > 5) {
  //         gainAmmo('regular')
  //         gainAmmo('regular')
  //         displayPopup('plus-ammo', enemy.x, enemy.y)
  //       }

  //       // calculate enemy slowdown
  //       enemy.velInhibition *= projectile.power

  //       // spawn particles for regular
  //       if (projectile.type == 'regular') {
  //         for (let i = 0; i < enemy.radius/3; i++) {
  //           particles.push(new Particle(
  //             (projectile.x + (Math.random()*20 - 10)), 
  //             (projectile.y + (Math.random()*20 - 10)), 
  //             (Math.random()*particleVariance/2 + (particleRadius - particleVariance/2)), 
  //             enemy.color, 
  //             { 
  //               x: Math.random()*10 - 5 , 
  //               y: Math.random()*10 - 5 ,
  //             },
  //             enemy,
  //             'particle'
  //             ))
  //         }
  //       }
          
  //       // spawn particles for shrapnel
  //       if (projectile.type == 'shrapnel') {

  //         for (let i = 0; i < enemy.radius/6; i++) {
  //           particles.push(new Particle(
  //             (projectile.x + (Math.random()*20 - 10)), 
  //             (projectile.y + (Math.random()*20 - 10)), 
  //             (Math.random()*particleVariance/2 + (particleRadius - particleVariance/2)), 
  //             enemy.color, 
  //             { 
  //               x: Math.random()*10 - 5 , 
  //               y: Math.random()*10 - 5 ,
  //             },
  //             enemy,
  //         'particle'
  //         ))
  //       }

          
  //       for (let i = 0; i < enemy.radius/3; i++) {
  //         particles.push(new Particle(
  //           (projectile.x + (Math.random()*20 - 10)), 
  //           (projectile.y + (Math.random()*20 - 10)), 
  //           (Math.random()*particleVariance/2 + (particleRadius - particleVariance/2)), 
  //           enemy.color, 
  //         { 
  //           x: (Math.random()*2 - 1) + projectile.velocity.x, 
  //           y: (Math.random()*2 - 1) + projectile.velocity.y,
  //         },
  //         enemy,
  //         'shrapnel'
  //         ))
  //       }
  //     }
      
  //     // spawn particles for cannonball
  //     if (projectile.type == 'cannonball') {
  //       for (let i = 0; i < enemy.radius/8; i++) {
  //         particles.push(new Particle(
  //           (projectile.x + (Math.random()*20 - 10)), 
  //           (projectile.y + (Math.random()*20 - 10)), 
  //           (Math.random()*particleVariance/2 + (particleRadius - particleVariance/2)), 
  //           enemy.color, 
  //           { 
  //             x: Math.random()*8 - 4 , 
  //             y: Math.random()*8 - 4 ,
  //           },
  //           enemy,
  //           'particle'
  //           ))
  //       }
  //     }

  //     // spawn particles for explosive
  //     if (projectile.type == 'explosive') {
  //       for (let i = 0; i < enemy.radius/5; i++) {
  //         particles.push(new Particle(
  //           (projectile.x + (Math.random()*20 - 10)), 
  //           (projectile.y + (Math.random()*20 - 10)), 
  //           (Math.random()*particleVariance/2 + (particleRadius - particleVariance/2)), 
  //           explosionColor, 
  //           { 
  //             x: Math.random()*6 - 3 , 
  //             y: Math.random()*6 - 3 ,
  //           },
  //           enemy,
  //           'explosive'
  //           ))
  //       }
  //     }
      
  //     // spawn particles for machine
  //     if (projectile.type == 'machine') {
  //       for (let i = 0; i < enemy.radius/8; i++) {
  //         particles.push(new Particle(
  //           (projectile.x + (Math.random()*20 - 10)), 
  //           (projectile.y + (Math.random()*20 - 10)), 
  //           (Math.random()*particleVariance/2 + (particleRadius - particleVariance/2)), 
  //           enemy.color, 
  //           { 
  //             x: Math.random()*8 - 4 , 
  //             y: Math.random()*8 - 4 ,
  //           },
  //           enemy,
  //           'particle'
  //           ))
  //       }
  //     }
        

  //     // shrink enemy on hit by regular
  //     if (enemy.radius > minRadToKill && projectile.type == 'regular') {
  //       gsap.to(enemy, {radius: enemy.radius - projectile.damage, duration: 0.3})
  //       setTimeout(()=> {
  //         projectiles.splice(indexProj, 1);
  //       },0)
  //       updateScore('shrink-enemy')
  //     } 

  //     // hit by cannonball
  //     if (projectile.type == 'cannonball') {
  //       gsap.to(enemy, {radius: 1, duration: 0.3})
  //       projectile.life--
  //       projectile.velocity.x *= 1 - (enemy.radius/200 + 0.05)
  //       projectile.velocity.y *= 1 - (enemy.radius/200 + 0.05)
  //       if(projectile.life < 1) {
  //         setTimeout(()=> {
  //           projectiles.splice(indexProj, 1);
  //         },0)
  //       }
  //       enemy.dead = true;
  //       // console.log(enemy)
  //       updateScore('kill-enemy')
  //     } 
  //     // hit by shrapnel
  //     if(projectile.type == 'shrapnel') {
  //       setTimeout(()=> {
  //         enemies.splice(indexEnemy, 1);
  //         projectiles.splice(indexProj, 1);
  //       },0)
  //       updateScore('kill-enemy')
  //       enemy.dead = true;
  //     }

  //     // hit by explosive
  //     if(projectile.type == 'explosive') {
  //       setTimeout(()=> {
  //         projectiles.splice(indexProj, 1);
  //       },0)
  //       explosions.push(new Explosion(projectile.x,projectile.y,explosionRadius, explosionColor))
  //       //issue //need a way to calculate score here
  //       // enemy.dead = true;
  //       gsap.to(enemy,{color: explosionColor, duration: 1})
  //     }
  //     // hit by machine
  //     if(projectile.type == 'machine') {
  //       gsap.to(enemy, {radius: enemy.radius - projectile.damage, duration: 0.3})
  //       setTimeout(()=> {
  //         projectiles.splice(indexProj, 1);
  //       },0)
  //       updateScore('shrink-enemy')
        

        
  //     }
      
  //     // kill enemy if it's less than the minimum radius required to kill an enemy
  //     if(enemy.radius < minRadToKill) {
  //       //mark this enemy as dead to prevent accidentally deleting a different enemy while gsap.to() finishes
  //       enemy.dead = true;
  //       gsap.to(enemy,{radius: 1, onComplete: () => {
  //         enemies.forEach((en, ind) => {
  //           if(en.dead == true) enemies.splice(ind,1)
  //       })}})
  //       setTimeout(()=> {
  //         // enemies.splice(indexEnemy, 1);
  //         projectiles.splice(indexProj, 1);
  //       },0)
  //       updateScore('kill-enemy')
  //     }
  //     // kill all enemies => enemy.dead == true
  //     if(enemy.dead == true) {
  //       gsap.to(enemy,{radius: 1, duration: enemy.radius/30 , onComplete: () => {
  //         enemies.forEach((en, ind) => {
  //           if(en.dead == true) enemies.splice(ind,1)
  //       })}})
  //     }
  //     }
  //   })
    
  //   particles.forEach((particle, particleIndex) => {

  //     // draws a right triangle and calculates the distance between two points
  //     const distance = Math.hypot(particle.x - enemy.x,particle.y - enemy.y) 
        
  //     // when particle hits an enemy
  //     if( (distance - enemy.radius - particle.radius < (Math.max(particle.velocity.x,particleSpeed) + enemySpeed)) && 
  //         (distance - enemy.radius - particle.radius < (Math.max(particle.velocity.y,particleSpeed) + enemySpeed)) && 
  //         particle.origin !== enemy && 
  //         particle.bounced == false
  //       ) {
  //       if(particle.type == 'regular') {

  //         // if a particle by any accident gets inside an enemy, destroy the particle
  //         if((distance - enemy.radius - particle.radius < 0)) {
  //           particles.splice(particleIndex,1)
  //           return;
  //         }
  //         particle.bounced = true;
  //         particle.bounces--

  //         //if the particle has run out of bounces, destroy the particle
  //         if(particle.bounces <= 0) {
  //           particles.splice(particleIndex,1)
  //           return
  //         }
  //         particle.origin = enemy;
  //         particle.velocity.x *= 0.8
  //         particle.velocity.y *= 0.8
  //         particle.velocity.x *= -1
  //         particle.velocity.y *= -1
  //         setTimeout(()=>{particle.bounced = false},150)
  //       }
  //       if(particle.type == 'shrapnel') {

          
  //         //decrease the enemy radius upon hit by shrapnel particle //issue, here it marks the enemy for destruction when he is hit by ANY SINGLE shrapnel particle, or maybe it's fine
  //         enemy.destroy = true;
  //         enemy.velInhibition *= particle.power
  //         gsap.to(enemy, {radius: enemy.radius - 5, duration: 0.1, onComplete:()=> {
  //           if(enemy.radius <= 10) {
  //             gsap.to(enemy, {radius: 1, duration: 0.1, onComplete:()=> {
  //               enemies.forEach((enemyy, indexx)=>{
  //                 if(
  //                   enemyy.destroy == true && 
  //                   enemyy.radius < 5
  //                   ) {
  //                   enemies.splice(indexx,1)
  //                   // console.log(enemyy)
  //                 }
  //               })
  //             }})
  //           }
  //         }})
  //       }
          
  //         particles.splice(particleIndex,1)
  //     }
  //   })
  // })

  // update and delete particles with alpha <= 0
  particles.forEach((particle, index) => {
    particle.update();
    if(particle.alpha <= 0) {
      particles.splice(index,1)
    }
  })

  //spawning mechanic
  if(enemies.length >= 12) {
    reachedEnemyCap = true;
  } else if(enemies.length <= 2) {
    reachedEnemyCap = false;

  }


  //explosions mechanic
  explosions.forEach((explosion, explIndex)=>{
    explosion.update()
    if(explosion.life <= 0) {
      setTimeout(()=>{
        explosions.splice(explIndex,1)
      },0)
    }

    let playerDistance = Math.hypot(explosion.x - (player.x - player.radius),explosion.y - (player.y - player.radius))
    if(playerDistance <= explosion.radius) {
      endGame()
    }
    enemies.forEach((enemy,enemyIndex) => {

      // check for enemies in radius of the explosion
      let distance = Math.hypot(explosion.x - (enemy.x - enemy.radius),explosion.y - (enemy.y - enemy.radius))
      let damageFalloff = distance/(explosion.radius/3) // min = ~0 max = 3
      // if enemy is in the radius
      if(distance <= explosion.radius) {
        //add 1 particle each frame
        particles.push(new Particle(
          (enemy.x + (Math.random()*20 - 10)), 
          (enemy.y + (Math.random()*20 - 10)), 
          (Math.random()*particleVariance/2 + (particleRadius - particleVariance/2)), 
          explosionColor, 
          { 
            x: Math.random()*4 - 2 , 
            y: Math.random()*4 - 2 ,
          },
          enemy,
          'particle'
          ))
        enemy.exploded = true;
        enemy.velInhibition *= 1.02
        gsap.to(enemy, {radius: enemy.radius - (burnDamage - damageFalloff), duration: 0.12}) // radius reduction 5-2/second
        gsap.to(enemy, {color: explosionColor, duration: 0.4})
        
      }
    })
  })
  //asteroid mechanic

  asteroids.forEach((asteroid, astIndex) => {

    if(
      asteroid.x > cw + asteroid.spriteDim.x || 
      asteroid.x < 0 - asteroid.spriteDim.x  || 
      asteroid.y > ch + +asteroid.spriteDim.y  || 
      asteroid.y < 0 - asteroid.spriteDim.y 
    ) {
      setTimeout(()=>{
        asteroids.splice(astIndex,1)
      },0)
    }
    // check if player touching asteroid
    let distance = Math.hypot(player.x - asteroid.x,player.y - asteroid.y)
    
    // when player touches asteroid
    if(distance - player.radius - asteroid.spriteDim.x/2 < 0) { //issue player radius is still being used to detect collision

      

      // combine velocities
      if(!dodgeDir) {
        
        var velTotal = {
          x: (player.velocity.x + asteroid.velocity.x) - (player.velocity.x + asteroid.velocity.x)*asteroid.velAbsorb, 
          y: (player.velocity.y + asteroid.velocity.y) - (player.velocity.y + asteroid.velocity.y)*asteroid.velAbsorb,
        }

        if(player.invulnerable == false && (velTotal.x * velTotal.y) < player.impactResistance) player.damage()

        // calculate the balance which will determine how much
        var playerBalance = asteroid.weight / player.weight //issue ,this is a super janky way to write this, it could be just a few lines
        var asteroidBalance =  player.weight / asteroid.weight 
        
        var min = Math.min(playerBalance,asteroidBalance)
        
        playerBalance = 1 - min
        asteroidBalance = min
        console.log(playerBalance + ' ' + asteroidBalance)
        player.velocity.x = -velTotal.x * playerBalance
        // - velTotal.x/balance
        player.velocity.y = -velTotal.y * playerBalance
        // - velTotal.y/balance
        
        asteroid.velocity.x = velTotal.x * asteroidBalance
        // + velTotal.x/balance
        asteroid.velocity.y = velTotal.y * asteroidBalance
        // + velTotal.y/balance
        
        // console.log(`Asteroid velocity x:
        // ${asteroid.velocity.x}
        // y:
        // ${asteroid.velocity.y}
        
        
        // `)
      }
    }
    // check for collision with projectiles
    projectiles.forEach((projectile)=> {
      let dist = Math.hypot(projectile.x - asteroid.x, projectile.y - asteroid.y) 
      if(
        dist < asteroid.spriteDim.x/2 || 
        dist < asteroid.spriteDim.y/2
      ) {
        asteroid.velocity.x += projectile.velocity.x/12 * projectile.power
        asteroid.velocity.y += projectile.velocity.y/12 * projectile.power
        projectile.dead = true

        // setTimeout(()=>{
        //   projectiles.forEach((p,ind)=> {
        //     if(p.dead == true) 
        //     projectiles.splice(ind,1)
        //     console.log('removed projectile upon hitting asteroid')
        //   })}
        // ,0)
      }
    })
    asteroid.update()
  })


  //debris mechanic
  
  debriss.forEach((debris, debIndex) => {
    //remove debris if outside of map bounds
    if(
      debris.x > cw + debris.spriteDim.x || 
      debris.x < 0 - debris.spriteDim.x  || 
      debris.y > ch + +debris.spriteDim.y  || 
      debris.y < 0 - debris.spriteDim.y 
    ) {
      setTimeout(()=>{
        debriss.splice(debIndex,1)
      },0)
    }

    let distance = Math.hypot(player.x - debris.x,player.y - debris.y)
    
    // when player touches debris
    if(distance - player.radius - debris.spriteDim.x/2 < 0) { //issue player radius is still being used to detect collision

      
      // combine velocities
      if(!dodgeDir) {
        var velTotal = {
          x: player.velocity.x + debris.velocity.x, 
          y: player.velocity.y + debris.velocity.y,
        }
        if(
          player.invulnerable == false && 
          (Math.abs(velTotal.x) + Math.abs(velTotal.y)) > player.impactResistance) 
        { 
          player.damage()
        }
        console.log(Math.abs(velTotal.x) + Math.abs(velTotal.y))
        
        console.log('Velocity total - x: '+ velTotal.x + ' ' + 'y: '+ velTotal.y)

        player.velocity.x = velTotal.x/2 - velTotal.x/25 
        player.velocity.y = velTotal.y/2 - velTotal.y/25
        debris.velocity.x = velTotal.x/2 + velTotal.x/25
        debris.velocity.y = velTotal.y/2 + velTotal.y/25

        // basically, im giving more energy to the projectile from this collision, this implies that it is lighter than the ship
        // by this logic i can calculate impacts differently based on the colliding objects weight or density
      }
    }

    // check for collision with projectiles
    projectiles.forEach((projectile)=> {
      let dist = Math.hypot(projectile.x - debris.x, projectile.y - debris.y) 
      if(
        dist < debris.spriteDim.x/2 || 
        dist < debris.spriteDim.y/2
      ) {
        debris.velocity.x += projectile.velocity.x/12 * projectile.power
        debris.velocity.y += projectile.velocity.y/12 * projectile.power
        projectile.dead = true

        // setTimeout(()=>{
        //   projectiles.forEach((p,ind)=> {
        //     if(p.dead == true) 
        //     projectiles.splice(ind,1)
        //     console.log('removed projectile upon hitting debris')
        //   })}
        // ,0)
      }
    })
    debris.update()
  })
  



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
  deadShipDialogs.forEach(dialog => {
    dialog.update()
  })
  // bullet fire anim
  if(fired) {
    drawFireAnim();
    // clearTimeout(firedTimer);
    firedTimer = setTimeout(()=>{
      fired = false
    },100)
  }



  // cursor, draw this last
  // drawCursor();
  
  // optimizations
  if(particles.length > 60) {
    setTimeout(()=>{
      particles.splice(0,2)
    },0)
  }

  // projectile clean-up //important
  projectiles.forEach((p,ind)=> {
    if(p.dead == true) {
      projectiles.splice(ind,1)
      // console.log('Automatic cleanup removed 1 projectile marked as dead.')
    }
  })
  projectileGhosts.forEach((p,ind)=> {
    if(p.dead == true) {
      projectileGhosts.splice(ind,1)
      // console.log('Automatic cleanup removed 1 projectile marked as dead.')
    }
  })
  
  drawId = requestAnimationFrame(draw)
  if(gameover) cancelAnimationFrame(drawId);
}
// ↑↑↑↑↑↑ end of draw()


function drawFireAnim() {
  ctx.beginPath()
  ctx.arc(player.x,player.y,10,0, pi*2, false)
  // ctx.strokeStyle = `hsla(35,100%,60%,${0 + 0.1 * firedFadeout})`
  ctx.strokeStyle = `hsla(221,100%,80%,${0 + 0.1 * firedFadeout})`
  ctx.lineWidth = 5
  ctx.stroke()
  ctx.closePath()
  if(firedFadeout > 0) firedFadeout--
}
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
function getProjectileColor() {
  if (currentAmmoType == 'regular') return 'hsl(221, 100%, 80%)'
  if (currentAmmoType == 'shrapnel') return 'hsl(221, 100%, 80%)'
  if (currentAmmoType == 'cannonball') return 'hsl(221, 100%, 80%)'
  if (currentAmmoType == 'explosive') return 'orange'
  if (currentAmmoType == 'machine') return 'hsl(221, 100%, 80%)'
}

function calcHypotenuse(a, b) {
  return (Math.sqrt((a * a) + (b * b)));
}

function start() {
  drawBackground()
  closeModal();
  dialogContainer.style.display = ''
  dialogs.push(new Dialog(`
  You have found yourself floating in an empty part of cosmos. 

  Your reactor is running low on uranium and your food rations have drastically diminished since you last docked at a refueling station.

  `))
  
}
function endGame() {
  gameover = true;
  clearInterval(machineTimer);
  openModal('gameover')
}

function freeze() {
  cancelAnimationFrame(drawId)
  clearInterval(machineTimer);
}

//keydown
document.addEventListener('keydown', processKeydown, false)

function processKeydown(e) {
  if(e.code == 'KeyR' ) {
    start();
  }
  if(e.code == 'KeyE' ) {
    // endGame() 
    freeze()
    //basically pause but hardcore //idea this game needs a pause button
  }
  if(e.code == 'KeyF' ) {
    detonate()
  }
  if(e.code == 'KeyM' ) {
    toggleMap()
  }
  if(e.code == 'ShiftLeft') {
    pressedShift = true
    // console.log('[Shift] down')
    // prepareDodge();
  }
  // if(e.code == 'ControlLeft') {
  //   player.dash('left')
  // }
  if(e.code == 'Space') {
    player.dash()
  }
  if(e.code == 'KeyA') {
    turningCCW = true
  }
  if(e.code == 'KeyD') {
    turningCW = true
  }
  if(e.code == 'KeyW') {
    movingForward = true
  }
  if(e.code == 'KeyS') {
    movingBackward = true
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

  // if(e.code == 'KeyA') {
  //   player.movingLeft = false
  //   pressedLeft = false
  //   // player.decelerate()
  // }
  // if(e.code == 'KeyD') {
  //   player.movingRight = false
  //   pressedRight = false
  //   // player.decelerate()
  // }
  // if(e.code == 'KeyW') {
  //   player.movingUp = false
  //   pressedUp = false
  //   // player.decelerate()
  // }
  // if(e.code == 'KeyS') {
  //   player.movingDown = false
  //   pressedDown = false
  //   // player.decelerate()
  // }
  if(e.code == 'KeyA') {
    turningCCW = false
  }
  if(e.code == 'KeyD') {
    turningCW = false
  }
  if(e.code == 'KeyW') {
    movingForward = false
  }
  if(e.code == 'KeyS') {
    movingBackward = false
  }
}

//player movement

// function setDodgeOrigin() {
//   dodgeOrigin = {
//     x: player.x,
//     y: player.y,
//   }
// }


function dodgeFinish() {
  dodgeDir = null;
  player.invulnerable = false;
  // setDodgeOrigin();
  windup = 0;
}

function displayDodgePositions() {
  dodgePosVisible = true;
  if(windup < 48) windup += 8
  ctx.save()
  ctx.globalAlpha = windup / 100
  if(dodgeDir) ctx.globalAlpha *= 0.7
  ctx.strokeStyle = player.color
  ctx.lineWidth = 2.5
  ctx.fillStyle = 'white';
  //left
  ctx.beginPath();
  ctx.arc(
    player.x - player.dodgeDistance.x,
    player.y,
    player.radius,
    0,
    pi * 2, 
    false
    )
  ctx.stroke();
  if(dodgePreview == 'left') ctx.fill()
  ctx.closePath();

  // right
  ctx.beginPath();
  ctx.arc(
    player.x + player.dodgeDistance.x,
    player.y,
    player.radius,
    0,
    pi * 2, 
    false
    )
  ctx.stroke();
  if(dodgePreview == 'right') ctx.fill()
  ctx.closePath();

  // up
  ctx.beginPath();
  ctx.arc(
    player.x,
    player.y - player.dodgeDistance.y,
    player.radius,
    0,
    pi * 2, 
    false
    )
    ctx.stroke();
    if(dodgePreview == 'up') ctx.fill()
    ctx.closePath();

  //down
  ctx.beginPath();
  ctx.arc(
    player.x,
    player.y + player.dodgeDistance.y,
    player.radius,
    0,
    pi * 2, 
    false
    )
  ctx.stroke();
  if(dodgePreview == 'down') ctx.fill()
  ctx.closePath();
    
  // upLeft
  ctx.beginPath();
  ctx.arc(
    player.x - (player.dodgeDistance.x / 1.414),
    player.y - (player.dodgeDistance.y / 1.414),
    player.radius,
    0,
    pi * 2, 
    false
    )
  ctx.stroke();
  if(dodgePreview == 'upLeft') ctx.fill()
  ctx.closePath();

  // downLeft
  ctx.beginPath();
  ctx.arc(
    player.x - (player.dodgeDistance.x / 1.414),
    player.y + (player.dodgeDistance.y / 1.414),
    player.radius,
    0,
    pi * 2, 
    false
    )
  ctx.stroke();
  if(dodgePreview == 'downLeft') ctx.fill()
  ctx.closePath();

  // upRight
  ctx.beginPath();
  ctx.arc(
    player.x + (player.dodgeDistance.x / 1.414),
    player.y - (player.dodgeDistance.y / 1.414),
    player.radius,
    0,
    pi * 2, 
    false
    )
  ctx.stroke();
  if(dodgePreview == 'upRight') ctx.fill()
  ctx.closePath();

  // downRight
  ctx.beginPath();
  ctx.arc(
    player.x + (player.dodgeDistance.x / 1.414),
    player.y + (player.dodgeDistance.y / 1.414),
    player.radius,
    0,
    pi * 2, 
    false
    )
  ctx.stroke();
  if(dodgePreview == 'downRight') ctx.fill()
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
  calcAmmoTotal()
  updateAmmoVisual();
}
function calcAmmoTotal() {
  ammoTotal = ammoRegular + ammoShrapnel + ammoCannonball + ammoExplosive + ammoMachine
}

//UI functionality

function updateHealthBar() {

  for (let i = 0; i < healthSegments.length; i++) {
    healthSegments[i].classList.add('empty')
  }
  for (let i = 0; i < player.armor; i++) {
    healthSegments[i].classList.remove('empty')
  }
}
function updateRoomDebugVisual() {
  document.querySelector('#room-top').innerText = 'X: ' + currRoom.x + ' Y: ' + currRoom.y
}
function updateArrows() {
  if(currRoom.left == 'portal') {
    arrows[0].style.display = '' 
  } else {
    arrows[0].style.display = 'none' 
  }
  if(currRoom.right == 'portal') {
    arrows[1].style.display = '' 
  } else {
    arrows[1].style.display = 'none' 
  }
  if(currRoom.top == 'portal') {
    arrows[2].style.display = '' 
  } else {
    arrows[2].style.display = 'none' 
  }
  if(currRoom.bottom == 'portal') {
    arrows[3].style.display = '' 
  } else {
    arrows[3].style.display = 'none' 
  }
}
function toggleMap() {
  mapContainer.classList.toggle('hidden')
}
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
  dispAmmoMachine.innerHTML = ammoMachine;
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
      wavesDialog.innerHTML = waveNumber - 1;
      break
    }
  }
}

function closeModal() {
  modal.style.display = 'none'
}

function displayPopup(arg, x, y) {
  if(arg == 'plus-ammo') {
    var info = new InfoPopup(x, y, '+2 AMMO')
  }
}

//neon effect experiment

// var drawRectangle = function(x, y, w, h, border){
//   ctx.beginPath();
//   ctx.moveTo(x+border, y);
//   ctx.lineTo(x+w-border, y);
//   ctx.quadraticCurveTo(x+w-border, y, x+w, y+border);
//   ctx.lineTo(x+w, y+h-border);
//   ctx.quadraticCurveTo(x+w, y+h-border, x+w-border, y+h);
//   ctx.lineTo(x+border, y+h);
//   ctx.quadraticCurveTo(x+border, y+h, x, y+h-border);
//   ctx.lineTo(x, y+border);
//   ctx.quadraticCurveTo(x, y+border, x+border, y);
//   ctx.closePath();
//   ctx.stroke();
// }
// var neonRect = function(x,y,w,h,r,g,b){
// ctx.shadowColor = "rgb("+r+","+g+","+b+")";
// ctx.shadowBlur = 10;
// ctx.strokeStyle= "rgba("+r+","+g+","+b+",0.2)";
// ctx.lineWidth=7.5;
// drawRectangle(x,y,w,h,1.5);
// };

// function addGlow(x, y){
//   ctx.globalCompositeOperation = "lighter";
//   neonRect(25+x,25+y,50,50,243,243,21);
//   neonRect(225-x,25+y,50,50,193,253,51);
//   neonRect(25+x,225-y,50,50,255,153,51);
//   neonRect(225-x,225-y,50,50,252,90,184);
//   neonRect(125,125,50,50,13,213,252); 
//   ctx.globalCompositeOperation = "normal";
// }

function detonate() {
  projectiles.forEach((projectile,index)=> {
    if(projectile.type == 'explosive') {
      
      //  setTimeout(()=> { //issue // the timeout is kinda janking things up, it doesn't remove everything but pushes 1 explosion per projectile anyways
      explosions.push(new Explosion(projectile.x,projectile.y,explosionRadius, explosionColor))
      projectiles.splice(index, 1);
      // },0)
    }
  })
}


class Room {
  constructor(x,y,index,type,left,right,top,bottom) {
    this.x = x
    this.y = y
    this.index = index
    this.type = type

    this.left = left
    this.right = right
    this.top = top
    this.bottom = bottom

    this.cleared = false;
    // essentially if a side == portal, you can travel that direction, direction determines the x and y of the next room, left means x = x -1, y = y etc....

    // this.visual = document.createElement
    this.contents = []
    
  }
}

class Sector {
  constructor(number) {
    this.number = number
  }
}


let sectorIndex = 1
let currSector = null
let map = {
  x: 8,
  y: 8,
}
let layoutSuccess = null;
let rooms = []
let currRoom = null
let roomIndex = 0 // only used for generating so far

function generateLayout() {
  var attempts = 0;
  // generate a random location of the entrance
  var x = Math.round(Math.random() * map.x -0.5)
  var y = Math.round(Math.random() * map.y -0.5)
  rooms.push(new Room(x,y,roomIndex,'entrance', 'wall', 'wall', 'wall', 'wall'))
  
  // add additional 6-8 rooms, making the main branch 6-9 rooms total
  // this ia  fucking mess but it moreorless doesn't matter, it's just a matter of keeping indexing consistent ↓↓↓↓↓
  
  var roomNum = Math.abs(Math.round(Math.random() * 4 - 0.5)) + 6 //issue //i have no idea how the room index works anymore
  console.log('Total room number: ' + roomNum)
  if(roomNum >= 10) roomNum = 9 // hard set the roomnum if it actually overflows
  while(roomIndex < roomNum - 1) {
    attempts++
    if(attempts > 50) {
      setTimeout(()=>{generateSector()},10)
      break
    }

    var dir = Math.round(Math.random() * 4 - 0.5)
    var prevRoom = rooms[roomIndex]
    var thisRoom = {
      left: 'wall',
      right: 'wall',
      top: 'wall',
      bottom: 'wall',
    }
    var roomX;
    var roomY;

    if(dir === 0) { // left
      roomX = prevRoom.x - 1
      roomY = prevRoom.y
    }
    else
    if(dir === 1) { // right
      roomX = prevRoom.x + 1
      roomY = prevRoom.y
    }
    else
    if(dir === 2) { // up
      roomX = prevRoom.x
      roomY = prevRoom.y - 1
    }
    else
    if(dir === 3) { // down
      roomX = prevRoom.x
      roomY = prevRoom.y + 1
    }

    if(roomX < 0 || roomY < 0 || roomX > (map.x - 1) || roomY > (map.y - 1)) {
      // console.log('Room outside of map bounds.') //debug
      continue
    }

    if(rooms.find(room => room.x == roomX && room.y == roomY)) {
      // console.log('This room position is already occupied.') //debug
      continue
    }

    if(dir === 0) { // left
      prevRoom.left = 'portal'
      thisRoom.right = 'portal'
    }
    else
    if(dir === 1) { // right
      prevRoom.right = 'portal'
      thisRoom.left = 'portal'
    }
    else
    if(dir === 2) { // up
      prevRoom.top = 'portal'
      thisRoom.bottom = 'portal'
    }
    else
    if(dir === 3) { // down
      prevRoom.bottom = 'portal'
      thisRoom.top = 'portal'
    }
    roomIndex++
    rooms.push(new Room(roomX, roomY, roomIndex, 'normal',thisRoom.left,thisRoom.right,thisRoom.top,thisRoom.bottom))
    // console.log(roomIndex)
  }

  currRoom = rooms[0]
  var sideBranches = Math.abs(Math.round(Math.random() * 4 - 0.5)) + 6 //unfinished
  layoutSuccess = true
}

function generateMap() {
  // make the empty rooms
  for (let i = 0; i < map.x * map.y; i++) {
    var room = document.createElement("div");
    room.classList.add("room");
    sectorMap.append(room);
  }
  // add additional rooms inside them?????? //issue, this is stupid, it all has to be connected with rooms[], the class Room needs to contain the visual, and the visual needs to contain the populated rooms
  // it's simply dumb to reference and update multiple unconnected arrays and objects and variables
  for (let i = 0; i < rooms.length; i++) {

    var room = document.createElement('div') 
    var index = (rooms[i].x + 0) + (rooms[i].y + 0) *8

    room.classList.add('test-room')
    room.dataset.x = rooms[i].x
    room.dataset.y = rooms[i].y
    room.onclick = teleport

    sectorMap.childNodes[index].append(room)
  }
  
  
}

let roomCont = [
  {
    key: 'asteroids',
    count: 3,
  },
  {
    key: 'enemy-ship',
    count: 1,
  },
  {
    key: 'debris',
    count: 3,
  },
  {
    key: 'debris',
    count: 3,
  },
  {
    key: 'empty',
  },


]

function generateRooms() {

  rooms.forEach((room,index)=> {
    if(room.type == 'entrance') return
    var rand = Math.round(Math.random()*roomCont.length)
    if(rand >= roomCont.length) rand = roomCont.length - 1
    console.log(rand)
    room.contents.push(roomCont[rand])
  })

}

function initSectorVars() {
  rooms = []
  currRoom = null
  roomIndex = 0
}

function clearMap() {
  sectorMap.innerHTML = '' //issue // this is bad code, this will break if i add anything to the sector map
}

//main generateSector
function generateSector() {
  initSectorVars()
  clearMap()
  generateLayout()
  if(!layoutSuccess) {
    layoutSuccess = null
    return
  }
  generateMap()
  generateRooms()
  updateRoomDebugVisual()
  updateArrows()
  updateMapVisual(currRoom)
}

function travel(x,y) {
  console.log('--traveled--')

  // clear canvas
  clearRoom()
  var destination = rooms.find(
    room => 
    room.x == currRoom.x + x && 
    room.y == currRoom.y + y
  )
  if(!destination) {
    console.log('There is no room over there.')
    return
  }

  currRoom = destination
  console.log('Traveled to room: ' + currRoom.x + ' ' + currRoom.y)
  console.log(currRoom)
  updateRoomDebugVisual()
  updateArrows()
  updateMapVisual(currRoom)
  loadRoom(currRoom)
}

function teleport() { //debug // this is msotly a debug feature, it probably won't make it into the game, i like the linear travel, this feels cheaty
  console.log('--teleported--')
  clearRoom()

  currRoom = rooms.find(room => room.x == this.dataset.x && room.y == this.dataset.y)
  console.log('Traveled to room: ' + currRoom.x + ' ' + currRoom.y)
  console.log(currRoom)
  updateRoomDebugVisual()
  updateArrows()
  updateMapVisual(currRoom)
  loadRoom(currRoom)
}

// let roomtypes = [
//   'asteroid',
//   'debris',
//   'enemy-ship',
//   'shipwreck',
//   'empty',
// ]

function loadRoom(room) {
  // this function loads all content that should be inside a room when you travel there
  
  // so far i will simply randomize it
  // var rand = Math.round(Math.random()*5)
  // var type = roomtypes[rand]
  // // var type = 'asteroid'

  // if(type == 'asteroid') {
  //   distributeAsteroids()
  // }
  // if(type == 'debris') {
  //   distributeDebris()
  // }
  // if(type == 'enemy-ship') {
  //   spawnEnemyShip()
  // }
  room.contents.forEach(object => {
    if(room.cleared) return

    if(object.key == 'asteroids') {
      distributeAsteroids(object.count)
    }
    if(object.key == 'debris') {
      distributeDebris(object.count)
    }
    if(object.key == 'enemy-ship') {
      spawnEnemyShip(object.count)
    }
    if(object.key == 'empty') {
      spawnEnemyShip(object.count)
    }
  })
  
}
function clearRoom() {
  projectiles = []
  particles = []
  enemies = []
  explosions = []
  enemyships = []
  enemyProjectiles = []
  asteroids = []
  debriss = []
  deadShipDialogs = []
}
function updateMapVisual(currRoom) {
  var index = (currRoom.x + 0) + (currRoom.y + 0) *8
  var rooms = Array.from(document.querySelectorAll('.room'))
  rooms.forEach(room => {
   if(room.firstChild) room.firstChild.style.borderColor = ''
  })
  rooms[index].firstChild.style.borderColor = 'orange'
}



//math functions
function ctg(x) { return 1 / Math.tan(x); }
function arcctg(x) { return pi / 2 - Math.atan(x); }




//optimization code 
function someMethodIThinkMightBeSlow() {
  const startTime = performance.now();

  // Do the normal stuff for this function

  const duration = performance.now() - startTime;
  console.log(`someMethodIThinkMightBeSlow took ${duration}ms`);
}

drawBackground() //debug, this might not be here later on

function spawnDebris(x,y,rotation,velocity,type) { //pointless this is kinda pointless function, not providing any extra functionality 
  debriss.push(new Debris(x,y,rotation,velocity,type))
}

function distributeDebris(total) {
  if(!total) var total = 3
  var num = 0
  while(num < total) {
    var x = centerX + (Math.random()*cw/2 - cw/2)
    var y = centerX + (Math.random()*ch/2 - ch/2)
    var rotation = Math.round(Math.random()*360)
    // var velocity = {
    //   x: 0,
    //   y: 0,
    // }
    var velocity = {
      x: Math.random()*2 - 1,
      y: Math.random()*2 - 1,
    }
    var types = ['basic','2','3']
    var rand = Math.round(Math.random()*3)
    // spawnDebris(x, y, rotation, velocity, 'basic')
    debriss.push(new Debris(x, y, rotation, velocity, types[rand]))
    num++
  }
  
}

function distributeAsteroids(total) {
  if(!total) var total = 3
  var num = 0
  while(num < total) {
    var x = 
    centerX + 
    (Math.random()*cw - cw/2)

    var y = 
    centerX + 
    (Math.random()*ch - ch/2)

    var rotation = Math.random()*360
    // var velocity = {
    //   x: 0,
    //   y: 0,
    // }
    var velocity = {
      x: Math.random()*2 - 1,
      y: Math.random()*2 - 1,
    }
    asteroids.push(new Asteroid(x, y, rotation, velocity, 'basic'))
    num++
  }
  
}