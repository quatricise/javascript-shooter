const canvas = document.querySelector('#canvas');
const ctx = canvas.getContext("2d");

const canvasBg = document.querySelector('#canvas-bg');
const ctxBg = canvasBg.getContext('2d');

const canvasFx = document.querySelector('#canvas-fx');
const ctxFx = canvasFx.getContext('2d');

const pi = Math.PI

canvas.width = canvasBg.width = canvasFx.width = window.innerWidth
canvas.height = canvasBg.height = canvasFx.height = window.innerHeight


let cw = canvas.width //idea replace the lenghty canvas.width with cw // this can be used for both canvases just fine
let ch = canvas.height

let centerX = canvas.width/2
let centerY = canvas.height/2
let mouseX = null
let mouseY = null

// camera and room size logic
let camera = {
  x: 0,
  y: 0,
  w: cw,
  h: ch,
}

let useCamera = false;


let bgrid = {
  cellsize: 256,
  gridnum: 16,
  x: 0,
  y: 0,
}
bgrid.x = -(bgrid.gridnum/2 * bgrid.cellsize)
bgrid.y = -(bgrid.gridnum/2 * bgrid.cellsize)
window.onresize = function() {
  canvas.width = canvasBg.width = canvasFx.width = window.innerWidth
  canvas.height = canvasBg.height = canvasFx.height = window.innerHeight
  centerX = canvas.width/2;
  centerY = canvas.height/2;
  cw = canvas.width 
  ch = canvas.height
  camera.w = cw
  camera.h = ch
}

let debug = false;
let paused = false;

let ghosts = []
let ghostNumber = 5
let ghostOpacity = 0.3

let menuCont = document.querySelector('#menu-container')
let menus = Array.from(document.querySelectorAll('.menu'))

let modal = document.querySelector('#modal-main')
let dialogGameover = document.querySelector('.dialog.game-over')
let dialogStart = document.querySelector('.dialog.game-start')
let dialogOverlay = document.querySelector('.overlay-dialog')

let scoreTop = document.querySelector('#score-top')
let scoreDialog = document.querySelector('#score-dialog')
let wavesDialog = document.querySelector('#waves-dialog')

// let mapContainer = document.querySelector('#map-container')
let mapIcon = document.querySelector('.map-icon')
let mapOpen = false;
let inventoryOpen = false;
let inventoryGUI = document.querySelector('#inventory')
let invIcon = document.querySelector('.inv-icon');

let shipSelectCont = document.querySelector('.ship-select-cont')

let shipOverviewGUI = document.querySelector('#ship-overview')

let arrowContainer = document.querySelector('#arrow-container')
let dialogContainer = document.querySelector('#dialog-container')

let sectorMapGUI = document.querySelector('#sector-map')

let arrows = Array.from(document.querySelectorAll('.arrow'))
arrows[0].dataset.direction = 'left'
arrows[0].dataset.x = 0
arrows[0].dataset.y = centerY
arrows[1].dataset.direction = 'right'
arrows[1].dataset.x = cw
arrows[1].dataset.y = centerY
arrows[2].dataset.direction = 'up'
arrows[2].dataset.x = centerX
arrows[2].dataset.y = 0
arrows[3].dataset.direction = 'down'
arrows[3].dataset.x = centerX
arrows[3].dataset.y = ch

function setOnclickForArrowsTo(condition) {
  if(condition) {
    arrows[0].setAttribute('onclick', 'travel("left")')
    arrows[1].setAttribute('onclick', 'travel("right")')
    arrows[2].setAttribute('onclick', 'travel("up")')
    arrows[3].setAttribute('onclick', 'travel("down")')
    arrows.forEach(arr => {
      arr.classList.add('debug')
    })
  }
  else {
    arrows[0].removeAttribute('onclick')
    arrows[1].removeAttribute('onclick')
    arrows[2].removeAttribute('onclick')
    arrows[3].removeAttribute('onclick')
  }
}

let dispAmmoRegular = document.querySelector('#ammo-regular')
let dispAmmoShrapnel = document.querySelector('#ammo-shrapnel')
let dispAmmoCannon = document.querySelector('#ammo-cannon')
let dispAmmoExplosive = document.querySelector('#ammo-explosive')
let dispAmmoMachine = document.querySelector('#ammo-machine')

let ammoSpriteRegular = document.querySelector('.ammo.regular')
let ammoSpriteShrapnel = document.querySelector('.ammo.shrapnel')
let ammoSpriteCannon = document.querySelector('.ammo.cannon')
let ammoSpriteExplosive = document.querySelector('.ammo.explosive')
let ammoSpriteMachine = document.querySelector('.ammo.machine')

let healthbar = document.querySelector('.healthbar')
// let healthSegments = Array.from(document.querySelectorAll('.armor-segment'))
let healthSegments = []


let overlayMain = document.querySelector('.overlay-main')
let overlaysInfo = [];

let dialogsVisible = []
let deadShipDialogs = []

let drawId = null;

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
let ammoCannon = 0
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

let dodgeDistance = 300
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
let laserbeams = []
let enemies = []
let enemyProjectiles = []
let particles = []
let explosions = []
let enemyships = []
let asteroids = []
let debriss = []

let dockingStations = []

let objects_all = []
let objects_collidable = []
// arrays for UI and overlay objects
let hints = []


const projRadius = 5
const projectileSpeed = 9
let shrapnelRadiusMult = 1.5
let cannonRadiusMult = 4
let explosiveRadiusMult = 1.6
let enemyRadius = 40
let enemySpeed = 1
let particleRadius = 3
let particleVariance = 3
let particleSpeed = 4
let friction = 0.999 // global friction variable, only used for particles, which aren't even used lmao, this is useless
let machineFireRate = 12
let explosionColor = 'orange'
let explosionRadius = 220

let debrisTypes = ['basic','2','3']

let items = {
  laser_mount: {
    title: 'Laser Mount',
    description: 'Cheap laser mount.'
  },
  universal_mount: {
    title: 'Universal Weapon Mount',
    description: 
    `The coveted universal weapon mount is one of the most precious pieces of technology in the galaxy. 
    Can be used to attach any weapon to any ship, many potential drawbacks may result from using this equipment unwisely.`
  },
  
}

let weapons = {
  debug: { //probably just a debug gun
    type: 'ammo|projectile',
    damage: 1,
    ammo: 50,
  },
  missile_m1: {
    type: 'ammo|projectile',
    damage: 1,
    ammo: 50,
    explosive: true,
    explosionRadius: 120
  },
  front_laser_double: {
    type: 'energy|hitscan',
    damage: 1,
    firerate: 200, //in ms
    //in ms  -- this is the window for clicks to prepareFire() for the weapon, if you click 100ms or less in advance, it still fires 
    //idea could be a global var ↓
    fireWindow: 100, 
    energyCost: 2,
    lasers: 2,
    rechargeTimeInit: 30,
    rechargeTime: 30,
    chargesMax: 3,
    charges: 1,
    rechargeInit() {
      this.rechargeTime = this.rechargeTimeInit
      if(debug) console.log('Laser recharging initiated...')
    }
  },
  side_auto_gat_m1: {
    type: 'ammo|projectile',
    damage: 1,
    energyCost: 0,
    lasers: 2,
  },
}

let ships = {
  moth: {
    name: 'M0-TH',
    visual: {
      base: 'assets/moth_default.png',
      turret: 'assets/moth_default_turret.png',
      dashInd: 'assets/moth_default_dash_indicator.png',
      laserInd: null,
      dimX: 128,
      dimY: 128,
    },
    agility: 2.5,
    armor: 8,
    maxDodge: 550,
    maxVel: 12,
    acceleration: 4,
    backAccel: 1,
    steerSpeed: 3,
    steerWindupMax: 8,
    reactorPower: 2,
    energyMax: 10,
    weapons: {
      
    },
    mounts: 2,
    mass: 25,
    impactResist: 4,
    shields: {
      energyCost: 5,
      strenght: 2,
      radius: 80,
      active: false,
    },
    dashTimerMax: 35,
    invSlots: 8,
    autoBreakPower: 0.04,
    hitbox: {

    },
    radius: 25,
  },
  wasp: {
    name: 'WASP-110',
    visual: {
      base: 'assets/wasp_default.png',
      turret: null,
      dashInd: 'assets/wasp_default_dash_indicator.png',
      laserInd: {
        c0: 'assets/wasp_default_laser_ind_0.png',
        c1: 'assets/wasp_default_laser_ind_1.png',
        c2: 'assets/wasp_default_laser_ind_2.png',
        c3: 'assets/wasp_default_laser_ind_3.png',
      },
      dimX: 128,
      dimY: 128,
    },
    agility: 3,
    armor: 10,
    maxDodge: 650,
    maxVel: 15,
    acceleration: 3,
    backAccel: 1,
    steerSpeed: 3.5,
    steerWindupMax: 18,
    reactorPower: 2,
    energyMax: 10,
    weapons: {
      front_laser_double: weapons['front_laser_double'] //default starting weapon of WASP-110
    },
    mounts: 2,
    mass: 35,
    impactResist: 6,
    shields: {
      energyCost: 5,
      strenght: 2,
      radius: 80,
      active: false,
    },
    dashTimerMax: 50,
    invSlots: 10,
    autoBreakPower: 0.02,
    hitbox: {

    },
    radius: 30,
  },

  cargo: {
    name: 'Cargo Ship Class I',
    visual: {
      base: 'assets/cargo_ship_small.png',
      turret: null,
      dashInd: null,
      laserInd: null,
      dimX: 128,
      dimY: 128,
    },
    agility: 1.2,
    armor: 12,
    maxDodge: 350,
    maxVel: 10,
    acceleration: 2,
    backAccel: 1,
    steerSpeed: 1.2,
    steerWindupMax: 8,
    reactorPower: 4,
    energyMax: 30,
    weapons: {},
    mounts: 2,
    mass: 70,
    impactResist: 4,
    shields: {
      energyCost: 10,
      strenght: 5,
      radius: 120,
      active: false,
    },
    dashTimerMax: 50,
    invSlots: 30,
    autoBreakPower: 0.012,
    hitbox: {

    },
    radius: 30,
  },
  dynamo_c_cII: {
    name: 'Dynamo Cruiser Class II',
    visual: {
      base: 'assets/dynamo_cruiser_class_II.png',
      turret: null,
      dashInd: null,
      laserInd: null,
      dimX: 256,
      dimY: 256,
    },
    agility: 1.5,
    armor: 15,
    maxDodge: 700,
    maxVel: 10,
    acceleration: 2,
    backAccel: 1,
    steerSpeed: 1.75,
    steerWindupMax: 8,
    reactorPower: 4,
    energyMax: 30,
    weapons: {
      debug: weapons['debug']
    },
    mounts: 4,
    mass: 120,
    impactResist: 6,
    shields: {
      energyCost: 10,
      strenght: 5,
      radius: 120,
      active: false,
    },
    dashTimerMax: 50,
    invSlots: 25,
    autoBreakPower: 0.025,
    hitbox: [
      {
        x1: -55,
        y1: -112,
        x2: 110,
        y2: 142,
      },
      // {
      //   x1: -30,
      //   y1: 30,
      //   x2: 85,
      //   y2: 83,
      // },
    ],
    hitboxType: 'hitbox',
    radius: 50, // unimportant, will be swapped for hitboxes later on
  },
}

let enemy_ships = {
  wasp: {
    name: 'WASP-110',
    visual: {
      base: 'assets/wasp_default.png',
      turret: null,
      dashInd: 'assets/wasp_default_dash_indicator.png',
      laserInd: {
        c0: 'assets/wasp_default_laser_ind_0.png',
        c1: 'assets/wasp_default_laser_ind_1.png',
        c2: 'assets/wasp_default_laser_ind_2.png',
        c3: 'assets/wasp_default_laser_ind_3.png',
      },
      dimX: 128,
      dimY: 128,
    },
    agility: 3,
    armor: 10,
    maxDodge: 650,
    maxVel: 15,
    acceleration: 3,
    backAccel: 1,
    steerSpeed: 3.5,
    steerWindupMax: 18,
    reactorPower: 2,
    energyMax: 10,
    weapons: {
      front_laser_double: weapons['front_laser_double'] //default starting weapon of WASP-110
    },
    mounts: 2,
    mass: 35,
    impactResist: 6,
    shields: {
      energyCost: 5,
      strenght: 2,
      radius: 80,
      active: false,
    },
    dashTimerMax: 50,
    invSlots: 10,
    autoBreakPower: 0.02,
    hitbox: {
      type: 'radius',
      radius: 50,
    },
    radius: 30,
  },
}

let stations = {
  docking_station : {
    name: 'XOR-0-1512',
    visual: {
      base: 'assets/docking_station.png',
      dimX: 512,
      dimY: 512,
    }
  }
}
//classes
class Ship {
  constructor (x,y,rotation,shipData) {

    //properties from shipData, unique per ship
    this.name = shipData.name
    this.radius = shipData.radius
    this.acceleration = shipData.acceleration
    this.backAccel = shipData.backAccel
    this.maxVel = shipData.maxVel
    this.maxDodge = shipData.maxDodge
    this.steerSpeed = shipData.steerSpeed // 360 % this.steerSpeed == 0 , otherwise not good
    this.reactorPower = shipData.reactorPower
    this.energyMax = shipData.energyMax
    this.weapons = shipData.weapons
    this.mounts = shipData.mounts
    this.agility = shipData.agility //idea ,this influences the change in velocity when dashing
    this.shields = shipData.shields
    this.impactResist = shipData.impactResist
    this.mass = shipData.mass
    this.armor = shipData.armor
    this.invSlots = shipData.invSlots
    this.autoBreakPower = shipData.autoBreakPower
    this.dashTimerMax = shipData.dashTimerMax
    this.steerWindupMax = shipData.steerWindupMax
    this.visual = shipData.visual
    this.sprite = new Image()
    this.sprite.src = this.visual.base
    this.dashInd = null
    if(this.visual.dashInd) {
      this.dashInd = new Image()
      this.dashInd.src = this.visual.dashInd
    }
    this.turret = null
    if(this.visual.turret) {
      this.turret = new Image()
      this.turret.src = this.visual.turret
      this.turretDimX = this.dimX
      this.turretDimY = this.dimY
      this.turretRotation = 0
    }
    this.laserInd = null
    if(this.visual.laserInd) {
      this.laserInd = {};
      this.laserInd.c0 = new Image()
      this.laserInd.c0.src = this.visual.laserInd.c0
      this.laserInd.c1 = new Image()
      this.laserInd.c1.src = this.visual.laserInd.c1
      this.laserInd.c2 = new Image()
      this.laserInd.c2.src = this.visual.laserInd.c2
      this.laserInd.c3 = new Image()
      this.laserInd.c3.src = this.visual.laserInd.c3
      this.laserInd.current = this.laserInd.c1
    }
    this.dimX = this.visual.dimX
    this.dimY = this.visual.dimY
    this.hitboxInit = shipData.hitbox
    this.hitbox = this.hitboxInit
    
    // universal properties initialized for each ship
    this.id = Math.round(Math.random()*100000000000000) //minorissue this has a very low chance to break, so it's probably okay
    this.glowSprite = new Image()
    this.glowSprite.src = 'assets/ship_glow.png'
    this.x = x
    this.y = y
    this.rotation = rotation
    this.steerWindup = this.steerWindupMax
    this.energy = this.energyMax
    this.velocity = { //basically movement speed, //idea // could be upgraded by some way, as a simple engine upgrade
      x: 0,
      y: 0,
    }
    this.hidden = false // cloaking idea, perhaps that will be reworked into a % based cloak
    this.invulnerable = false
    this.dodgeDistance =  this.maxDodge
    this.dodging = false
    this.dashTimer = 0 //idea it should go up to around 30 or 40 so you can dash once a second just fine
    this.stuck = false
    this.stuckInside = null
    this.stuckTimer = 3
    this.inDanger = false
    this.grid_pos = {
      x: null,
      y: null,
    }
    this.dashRamp = 3 //unfinished
    this.activeWeaponKey = Object.keys(this.weapons)[0]

    //debug ship movement
    // this.maxVel = 5
    this.currency = 0
    this.inventory = []

    this.transform = null;

    this.broadphase_detected = false

    objects_all.push(this)
    objects_collidable.push(this)
  }
  draw() { //player.draw()

    // main transformation matrix for player
    this.applyMatrix()

    if(this.dodging) {
      ctx.globalAlpha = 0.5;
      ctx.filter = 'saturate(0) brightness(0.9)'
    }
    else if(this.invulnerable) {
      ctx.globalAlpha = 1
      ctx.filter = 'saturate(0) brightness(0.9)'
    }

    // just test drawing some kinda shields
    if(this.shields.active) {
      ctx.save()
      ctx.beginPath()
      ctx.arc(0,0,this.shields.radius,0,pi*2,false)
      ctx.strokeStyle = 'hsla(214, 80%, 68%, 0.4)'
      ctx.lineWidth = 3
      ctx.stroke()
      ctx.closePath()
      ctx.restore()
    }

    //draw ship glow
    ctxBg.drawImage(this.glowSprite,0 - this.dimX,0 - this.dimY,this.dimX*2,this.dimY*2)

    //draw ship body
    ctx.drawImage(this.sprite, 0 - this.dimX/2, 0 - this.dimY/2, this.dimX, this.dimY)

    //dash ind
    if(this.dashInd) {
      ctx.globalAlpha = 1 / (this.dashTimer/7)
      ctx.drawImage(this.dashInd, 0 - this.dimX/2, 0 - this.dimY/2, this.dimX, this.dimY)
    }
    ctx.globalAlpha = 1


    //draw turret if ship has one
    if(this.turret) {
      this.rotateTurret()
      ctx.drawImage(this.turret, 0 - this.dimX/2, 0 - this.dimY/2, this.dimX, this.dimY)
    }

    //draw laserInd if ship has one
    if(this.laserInd != null) {
      ctx.drawImage(this.laserInd.current, 0 - this.dimX/2, 0 - this.dimY/2, this.dimX, this.dimY)
    }

    if(debug) { //debug text
      //draw x, y, rotation, gridPos
      ctx.save()
      ctx.rotate(-this.rotation * pi/180)
      ctx.font = '14px Arial'
      ctx.fillStyle = 'white'
      ctx.fillText('Grid cell: ' + this.grid_pos.x, 0 - this.dimX/2, 0 - this.dimY/2 - 80);
      ctx.fillText('Grid cell: ' + this.grid_pos.y, 0 - this.dimX/2, 0 - this.dimY/2 - 60);
      ctx.fillText('x:' + this.x, 0 - this.dimX/2, 0 - this.dimY/2 - 40);
      ctx.fillText('y:' + this.y, 0 - this.dimX/2, 0 - this.dimY/2 - 20);
      ctx.fillText(this.rotation, 0 - this.dimX/2, 0 - this.dimY/2);
      ctx.restore()
    }
    
    if(debug) { //debug 
      // draw hitbox representation ( this does not mean the hitbox is accurate, this drawing represents the DESIRED hitbox, i'll draw the ACTUAL hitbox from somewhere else)
      if(this.hitbox) {
        ctx.save()
        ctx.beginPath()
        ctx.lineWidth = 2
        ctx.globalAlpha = 0.5
        ctx.strokeStyle = 'white'
        this.hitbox.forEach(box=> {
          ctx.rect(0 + box.x1,0 + box.y1,box.x2,box.y2)
        })
        
        
        ctx.stroke()
        ctx.closePath()
        ctx.restore()
      }

      //deprecated but col detection still used ship.radius
      ctx.save()
      ctx.beginPath()
      ctx.lineWidth = 1
      ctx.strokeStyle = 'hsla(45,100%,70%,0.25)'
      ctx.arc(0,0,this.radius,0,pi*2,false)
      ctx.stroke()
      ctx.closePath()
      ctx.restore()

      // draw boundingbox
      ctx.save()
      ctx.beginPath()
      ctx.lineWidth = 2
      ctx.globalAlpha = 0.25
      ctx.strokeStyle = 'white'
      ctx.rect(0 - this.dimX/2,0 - this.dimY/2,this.dimX, this.dimY)
      ctx.stroke()
      ctx.closePath()
      ctx.restore()
    }

    ctx.globalAlpha = 1
    ctx.filter = 'none'
    
    this.restoreMatrix()
  }

  toggleShields() {
    this.shields.active = !this.shields.active
  }

  rotateTurret() {
    var angle = Math.atan2(player.y - mouseY, player.x - mouseX);
    this.turretRotation = 270 + (angle * 180) / pi
  }

  saveGhost_Shadow() {
    if(this.velocity.x + this.velocity.y > 0) {
      ghosts.push(new Ghost(this.x, this.y, this.rotation, this.visual, this.sprite, 'shadow'))
    }
  }

  displayDodgePreview() {
    if(!pressedShift) return
    if(this.dodging) return
    let distFromPlayer = Math.hypot(
      this.x - mouseX - camera.x, 
      this.y - mouseY - camera.y
    )
    let distX = mouseX - this.x + camera.x
    let distY = mouseY - this.y + camera.y
    let distanceRatio = distFromPlayer / this.dodgeDistance
    if(distanceRatio > 1) {
      distX /= distanceRatio
      distY /= distanceRatio
    }
    ctx.save()
    // ctx.globalAlpha = 0.4
    ctx.filter = 'saturate(0) brightness(0.5)'
    ctx.translate(this.x + distX,this.y + distY)
    ctx.rotate(this.rotation * pi / 180)
    ctx.drawImage(this.sprite, 0 - this.dimX/2, 0 - this.dimY/2 , this.dimX, this.dimY)
    ctx.restore()
  }
  accelerate() {
    if(!movingForward && !movingBackward) return;
    if(dodgeDir) return;

    let speed = Math.sqrt(Math.abs(this.velocity.x)**2 + Math.abs(this.velocity.y)**2)
    if(speed >= this.maxVel) {
      if(debug) console.log('---------------------')
      if(debug) console.log('Reached maximum speed: ' + speed)

      
      
      let speedRedux = 1/(this.maxVel / speed)
      this.velocity.x -= (this.velocity.x*speedRedux)/10
      this.velocity.y -= (this.velocity.y*speedRedux)/10
      return
    } 

    var rad; 
    if(movingForward) {

      if(this.rotation >= 0 && this.rotation < 90) {
        rad = (90 - this.rotation) * (pi/180);
        this.velocity.x += Math.abs(Math.cos(rad) * this.acceleration/15 )
        this.velocity.y += -Math.abs(Math.sin(rad) * this.acceleration/15 )
      }
      
      if(this.rotation >= 90 && this.rotation < 180) {
        rad = (90 - (90 - (90 - this.rotation))) * (pi/180);
        this.velocity.x += Math.abs(Math.cos(rad) * this.acceleration/15 )
        this.velocity.y += Math.abs(Math.sin(rad) * this.acceleration/15 )
      }
      
      if(this.rotation >= 180 && this.rotation < 270) {
        rad = (90 - (90 - (90 - this.rotation))) * (pi/180);
        this.velocity.x += -Math.abs(Math.cos(rad) * this.acceleration/15 )
        this.velocity.y += Math.abs(Math.sin(rad) * this.acceleration/15 )
      }
      
      if(this.rotation >= 270 && this.rotation < 360) {
        rad = (90 - (90 - (90 - this.rotation))) * (pi/180);
        this.velocity.x += -Math.abs(Math.cos(rad) * this.acceleration/15 )
        this.velocity.y += -Math.abs(Math.sin(rad) * this.acceleration/15 )
      }
    }
    else
    if(movingBackward) {

      if(this.rotation >= 0 && this.rotation < 90) {
        rad = (90 - this.rotation) * (pi/180);
        this.velocity.x -= Math.abs(Math.cos(rad) * this.backAccel/15 )
        this.velocity.y -= -Math.abs(Math.sin(rad) * this.backAccel/15 )
      }
      
      if(this.rotation >= 90 && this.rotation < 180) {
        rad = (90 - (90 - (90 - this.rotation))) * (pi/180);
        this.velocity.x -= Math.abs(Math.cos(rad) * this.backAccel/15 )
        this.velocity.y -= Math.abs(Math.sin(rad) * this.backAccel/15 )
      }
      
      if(this.rotation >= 180 && this.rotation < 270) {
        rad = (90 - (90 - (90 - this.rotation))) * (pi/180);
        this.velocity.x -= -Math.abs(Math.cos(rad) * this.backAccel/15 )
        this.velocity.y -= Math.abs(Math.sin(rad) * this.backAccel/15 )
      }
      
      if(this.rotation >= 270 && this.rotation < 360) {
        rad = (90 - (90 - (90 - this.rotation))) * (pi/180);
        this.velocity.x -= -Math.abs(Math.cos(rad) * this.backAccel/15 )
        this.velocity.y -= -Math.abs(Math.sin(rad) * this.backAccel/15 )
      }
    }
  }

  decelerate() {
    if(movingForward || movingBackward) return;
    if(this.stuck) return;
    if(this.velocity.x !== 0) {
      var decrease = (0 - this.velocity.x) * this.autoBreakPower // the smaller the last number, the slower the return to 1
      this.velocity.x += decrease
    }
    if(this.velocity.y !== 0) {
      var decrease = (0 - this.velocity.y) * this.autoBreakPower // the smaller the last number, the slower the return to 1
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
    if(turningCCW && turningCW) {
      return
    }
    if(!turningCCW && !turningCW && this.steerWindup < this.steerWindupMax) {
      this.steerWindup++
    }
    if(!turningCCW && !turningCW && this.steerWindup == this.steerWindupMax) {
      return
    }
    
    // rotate the player sprite
    if(turningCCW) {
      this.rotation -= this.steerSpeed / (1 + (this.steerWindup/this.steerWindupMax))
      if(this.rotation < 0) this.rotation = 359
    }
    if(turningCW) {
      this.rotation += this.steerSpeed / (1 + (this.steerWindup/this.steerWindupMax))
      if(this.rotation >= 359) this.rotation = 0
    }
    if(this.steerWindup > 0 && (turningCW || turningCCW)) {
      this.steerWindup--
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

  displayDodgeRange() {
    dodgePosVisible = true;
    if(windup < 48) windup += 8

    ctx.save()
    ctx.globalAlpha = windup / 100
    if(dodgeDir) ctx.globalAlpha *= 0.7
    ctx.strokeStyle = 'white'
    ctx.lineWidth = 2.5
    ctx.fillStyle = 'white';
    
    ctx.beginPath()
    ctx.arc(this.x, this.y, this.dodgeDistance, 0, pi*2, false)
    ctx.stroke()
    ctx.closePath()
    ctx.restore()
  }

  dodge(direction,ev) {
    // console.log(this.dodgeDistance)
    if(dodgeDir !== null) return;
      playerMoved = true
      this.invulnerable = true
      this.dodging = true
      
      let distFromPlayer = Math.hypot(this.x - ev.clientX - camera.x, this.y - ev.clientY - camera.y)
      let distX =  ev.clientX - this.x + camera.x
      let distY =  ev.clientY - this.y + camera.y

      let distanceRatio = distFromPlayer / this.dodgeDistance

      if(distanceRatio > 1) {
        distX /= distanceRatio
        distY /= distanceRatio
      }
      gsap.fromTo(this,
        {
          x: this.x, 
          y: this.y,
        }, 
        {
          x: this.x + distX,
          y: this.y + distY,
          duration: dodgeSpeed + (distFromPlayer/1200), 
          onComplete: () => {dodgeFinish()},
        })

      dodgeDir = direction;

      this.velocity.x = this.velocity.y = 0
  }

  dash() {
    if(this.dashTimer) return;
    if(dodgeDir) return;
    if(movingBackward && !movingForward) {
      this.velocity.x *= -1
      this.velocity.y *= -1
    }
    var rad;
    //do a backwards dash
    this.velocity.x /= this.agility
    this.velocity.y /= this.agility
    let pushX;
    let pushY;
    if(this.rotation >= 0 && this.rotation < 90) {
      rad = (90 - this.rotation) * (pi/180);
      pushX = Math.abs(Math.cos(rad) * this.acceleration*5 )
      pushY = -Math.abs(Math.sin(rad) * this.acceleration*5 )
    }
    if(this.rotation >= 90 && this.rotation < 180) {
      rad = (90 - (90 - (90 - this.rotation))) * (pi/180);
      pushX = Math.abs(Math.cos(rad) * this.acceleration*5 )
      pushY = Math.abs(Math.sin(rad) * this.acceleration*5 )
    }

    if(this.rotation >= 180 && this.rotation < 270) {
      rad = (90 - (90 - (90 - this.rotation))) * (pi/180);
      pushX = -Math.abs(Math.cos(rad) * this.acceleration*5 )
      pushY = Math.abs(Math.sin(rad) * this.acceleration*5 )
    }

    if(this.rotation >= 270 && this.rotation < 360) {
      rad = (90 - (90 - (90 - this.rotation))) * (pi/180);
      pushX = -Math.abs(Math.cos(rad) * this.acceleration*5 )
      pushY = -Math.abs(Math.sin(rad) * this.acceleration*5 )
    }
    
    if(movingForward &&!movingBackward || !movingForward && !movingBackward) {
      this.velocity.x += pushX
      this.velocity.y += pushY
    }
    else if(movingBackward && !movingForward) {
      this.velocity.x -= pushX
      this.velocity.y -= pushY
    }
    
    this.velocity.x *= 1 + this.agility/10
    this.velocity.y *= 1 + this.agility/10
    if(debug) console.log("Velocity after dashing: x: " + this.velocity.x + ' y: ' + this.velocity.y)
    this.dashTimer = this.dashTimerMax //issue terrible naming
  }
  dashRecharge() {
    if(this.dashTimer >= 1) {
      this.dashTimer--
    }
  }

  selectWeapon(weapon) {
    console.log('Select a weapon to be used.')

    //debug - just hardset this for now

  }

  fire(e) {
    if(this.activeWeaponKey == 'front_laser_double') {
      let weapon = this.weapons['front_laser_double']
      if(weapon.charges < 1) return
      weapon.charges--
      this.weapons['front_laser_double'].rechargeInit()
      laserbeams.push(new LaserBeam(this.x,this.y,this.id,this.rotation,this.weapons.front_laser_double.damage,e))

      laserbeams.push(new LaserBeam(this.x + 30,this.y + 30,this.id,this.rotation,this.weapons.front_laser_double.damage,e)) // unfinished
    }
    if(this.activeWeaponKey == 'debug') {
      fire(e)
    }
    if(this.activeWeaponKey == null) {
      new InfoPopup(player.x, player.y - 50, 'No weapons equipped.')
    }
  }
  updateWeapons() {
    if(this.activeWeaponKey == 'front_laser_double') {
      let weapon = this.weapons['front_laser_double']
      if(weapon.rechargeTime <= 0 && weapon.charges < weapon.chargesMax) {
        weapon.charges++
        if(debug) console.log('Laser recharged.')
        weapon.rechargeInit()
      }
      if(weapon.charges != weapon.chargesMax) {
        weapon.rechargeTime--
      }

      if(weapon.charges == 0) this.laserInd.current = this.laserInd.c0
      if(weapon.charges == 1) this.laserInd.current = this.laserInd.c1
      if(weapon.charges == 2) this.laserInd.current = this.laserInd.c2
      if(weapon.charges == 3) this.laserInd.current = this.laserInd.c3
    }
  }
  spawn() {
    //write spawn code that places the player inside a room appropriately
  }
  applyMatrix() {
    ctx.save()
    ctxBg.save()
    this.transform = new Transform()
    this.transform.translate(-camera.x,-camera.y)
    this.transform.translate(this.x,this.y)
    // this.transform.rotate(this.rotation * pi / 180)

    var m = this.transform.m;
    ctx.setTransform(m[0], m[1], m[2], m[3], m[4], m[5]);
    ctxBg.setTransform(m[0], m[1], m[2], m[3], m[4], m[5]);
  }
  restoreMatrix() {
    ctx.restore()
    ctxBg.restore()
  }
  transformHitbox() {
     // now transform the hitbox
  }
  restoreHitbox() {
    this.hitbox = this.hitboxInit
  }

  update() {
    this.applyMatrix()

    this.steer()
    this.accelerate()
    this.move()
    this.decelerate()
    this.saveGhost_Shadow()
    this.dashRecharge()
    this.updateWeapons()

    this.restoreMatrix()
  }
}

class Ghost {
  constructor(x,y,rotation,visual,sprite,type) {
    this.x = x
    this.y = y
    this.rotation = rotation
    this.alpha = ghostOpacity
    this.visual = visual
    this.sprite = sprite
    this.type = type
    this.dimX = this.visual.dimX
    this.dimY = this.visual.dimY

    objects_all.push(this)

  }
  draw() {
    if(this.alpha < 0) {
      console.log('Ghost drawn with alpha < 0, a mistake happened.')
      return
    }
    if(this.type == 'shadow') {
      ctx.save()
      ctx.translate(this.x,this.y)
      ctx.rotate(this.rotation * pi / 180)
      if(player.invulnerable) ctx.filter = 'saturate(0)'
      ctx.globalAlpha = this.alpha;
      ctx.drawImage(this.sprite, 0 - this.dimX/2, 0 - this.dimY/2, this.dimX, this.dimY)
      ctx.restore()
    }
  }
  update() {
    if(this.alpha <= 0) {
      return
    } else {
      this.alpha -= ghostOpacity / ghostNumber
    }
  }
}

class Weapon {
  constructor(x,y,name) {
    this.x = x
    this.y = y
    this.name = name
  }
}

class LaserBeam {
  constructor(x,y,originId,angle,damage,mouseEv) {
    this.x = x
    this.y = y
    this.originId = originId
    this.angle = angle
    this.damage = damage
    this.destX = this.x
    this.destY = this.y
    this.lifeMax = 8 //this is the number of frames it'll be visible
    this.life = this.lifeMax
    this.hypot = cw *2
    this.dead = false
    this.hasTarget = false;
    var rad;
    if(debug) console.log('Player laser destination point:')
    if(this.angle >= 0 && this.angle < 90) {
      rad = (90 - this.angle) * (pi/180)
      console.log( 'rad: ' + rad)
      this.destX +=  Math.abs(Math.cos(rad) * this.hypot)
      this.destY += -Math.abs(Math.sin(rad) * this.hypot)
      if(debug) console.log('x: ' + this.destX + ' y: ' + this.destY)
    }
    if(this.angle >= 90 && this.angle < 180) {
      rad = (90 - (90 - (90 -  this.angle))) * (pi/180)
      console.log( 'rad: ' + rad)
      this.destX +=  Math.abs(Math.cos(rad) * this.hypot)
      this.destY +=  Math.abs(Math.sin(rad) * this.hypot)
      if(debug) console.log('x: ' + this.destX + ' y: ' + this.destY)
    }
    if(this.angle >= 180 && this.angle < 270) {
      rad = (90 - (90 - (90 -  this.angle))) * (pi/180)
      console.log( 'rad: ' + rad)
      this.destX += -Math.abs(Math.cos(rad) * this.hypot)
      this.destY +=  Math.abs(Math.sin(rad) * this.hypot)
      if(debug) console.log('x: ' + this.destX + ' y: ' + this.destY)
    }
    if(this.angle >= 270 && this.angle < 360) {
      rad = (90 - (90 - (90 -  this.angle))) * (pi/180)
      console.log( 'rad: ' + rad)
      this.destX += -Math.abs(Math.cos(rad) * this.hypot)
      this.destY += -Math.abs(Math.sin(rad) * this.hypot)
      if(debug) console.log('x: ' + this.destX + ' y: ' + this.destY)
    }

    this.hasTarget = false;
    enemyships.forEach((ship,shipInd)=> {
      if(isCircleSegmentColliding(this.x,this.y,this.destX,this.destY,ship.x,ship.y,ship.radius)) {
        ship.markForHit = true
        this.hasTarget = true
        console.log('Ship' + ship.id + 'markForHit: ' + ship.markForHit)
      }
    })

    if(this.hasTarget) {
      let distances = [];
      // calculate distance from player for each ship, store it in distances[]
      enemyships.forEach(ship=> {
        if(ship.markForHit) {
          distances.push(Math.hypot(player.x - ship.x, player.y - ship.y))
        }
      })
      
      let closestShip = distances.indexOf(Math.min(...distances))
      enemyships[closestShip].damage()
      
      console.log('Closest ship at distance: ' + closestShip)
      
    }
    if(debug) console.log('angle: ' + (rad *180) / pi)
  }
  draw() {
    ctx.save()
    ctx.beginPath()
    ctx.globalAlpha = this.life/this.lifeMax
    ctx.strokeStyle = 'red'
    ctx.lineWidth = 5
    ctx.moveTo(this.x, this.y)
    ctx.lineTo(this.destX,this.destY)
    ctx.stroke()
    ctx.closePath()
    ctx.restore()
  }
  update() {
    if(this.life <= 0) { 
      this.dead = true
      return
    }
    this.life--
  }
}

class DockingStation {
  constructor(x,y,rotation,stationData) {
    this.id = Math.round(Math.random()*100000000000000)
    this.name = stationData.name
    this.dimX = stationData.visual.dimX
    this.dimY = stationData.visual.dimY
    this.sprite = new Image()
    this.sprite.src = stationData.visual.base
    //universal properties
    this.x = x
    this.y = y
    this.rotation = rotation
    this.hintVisible = false;

    objects_all.push(this)
  }
  draw() {
    ctx.save()
    ctx.translate(this.x,this.y)
    ctx.rotate(this.rotation * pi / 180)
    ctx.drawImage(this.sprite, 0 - this.dimX/2, 0 - this.dimY/2, this.dimX, this.dimY)
    ctx.restore()

    // this.rotation += 0.1
    // if(this.rotation > 360) this.rotation = 0
  }
  update() {
    console.log('Update code for DockingStation.')
    //check for player nearby to display hint 
    let dist = Math.hypot(this.x - player.x, this.y - player.y)
    if(dist < this.dimX/2) {
      if(this.hintVisible) return
      this.hintVisible = true
      hints.push(new Hint(this.x,this.y, 'Press [E] to interact.',this.id))
    }
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
      // this.bounces = 3; // so far remove the ricochet from all projectiles, it's stupid
      this.bounced = false;
      this.power = 0.30
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
    if(type == 'cannon') {
      this.x = x;
      this.y = y;
      this.radius = radius * cannonRadiusMult;
      this.color = color;
      this.velocity = {
        x: velocity.x *0.7,
        y: velocity.y *0.7,
      };
      this.bounces = 0;
      this.bounced = false;
      this.life = 4;
      this.power = 12
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
      this.sprite = new Image()
      this.sprite.src = 'assets/missile.png'
      this.spriteDim = {
        x: 32,
        y: 32
      }
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
      this.power = 0.35
      this.damage = 7
      this.type = type;
      this.dead = false;
    }
    objects_all.push(this)
  }
  draw() {
    
    // if(this.type == 'explosive') {
    //   ctx.drawImage(this.sprite,this.x - this.spriteDim.x/2,this.y - this.spriteDim.y/2, this.spriteDim.x, this.spriteDim.y)
    // } else {
      ctx.beginPath();
      ctx.arc(this.x,this.y,this.radius,0,pi * 2, false)
      ctx.fillStyle = this.color
      ctx.fill();
      ctx.closePath();      
    // }
  }
  saveGhost() {
    // if(this.type !== 'explosive')
    projectileGhosts.push(new ProjectileGhost(this.x,this.y,this.radius, this.color))
  }
  
  drawGhosts() {
    projectileGhosts.forEach((ghost)=> {
      ghost.update()
    })
  }
  update() {
    this.saveGhost()
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
    this.alpha = 0.4
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
  constructor(x,y,radius,rotation,shipData) {
    this.id = Math.round(Math.random()*100000000000000)
    this.name = shipData.name
    this.x = x
    this.y = y
    this.radius = radius
    this.rotation = rotation
    this.maxVel = 4
    this.velocity = {
      x: 1,
      y: 1,
    }
    this.velAbsorb = 0.1

    this.armor = 10
    this.invulnerable = false;
    this.invulWindow = 200;
    this.destroy = false
    this.dead = false
    this.exploded = false
    this.target = 'player'
    this.tracking = false
    this.hasLineOfSight = false
    this.changingTarget = false
    this.sprite = new Image()
    this.sprite.src = 'assets/wasp_default.png'
    this.dimX = 128 
    this.dimY = 128
    this.mass = 35
    this.fireTimerInit = 90
    this.fireTimer = this.fireTimerInit
    this.markForHit = false;

    objects_all.push(this)
    objects_collidable.push(this)
  }
  draw() {
    ctx.save()
    ctx.beginPath()
    ctx.translate(this.x,this.y)
    ctx.rotate((this.rotation + 0) * pi / 180)
    if(this.invulnerable) {
      ctx.filter = 'saturate(0)'
    }
    else if (this.dead) {
      ctx.filter = 'brightness(0.8)'
    }
    ctx.drawImage(this.sprite, 0 - this.dimX/2, 0 - this.dimY/2,this.dimX,this.dimX)

    ctx.closePath()
    ctx.restore()

    
    //debug 
    if(debug) {
      ctx.save()
      ctx.translate(this.x,this.y)
      ctx.font = '14px Arial'
      ctx.fillStyle = 'white'

      let shipToPlayer = (Math.atan2(player.y - this.y, player.x - this.x) * 180) / pi + 90
      if (shipToPlayer > 359) shipToPlayer -= 360
      if (shipToPlayer < 0) shipToPlayer += 360
      
      ctx.fillText("Rotation: " + this.rotation, 0 - this.dimX/2, 0 - this.dimY/2);
      ctx.translate(0,25)
      ctx.fillText("Ship to player:" + shipToPlayer, 0 - this.dimX/2, 0 - this.dimY/2);
      ctx.restore()

      //draw hitbox
      ctx.save() 
      ctx.beginPath()
      ctx.arc(this.x,this.y,this.radius,0,pi*2,false)
      ctx.strokeStyle = 'white'
      ctx.lineWidth = 1
      ctx.stroke()
      ctx.closePath()      
      ctx.restore()

    }
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


    // the old rotation code
    gsap.fromTo(this,
      {rotation: this.rotation},
      {rotation: 90 + (angle * 180) / pi, duration: 1}
    )
    

    //issue, this needs to be used but slightly better
    // this.rotation = 90 + (angle * 180) / pi

    // if(this.rotation < 0) this.rotation += 360


    // if(this.rotation > 359) this.rotation = 0

    // console.log('Rotation in deg: ' + this.rotation) 
    

    //issue here is the problem with player and enemy colliding -  the enemy ship is constantly accelerating
    
    var dist = Math.hypot(player.x - this.x, player.y - this.y) 

    if(dist < player.dimX + this.dimX ) {
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
    //important, do this very soon
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
      this.fireTimer = this.fireTimerInit
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
      this.death()
      return
    }
    this.armor--
    this.invulnerable = true
    setTimeout(()=>{this.invulnerable = false},this.invulWindow)
    
  }
  death() {
    deadShipDialogs.push(new DeadShipDialog(this.x,this.y, 
      `The ship may be destroyed, but there's still some valuables inside.
      <br><br>
      Loot:
      <span class='loot-item' data-loot='currency' data-lootAmt='5' onclick='gainCurrency(this)'> <br>• Some currency: 5 </span>
      <span class='loot-item' data-loot='laser_mount' onclick='acquireItem(this.dataset.loot,this)'> <br>• Cheap laser mount </span>
      <br>
      `
      ,this))
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
  update() {
    this.x += this.velocity.x
    this.y += this.velocity.y
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
    this.velocity.x *= friction;
    this.velocity.y *= friction;
    this.x += this.velocity.x
    this.y += this.velocity.y
    if(this.type == 'particle' || this.type == 'explosive') {
      this.alpha -= 1;
      if(this.alpha < 1) return
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
    this.dead = false
  }
  draw() {
    if(this.dead) return
    ctx.save()
    ctx.globalAlpha = this.life / this.lifeinit
    ctx.beginPath()
    ctx.fillStyle = this.color
    ctx.arc(this.x,this.y,this.radius,0,pi * 2, false)
    ctx.fill();
    ctx.closePath();
    ctx.restore()
  }
  update() {
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


class Asteroid {
  constructor(x,y,rotation,velocity,type) {
    this.id = Math.round(Math.random()*100000000000000)
    this.x = x
    this.y = y
    this.rotation = rotation
    this.velocity = velocity
    this.type = type // meaningless property so far
    this.sprite = new Image()
    this.sprite.src = 'assets/asteroid_1.png'
    this.dimX = 128
    this.dimY = 128
    this.spriteDim = {
      x: 128,
      y: 128
    }
    this.mass = 500
    this.radius = Math.max(this.dimX,this.dimY)/2
    this.velAbsorb = 0.15
    // this.canCollide = true;
    this.stuck = false;
    this.stuckTimer = 3
    this.stuckInside = null; // after it hits an asteroid it has the id of the previous asteroid written here, it is deleted after it is unstuck
    this.grid_pos = {
      x: undefined,
      y: undefined,
    }
    this.hitbox =  [
      {
        x1: -55,
        y1: -112,
        x2: 110,
        y2: 142,
      },
      // {
      //   x1: -30,
      //   y1: 30,
      //   x2: 85,
      //   y2: 83,
      // },
    ]
    this.hitboxType = 'hitbox'


    objects_all.push(this)
    objects_collidable.push(this)

  }
  draw() {
    this.applyMatrix()

    //draw asteroid sprite
    ctx.drawImage(this.sprite, 0 - this.spriteDim.x/2, 0 - this.spriteDim.y/2,this.spriteDim.x,this.spriteDim.y)
   
    
    if(debug) {
      // draw id
      ctx.save() 
      ctx.font = '14px Arial'
      ctx.fillStyle = 'white'
      ctx.fillText(`id: ${this.id}`, 0 - this.spriteDim.x/2, 0 - this.spriteDim.y/2);
      ctx.restore()

      //draw radial hitbox
      ctx.save()
      ctx.beginPath()
      ctx.arc(0,0,this.spriteDim.x/2,0,pi*2,false)
      ctx.strokeStyle = 'white'
      ctx.lineWidth = 1
      ctx.stroke()
      ctx.closePath()
      ctx.restore()

      //draw actual radial hitbox
      ctx.save()
      ctx.beginPath()
      ctx.arc(0,0,this.spriteDim.x/3,0,pi*2,false)
      ctx.strokeStyle = 'lightblue'
      ctx.lineWidth = 1
      ctx.stroke()
      ctx.closePath()
      ctx.restore()

      
      // draw hitbox representation ( this does not mean the hitbox is accurate, this drawing represents the DESIRED hitbox, i'll draw the ACTUAL hitbox from somewhere else)
      if(this.hitbox) {
        ctx.save()
        ctx.beginPath()
        ctx.lineWidth = 2
        ctx.globalAlpha = 0.5
        ctx.strokeStyle = 'white'
        this.hitbox.forEach(box=> {
          ctx.rect(0 + box.x1,0 + box.y1,box.x2,box.y2)
        })
        
        
        ctx.stroke()
        ctx.closePath()
        ctx.restore()
      }
    }
    this.restoreMatrix()
  }
  applyMatrix() {
    ctx.save()
    ctxBg.save()
    this.transform = new Transform()
    this.transform.translate(-camera.x,-camera.y)
    this.transform.translate(this.x,this.y)
    // this.transform.rotate(this.rotation * pi / 180)

    var m = this.transform.m;
    ctx.setTransform(m[0], m[1], m[2], m[3], m[4], m[5]);
    ctxBg.setTransform(m[0], m[1], m[2], m[3], m[4], m[5]);

  }
  restoreMatrix() {
    ctx.restore()
    ctxBg.restore()
  }

  update() {
    this.applyMatrix()

    this.x += this.velocity.x
    this.y += this.velocity.y

    this.restoreMatrix()
  }
}

class Debris {
  constructor(x,y,rotation,velocity,type) {
    this.id = Math.round(Math.random()*100000000000000) //minorissue this has a very low chance to break, so it's probably okay
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
    this.stuck = false
    this.stuckInside = null
    this.radius = this.spriteDim/2
    this.velAbsorb = 0.01
    objects_all.push(this)
    objects_collidable.push(this)
  }
  draw() {
    ctx.save()
    ctx.translate(this.x,this.y)
    ctx.rotate(this.rotation * pi/180)
    ctx.drawImage(this.sprite, 0 - this.spriteDim.x/2, 0 - this.spriteDim.y/2,this.spriteDim.x,this.spriteDim.y)
    ctx.restore()

    if(debug) {  
      
      // draw id
      ctx.save() 
      ctx.translate(this.x,this.y)
      ctx.font = '14px Arial'
      ctx.fillStyle = 'white'
      ctx.fillText(`${this.id}`, 0 - this.spriteDim.x/2, 0 - this.spriteDim.y/2);
      ctx.restore()
      
      //draw hitbox
      ctx.save() 
      ctx.beginPath()
      ctx.arc(this.x,this.y,this.spriteDim.x/2,0,pi*2,false)
      ctx.strokeStyle = 'white'
      ctx.lineWidth = 1
      ctx.stroke()
      ctx.closePath()      
      ctx.restore()

      //draw actual hitbox
      ctx.save()
      ctx.beginPath()
      ctx.arc(this.x,this.y,this.spriteDim.x/3,0,pi*2,false)
      ctx.strokeStyle = 'lightblue'
      ctx.lineWidth = 1
      ctx.stroke()
      ctx.closePath()
      ctx.restore()
    }
  }
  update() {
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

    this.triggerOffset = 25
    this.trigger = document.createElement('div')
    this.trigger.classList.add('dialog','trigger-box')
    this.trigger.style.left = (Math.round(this.x) - this.triggerOffset) + 'px'
    this.trigger.style.top = (Math.round(this.y) - this.triggerOffset) + 'px'
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
      this.trigger.style.left = (Math.round(this.x) - this.triggerOffset) + 'px'
      this.trigger.style.top = (Math.round(this.y) - this.triggerOffset) + 'px'
    }

    if(Math.hypot(player.x - this.x, player.y - this.y) < player.dimX + 20) {
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
    this.life = 100
    this.dead = false;
    this.visual = document.createElement('div')
    this.visual.classList.add('info-blip')
    this.visual.style.position = 'absolute'
    this.visual.style.left = this.x + 'px'
    this.visual.style.top = this.y + 'px'
    this.visual.innerText = text
    overlayMain.append(this.visual)
    overlaysInfo.push(this)
  }
  update() {
    this.life--
    if(this.life <= 25) this.visual.style.filter = `opacity(${this.life/25})`
    if(this.life <= 0) {
      this.visual.remove()
      this.dead = true;
    }
  }
}

class Hint {
  constructor(x,y,text,attachedTo) {
    this.x = x
    this.y = y
    this.text = text
  }
  update() {
    console.log('Do some stuff or maybe not')
  }
}

class Dialog { // this is the stupidest shitfuck code
  constructor(text) {
    if(debug) console.log('Dialog constructed.')
    dialogContainer.style.display = ''
    this.text = text
    this.visual = document.createElement('div')
    this.visual.classList.add('dialog','lore')
    this.visual.innerText = this.text
    this.visual.onclick = ()=> {
      pause()
      this.visual.remove()
      dialogContainer.style.display = 'none'
      dialogsVisible.splice(0,1)
    }
    dialogContainer.append(this.visual)
    setTimeout(()=>{
    pause() //issue //terrible-solution- timeouts === bad //important, whenever a dialog is constructed, it pauses the game, when you click the dialog, it UN-pauses

    },50)
  }
}
function spawnEnemy() { //deprecated
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

function spawnEnemyShip(x = centerX,y = centerY) {
  console.log('Spawned enemy ship.')
  enemyships.push(new EnemyShip(x,y,50,0,enemy_ships['wasp']))
}

function spawnDockingStation(x,y) {
  dockingStations.push(new DockingStation(centerX,centerY, 0, stations['docking_station']))
}

//badcode this function is a fucking curse
function init() { //this is a hard reset, this resets (almost) everything to the initial state //issue, alright this is badness, this is gonna break something soon
  console.log('Called init().')
  gameover = false
  
  rooms = []
  currRoom = null
  sectorIndex = 0
  currSector = null
  currRoom = null
  roomIndex = 0
  generateSector()
  arrowContainer.classList.remove('hidden')
  healthbar.innerHTML = ''
  healthSegments = []
  dodgeDir = null;
  waveActive = true;
  waveNumber = 1;
  score = 0;

  // playtesting amounts
  ammoRegular = 100
  ammoShrapnel = 100
  ammoCannon = 100
  ammoExplosive = 100
  ammoMachine = 100

  calcAmmoTotal()

  //issue what the fuck, why is there a canvas fill here
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
  clearRoom()
  updateScoreVisual()
  updateAmmoVisual()
  generateArmorVisual()
  updateHealthBar()
  draw()
  loadRoom(currRoom)

  //debug docking station
  // spawnEnemy()
  distributeObjects('asteroid', 20, {static: true})
  // distributeObjects('debris', 2, {static: true})
  // spawnEnemyShip(200,200)
}
//end of init()


function generateArmorVisual() {
  for (let i = 0; i < player.armor; i++) {
    var s = document.createElement('div')
    s.classList.add('armor-segment')
    healthSegments.push(s)
    healthbar.append(s)
  }
}

let mainbase = new Base(centerX, centerY, baseRadius, 'hsl(234,50%,12%)', baseHealth)

canvas.addEventListener('mousemove', function(e) {
  mouseX = e.offsetX
  mouseY = e.offsetY
})

canvas.addEventListener('wheel', processWheelEvents, {passive: true})

function processWheelEvents(e) { //scroll event listener
  // console.log(e.deltaY)
  // if(pressedShift) {
  //   resizeDodge(e)
  // } else {
    if(e.deltaY > 0) 
    cycleAmmo('normal')
    else if(e.deltaY < 0) 
    cycleAmmo('reverse')
  // }
  if(debug) console.log('Mousewheel events currently used for ammo cycling only.')

}
function resizeDodge(e) {
  console.log('resizeDodge() deprecated. Why is this getting called?')
  var resize = e.deltaY / 3

  if(player.dodgeDistance <= player.maxDodge && 
    player.dodgeDistance >= minDodge
  ) {
    player.dodgeDistance -= resize;
    if(player.dodgeDistance >= player.maxDodge) {
      player.dodgeDistance = player.maxDodge
    } else if(player.dodgeDistance <= minDodge) {
      player.dodgeDistance = minDodge
    }
  
  } else return;

  if(!dodgeResizing) {
    dodgeResizing = true
  }
  gsap.fromTo(player,
    {
    dodgeDistance: player.dodgeDistance
  },{
    x: dodgeDistance,
    y: dodgeDistance,
    duration: 0.2,
    onComplete: ()=> {dodgeResizing = false}
  })
}
canvas.addEventListener('contextmenu', function(e) {
  e.preventDefault()
})
canvas.addEventListener('mousedown', function(e) {
  if(!pressedShift) {
    player.fire(e)
  }
  if(pressedShift) {
    player.dodge(dodgePreview,e)
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
  console.log('global autoFire(): Only for debug purposes.')
}

function fire(e) {
  console.log('global fire(): Only for debug purposes.')
  if(gameover) return;
  if(ammoTotal < 1) return;
  if(dodgeDir) return;
  //completely rewrite everything here
  calcAmmoTotal()
  if(player.activeWeaponKey == 'front_laser_double') {
    
  }

  if(currentAmmoType == 'regular' && ammoRegular > 0) {
    ammoRegular--
    spawnProjectile(e)
  }
  if(currentAmmoType == 'shrapnel' && ammoShrapnel > 0) {
    ammoShrapnel--
    spawnProjectile(e)
  }
  if(currentAmmoType == 'cannon' && ammoCannon > 0) {
    ammoCannon--
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
  ctxBg.beginPath()
  ctxBg.fillStyle = 'hsl(0,0%,3%)'
  ctxBg.rect(camera.x,camera.y,cw,ch)
  ctxBg.fill()
  ctxBg.closePath()
}

function drawCursor() {
  if(!pressedCtrl) return
  ctx.beginPath();
  ctx.arc(mouseX,mouseY,cursorRadius,0,pi * 2, false)
  ctx.strokeStyle = 'hsl(0,100%,100%)'
  ctx.stroke()
  ctx.closePath();
}


// main draw function
function draw() {
 
  laserbeams.forEach(beam=> {
    beam.update()
  })
  //update all entities
  enemyProjectiles.forEach((projectile)=> {
    projectile.update()
  })
  projectiles.forEach((projectile)=> {
    projectile.update()
  })
  enemyships.forEach((ship)=> {
    ship.update()
  })
  projectileGhosts.forEach(projectile => {
    projectile.update()
  })
  explosions.forEach((explosion)=>{
    explosion.update()
  })
  debriss.forEach((debris) => {
    debris.update()
  })
  asteroids.forEach((asteroid) => {
    asteroid.update()
  })
  particles.forEach((particle) => {
    particle.update();
  })
  ghosts.forEach(ghost => {
    ghost.update()
  })

  player.update();


  // run some code for each player projectile
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
      setTimeout(()=>{projectile.bounced = false},25)
    }

    // top and bottom wall
    if(  
        (projectile.y > (canvas.height - projRadius) || projectile.y < (0 + projRadius)) &&
        projectile.bounces > 0
      ) {
      projectile.bounced = true
      projectile.bounces -= 1
      projectile.velocity.y *= -1
      setTimeout(()=>{projectile.bounced = false},25)
    }

    // destroy projectile if it went off the canvas
    if( 
      (projectile.x > (canvas.width + projRadius*2 ) || projectile.x < (0 - projRadius*2)) || 
      (projectile.y > (canvas.height + projRadius*2) || projectile.y < (0 - projRadius*2)) 
    ) {
      projectile.dead = true
    }
  })

  enemyships.forEach((ship, shipIndex)=> {
    
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
      var playerBalance = ship.mass / player.mass
      var shipBalance =  player.mass / ship.mass  // okay still very janky code overall
      
      var min = Math.min(playerBalance,shipBalance)
      
      if(min == playerBalance) {
        shipBalance = 1 - min
        playerBalance = min
      }
      if(min == shipBalance) {
        playerBalance = 1 - min
        shipBalance = min
      }
      // console.log(playerBalance + ' ' + shipBalance) //debug

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

  enemies.forEach((enemy, indexEnemy) => {
    return
    enemy.update();

    //automatic cleanup of enemies with radius <=1
    if(enemy.radius <= 1) enemies.splice(indexEnemy,1);

    //automatic cleanup of enemies which are very small and were burned by an explosion
    if(enemy.exploded == true && enemy.radius < minRadToBurn) {
      enemy.dead = true;
      gsap.to(enemy,{radius: 1, duration: enemy.radius/8 , onComplete: () => {
        enemies.forEach((en, ind) => {
          if(en.dead == true) enemies.splice(ind,1)
      })}})
    }

    // avoid running any more code on dead enemies, they will be removed automatically
    if(enemy.dead == true) return;
    let distance = Math.hypot(player.x - enemy.x,player.y - enemy.y)
    
    // when player is touched by an enemy
    if(distance - player.radius - enemy.radius < 0 && enemy.dead == false) {
      if(player.invulnerable == false) {

        player.damage()
      }
    }
    // remove enemy after it travels too far outside canvas bounds
    if( (enemy.x > (canvas.width + enemyRadius*2 ) || enemy.x < (0 - enemyRadius*2)) || (enemy.y > (canvas.height + enemyRadius*2) || enemy.y < (0 - enemyRadius*2)) ) {
      enemies.splice(indexEnemy, 1);
    }
    
    // projectile logic 
    projectiles.forEach((projectile, indexProj) => {


      let distance = Math.hypot(projectile.x - enemy.x,projectile.y - enemy.y)
      
      // when projectile hits an enemy
      if(distance - enemy.radius - projectile.radius < -1) {
        if(Math.random()*9 > 5) {
          console.log('Your code is bad.')
          gainAmmo('regular')
          gainAmmo('regular')
          new InfoPopup(enemy.x, enemy.y, '+2 AMMO')
        }

        // calculate enemy slowdown
        enemy.velInhibition *= projectile.power

        // spawn particles for regular
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
          
        // spawn particles for shrapnel
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
      
      // spawn particles for cannon
      if (projectile.type == 'cannon') {
        for (let i = 0; i < enemy.radius/8; i++) {
          particles.push(new Particle(
            (projectile.x + (Math.random()*20 - 10)), 
            (projectile.y + (Math.random()*20 - 10)), 
            (Math.random()*particleVariance/2 + (particleRadius - particleVariance/2)), 
            enemy.color, 
            { 
              x: Math.random()*8 - 4 , 
              y: Math.random()*8 - 4 ,
            },
            enemy,
            'particle'
            ))
        }
      }

      // spawn particles for explosive
      if (projectile.type == 'explosive') {
        for (let i = 0; i < enemy.radius/5; i++) {
          particles.push(new Particle(
            (projectile.x + (Math.random()*20 - 10)), 
            (projectile.y + (Math.random()*20 - 10)), 
            (Math.random()*particleVariance/2 + (particleRadius - particleVariance/2)), 
            explosionColor, 
            { 
              x: Math.random()*6 - 3 , 
              y: Math.random()*6 - 3 ,
            },
            enemy,
            'explosive'
            ))
        }
      }
      
      // spawn particles for machine
      if (projectile.type == 'machine') {
        for (let i = 0; i < enemy.radius/8; i++) {
          particles.push(new Particle(
            (projectile.x + (Math.random()*20 - 10)), 
            (projectile.y + (Math.random()*20 - 10)), 
            (Math.random()*particleVariance/2 + (particleRadius - particleVariance/2)), 
            enemy.color, 
            { 
              x: Math.random()*8 - 4 , 
              y: Math.random()*8 - 4 ,
            },
            enemy,
            'particle'
            ))
        }
      }
        

      // shrink enemy on hit by regular
      if (enemy.radius > minRadToKill && projectile.type == 'regular') {
        gsap.to(enemy, {radius: enemy.radius - projectile.damage, duration: 0.3})
        setTimeout(()=> {
          projectiles.splice(indexProj, 1);
        },0)
        updateScore('shrink-enemy')
      } 

      // hit by cannon
      if (projectile.type == 'cannon') {
        gsap.to(enemy, {radius: 1, duration: 0.3})
        projectile.life--
        projectile.velocity.x *= 1 - (enemy.radius/200 + 0.05)
        projectile.velocity.y *= 1 - (enemy.radius/200 + 0.05)
        if(projectile.life < 1) {
          projectile.dead = true
        }
        enemy.dead = true;
        // console.log(enemy)
        updateScore('kill-enemy')
      } 
      // hit by shrapnel
      if(projectile.type == 'shrapnel') {
        setTimeout(()=> {
          enemies.splice(indexEnemy, 1);
          projectiles.splice(indexProj, 1);
        },0)
        updateScore('kill-enemy')
        enemy.dead = true;
      }

      // hit by explosive
      if(projectile.type == 'explosive') {
        setTimeout(()=> {
          projectiles.splice(indexProj, 1);
        },0)
        explosions.push(new Explosion(projectile.x,projectile.y,explosionRadius, explosionColor))
        gsap.to(enemy,{color: explosionColor, duration: 1})
      }
      // hit by machine
      if(projectile.type == 'machine') {
        gsap.to(enemy, {radius: enemy.radius - projectile.damage, duration: 0.3})
        setTimeout(()=> {
          projectiles.splice(indexProj, 1);
        },0)
        updateScore('shrink-enemy')
        

        
      }
      
      // kill enemy if it's less than the minimum radius required to kill an enemy
      if(enemy.radius < minRadToKill) {
        //mark this enemy as dead to prevent accidentally deleting a different enemy while gsap.to() finishes
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
      // kill all enemies => enemy.dead == true
      if(enemy.dead == true) { //issue badness, terrible code, dead enemies should be removed at the end of each draw() cycle
        gsap.to(enemy,{radius: 1, duration: enemy.radius/30 , onComplete: () => {
          enemies.forEach((en, ind) => {
            if(en.dead == true) enemies.splice(ind,1)
        })}})
      }
      }
    })
    
    particles.forEach((particle, particleIndex) => {

      // draws a right triangle and calculates the distance between two points
      const distance = Math.hypot(particle.x - enemy.x,particle.y - enemy.y) 
        
      // when particle hits an enemy
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

          
          //decrease the enemy radius upon hit by shrapnel particle //issue, here it marks the enemy for destruction when he is hit by ANY SINGLE shrapnel particle, or maybe it's fine
          enemy.destroy = true;
          enemy.velInhibition *= particle.power
          gsap.to(enemy, {radius: enemy.radius - 5, duration: 0.1, onComplete:()=> {
            if(enemy.radius <= 10) {
              gsap.to(enemy, {radius: 1, duration: 0.1, onComplete:()=> {
                enemies.forEach((enemyy, indexx)=>{
                  if(
                    enemyy.destroy == true && 
                    enemyy.radius < 5
                    ) {
                    enemies.splice(indexx,1)
                    // console.log(enemyy)
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

  //explosions mechanic
  explosions.forEach((explosion, explIndex)=>{

    if(explosion.life < 1) { //important, object deletion is now happening at the end of draw(), so globalAlpha may frequently break and cause objects to flash
      explosion.dead = true
      if(debug) console.log('Explosion marked dead.')
      if(debug) console.log(explosion)
      return
    }

    let playerDistance = Math.hypot(explosion.x - (player.x - player.radius),explosion.y - (player.y - player.radius))
    if(playerDistance <= explosion.radius) {
      player.damage()
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

    // check for collision with other asteroids 
    //issue 
    //inefficient -- should really implement only checking against two asteroids once, reduces comp. intensity by 50%
    asteroids.forEach((ast,astInd)=> {  // this collision detection is x^2 performance-wise, where x = number of asteroids
      if(ast.id == asteroid.id) return

      let distance = Math.hypot(ast.x - asteroid.x,ast.y - asteroid.y) 

      //important, this -> 3 number is the actual asteroid hitbox
      if(distance < ast.spriteDim.x/3 + asteroid.spriteDim.x/3) { // if collision successful 

        if(ast.stuckTimer > 0) {
          ast.stuckTimer--
        } else {
          ast.stuck = true
        }
        if(asteroid.stuckTimer > 0) {
          asteroid.stuckTimer--
        } else {
          asteroid.stuck = true
        }

        ast.stuckInside = asteroid.id
        asteroid.stuckInside = ast.id

        var velTotal = {
          x: (ast.velocity.x + asteroid.velocity.x),
          y: (ast.velocity.y + asteroid.velocity.y),
        }

        if(ast.stuck + asteroid.stuck < 1) {
          // console.log(ast.stuck + asteroid.stuck)
          // console.log("Stuck timer: " + ast.stuckTimer + ' ' + asteroid.stuckTimer)
          velTotal.x -= (ast.velocity.x + asteroid.velocity.x)*asteroid.velAbsorb
          velTotal.y -= (ast.velocity.y + asteroid.velocity.y)*asteroid.velAbsorb
          // console.log('reducing velocity')
        }
        

        ast.velocity.x = velTotal.x/2
        ast.velocity.y = velTotal.y/2
        asteroid.velocity.x = velTotal.x/2
        asteroid.velocity.y = velTotal.y/2
        
      }
      // if the same collision isn't true anymore for 3 whole frames
      else if(
        distance > ast.spriteDim.x/3 + asteroid.spriteDim.x/3 &&
        ast.stuck && 
        asteroid.stuck &&
        ast.stuckInside == asteroid.id &&
        asteroid.stuckInside == ast.id
      ) { 
        
        if(ast.stuckTimer < 3) {
          ast.stuckTimer++
        } else {
          ast.stuck = false
          ast.stuckInside = null
        }
        if(asteroid.stuckTimer < 3) {
          asteroid.stuckTimer++
        } else {
          asteroid.stuck = false
          asteroid.stuckInside = null
        }
      }
    })

    // check if player touching asteroid
    /*
    let distance = Math.hypot(player.x - asteroid.x,player.y - asteroid.y)
    // when player collides with asteroid
    if(
      distance < player.radius + asteroid.spriteDim.x/2 && //issue player radius is still being used to detect collision
      !dodgeDir
      ) { 
        
      if(asteroid.stuckTimer > 0) {
        asteroid.stuckTimer--
      } else {
        asteroid.stuck = true
      }
      if(player.stuckTimer > 0) {
        player.stuckTimer--
      } else {
        player.stuck = true
        // if(debug) console.log('Player stuck.')
      }

      asteroid.stuckInside = player.id
      player.stuckInside = asteroid.id

      var velTotal = {
        x: (asteroid.velocity.x + player.velocity.x),
        y: (asteroid.velocity.y + player.velocity.y),
      }

      // calculate the balance which will determine how much of the velTotal will each receive based on mass of the two colliding entities
      var playerBalance = asteroid.mass / player.mass //issue ,this is a super janky way to write this, it could be just a few lines
      var asteroidBalance =  player.mass / asteroid.mass 
      
      var min = Math.min(playerBalance,asteroidBalance)
      
      playerBalance = 1 - min
      asteroidBalance = min

      // if(debug) console.log(playerBalance + ' ' + asteroidBalance)

      if(!asteroid.stuck && !player.stuck) {

        velTotal.x -= (asteroid.velocity.x + player.velocity.x)*asteroid.velAbsorb
        velTotal.y -= (asteroid.velocity.y + player.velocity.y)*asteroid.velAbsorb
        
      }

      if(
        player.invulnerable == false && 
        (Math.abs(velTotal.x) + Math.abs(velTotal.y)) > player.impactResist &&
        !player.stuck
      ) {
          player.damage()
      }

      asteroid.velocity.x = velTotal.x/2
      asteroid.velocity.y = velTotal.y/2
      player.velocity.x = velTotal.x/2
      player.velocity.y = velTotal.y/2
    }

    // player unstuck code
    // if the same collision isn't true anymore for 3 whole frames
    else if(
      distance > asteroid.spriteDim.x/2 + player.radius &&
      asteroid.stuck && 
      player.stuck &&
      //important - because asteroids can only be stuck inside 1 object as of now, a check must be made whether either the asteroid is stuck inside player
      // or the player is stuck inside the asteroid
      asteroid.stuckInside == player.id ||
      player.stuckInside == asteroid.id
    ) { 
      
      if(asteroid.stuckTimer < 3) {
        asteroid.stuckTimer++
      } else {
        asteroid.stuck = false
        asteroid.stuckInside = null
      }
      if(player.stuckTimer < 3) {
        player.stuckTimer++
      } else {
        player.stuck = false
        console.log('Player not stuck.')
        player.stuckInside = null
      }
    }
    // ↑↑↑↑ end of player stuck code
    */

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

      }
    })
  })
  //end of asteroid collision mechanic //deprecated?

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

    // check for collision with other debris
    debriss.forEach((deb,debInd)=> {  // this collision detection is x^2 performance-wise, where x = number of debris
      if(deb.id == debris.id) return

      let distance = Math.hypot(deb.x - debris.x,deb.y - debris.y) 

    


      if(distance < deb.spriteDim.x/3 + debris.spriteDim.x/3) { // if collision successful

        if(deb.stuckTimer > 0) {
          deb.stuckTimer--
        } else {
          deb.stuck = true
        }
        if(debris.stuckTimer > 0) {
          debris.stuckTimer--
        } else {
          debris.stuck = true
        }

        deb.stuckInside = debris.id
        debris.stuckInside = deb.id

        var velTotal = {
          x: (deb.velocity.x + debris.velocity.x),
          y: (deb.velocity.y + debris.velocity.y),
        }

        if(deb.stuck + debris.stuck < 1) {
          // console.log(ast.stuck + asteroid.stuck)
          // console.log("Stuck timer: " + ast.stuckTimer + ' ' + asteroid.stuckTimer)
          velTotal.x -= (deb.velocity.x + debris.velocity.x)*debris.velAbsorb
          velTotal.y -= (deb.velocity.y + debris.velocity.y)*debris.velAbsorb
          // console.log('reducing velocity')
        }
        

        deb.velocity.x = velTotal.x/2
        deb.velocity.y = velTotal.y/2
        debris.velocity.x = velTotal.x/2
        debris.velocity.y = velTotal.y/2

        // ast.canCollide = false
        // asteroid.canCollide = false

        
      }
      else // if the same collision isn't true anymore for 3 whole frames
      if(
        distance > deb.spriteDim.x/3 + debris.spriteDim.x/3 &&
        deb.stuck && 
        debris.stuck &&
        deb.stuckInside == debris.id &&
        debris.stuckInside == deb.id
      ) { 
        
        if(deb.stuckTimer < 3) {
          deb.stuckTimer++
        } else {
          deb.stuck = false
          deb.stuckInside = null
        }
        if(debris.stuckTimer < 3) {
          debris.stuckTimer++
        } else {
          debris.stuck = false
          debris.stuckInside = null

        }
      }

      
    })

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
          (Math.abs(velTotal.x) + Math.abs(velTotal.y)) > player.impactResist) 
        { 
          player.damage()
        }
        // console.log(Math.abs(velTotal.x) + Math.abs(velTotal.y))
        
        // console.log('Velocity total - x: '+ velTotal.x + ' ' + 'y: '+ velTotal.y)

        player.velocity.x = velTotal.x/2 - velTotal.x/25 
        player.velocity.y = velTotal.y/2 - velTotal.y/25
        debris.velocity.x = velTotal.x/2 + velTotal.x/25
        debris.velocity.y = velTotal.y/2 + velTotal.y/25

        // basically, im giving more energy to the projectile from this collision, this implies that it is lighter than the ship
        // by this logic i can calculate impacts differently based on the colliding objects mass or density
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

      }
    })
  })
  



  

  



  
  
  // optimizations
  if(particles.length > 60) {
    while(particles.length > 60) {
      particles.shift()
      if(debug) console.log('Removed particle.')
    }
  }
  


  //cleanup  //important //objects outside bounds or objects marked as dead are removed here

  //debug, so far i have not yet defined the boundary beyond which objects like asteroids or debris disappear, therefore they are not going to be removed if off-screen
  // asteroids.forEach((asteroid,index)=> {
  //   if(
  //     asteroid.x > cw + asteroid.spriteDim.x || 
  //     asteroid.x < 0 - asteroid.spriteDim.x  || 
  //     asteroid.y > ch + +asteroid.spriteDim.y  || 
  //     asteroid.y < 0 - asteroid.spriteDim.y 
  //   ) {
  //     asteroids.splice(index,1)
  //     objects_all.splice(objects_all.indexOf(asteroid),1)
  //     objects_collidable.splice(objects_collidable.indexOf(asteroid),1)
  //   }
  // })
  // debriss.forEach((debris,index)=> {
  //   if(
  //     debris.x > cw + debris.spriteDim.x || 
  //     debris.x < 0 - debris.spriteDim.x  || 
  //     debris.y > ch + +debris.spriteDim.y  || 
  //     debris.y < 0 - debris.spriteDim.y 
  //   ) {
  //     debriss.splice(index,1)
  //     objects_all.splice(objects_all.indexOf(debris),1)
  //     objects_collidable.splice(objects_collidable.indexOf(debris),1)
  //   }
  // })

  projectiles.forEach((p,ind)=> {
    if(p.dead == true) {
      projectiles.splice(ind,1)
    }
  })
  laserbeams.forEach((beam,ind)=> {
    if(beam.dead == true) {
      laserbeams.splice(ind,1)
    }
  })
  projectileGhosts.forEach((p,ind)=> {
    if(p.dead == true) {
      projectileGhosts.splice(ind,1)
    }
  })
  explosions.forEach((explosion,ind)=> {
    if(explosion.dead) {
      explosions.splice(ind,1)
    }
  })
  //issue, there might be a something that breaks eventually, since particles are not using particle.dead cleanup, simply alpha == 0 cleanup
   particles.forEach((particle, index) => { 
    if(particle.alpha < 1) { // okay so particles need to be removed before their alpha reaches 0 because then they may flash when ctx.globalAlpha goes below 0
        particles.splice(index,1)
    }
  })

  ghosts.forEach((ghost,ind)=> {
    if(ghost.alpha <= 0) {
      ghosts.splice(ind,1)
    }
  })


  //draw everything here

  //simple camera logic
  if(useCamera) {
    camera.x = player.x - cw/2
    camera.y = player.y - ch/2
    camera.w = cw
    camera.h = ch
    
    // if(debug) console.log('Context translated to: x: ' + camera.x + ' y: ' + camera.y)
    // if(debug) console.log('Player x: ' + player.x + ' y: ' + player.y)
    ctx.save()
    ctxBg.save()
    ctx.translate(-camera.x, -camera.y)
    ctxBg.translate(-camera.x, -camera.y)
    
    ctx.clearRect(camera.x,camera.y,cw,ch)
    drawBackground()

    //camera pos
    ctx.strokeStyle = 'hsla(0,0%,100%,0.25)';
    ctx.lineWidth = 8
    ctx.strokeRect(camera.x,camera.y,cw,ch)

    // draw rect from 0,0 to cw,ch
    ctx.strokeStyle = 'hsla(45,100%,70%,0.25)';
    ctx.lineWidth = 6
    ctx.strokeRect(1,1,cw - 1,ch - 1)
    
  } else {
    ctx.clearRect(0,0,cw,ch)
    drawBackground()    
  }

  ctx.lineWidth = 2
  ctx.strokeStyle = 'hsla(0,90%,20%,0.5)'
  for (let i = 0; i < bgrid.gridnum; i++) {
    for (let j = 0; j < bgrid.gridnum; j++) {
      ctx.strokeRect(bgrid.x + i*bgrid.cellsize, bgrid.y + j*bgrid.cellsize,bgrid.cellsize,bgrid.cellsize)
    }
  }

  particles.forEach(particle => {
    particle.draw()
  })
  laserbeams.forEach(beam => {
    beam.draw()
  })
  dockingStations.forEach(station => {
    station.draw()
  })
  projectiles.forEach(proj => {
    proj.drawGhosts()
    proj.draw()
  })

  enemyProjectiles.forEach(proj => {
    // this.drawGhosts() // unfinished
    proj.draw();
  })
  enemies.forEach(enemy => {
    enemy.draw()
  })
  enemyships.forEach(ship => {
    ship.draw()
  })

  asteroids.forEach(ast => {
    ast.draw()
  })
  debriss.forEach(debris => {
    debris.draw()
  })

  //player drawing

  ghosts.forEach((ghost, index) => {
    ghost.draw()
  })
  
  if(pressedShift) {
    player.displayDodgeRange()
  }

  player.displayDodgePreview()

  player.applyMatrix()
  player.draw()
  player.restoreMatrix()

  // bullet fire anim
  if(fired) {
    drawTurretFire();
    // clearTimeout(firedTimer);
    firedTimer = setTimeout(()=>{
      fired = false
    },100)
  }

  explosions.forEach(explosion => {
    explosion.draw()
  })
  
  
  if(dodgePosVisible == true && !pressedShift) {
    windup = 0;
    dodgePosVisible = false
  }
  
  // draw UI components
  
  
  overlaysInfo.forEach((overlay, index) => {
    overlay.update()
    if(overlay.dead == true) {
      overlaysInfo.splice(index,1)
    }
  })
  deadShipDialogs.forEach(dialog => {
    dialog.update()
  })
  
  // code that lights up arrows based on player proximity
  arrows.forEach(arrow=>{
    let dist = Math.hypot(
      player.x -
      +arrow.dataset.x,
      player.y -
      +arrow.dataset.y
      )
      
      if(dist < 160) {
        arrow.classList.add('close')
      }
      else {
        arrow.classList.remove('close')
      }
    })


  if(debug) {
    ctx.save()
    ctx.fillStyle = 'white'
    ctx.font = '18px Arial'
    ctx.fillText('Objects_collidable: ' + objects_collidable.length,camera.x + 10,camera.y + 70)
    ctx.fillText('Particles: ' + particles.length,camera.x + 10,camera.y + 90)
    ctx.restore()
  }

  // collision detection prototype
  //update grid_pos for all collidable objects first
  objects_collidable.forEach((obj)=>{
    obj.grid_pos = {
      x: Math.floor(obj.x / bgrid.cellsize),
      y: Math.floor(obj.y / bgrid.cellsize),
    }
  }) 
    
  objects_collidable.forEach((obj)=>{
    detectBroad(obj)
  }) 
    
  

  //restore the camera position
  if(useCamera) {
    ctx.restore()
    ctxBg.restore()
  }


  drawId = requestAnimationFrame(draw)
  if(gameover) cancelAnimationFrame(drawId);
}
// ↑↑↑↑↑↑ end of main draw()


function drawTurretFire() {
  ctx.beginPath()
  ctx.arc(player.x,player.y,10,0, pi*2, false)
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


// utility functions 



// polygon objects are an array of vertices forming the polygon
//     var polygon1=[{x:100,y:100},{x:150,y:150},{x:50,y:150},...];
// The polygons can be both concave and convex
// return true if the 2 polygons are colliding 

function polygonsCollide(p1,p2){
  // turn vertices into line points
  var lines1=verticesToLinePoints(p1);
  var lines2=verticesToLinePoints(p2);
  // test each poly1 side vs each poly2 side for intersections
  for(i=0; i<lines1.length; i++){
  for(j=0; j<lines2.length; j++){
      // test if sides intersect
      var p0=lines1[i][0];
      var p1=lines1[i][1];
      var p2=lines2[j][0];
      var p3=lines2[j][1];
      // found an intersection -- polys do collide
      if(lineSegmentsCollide(p0,p1,p2,p3)){return(true);}
  }}
  // none of the sides intersect
  return(false);
}
// helper: turn vertices into line points
function verticesToLinePoints(p){
  // make sure polys are self-closing
  if(!(p[0].x==p[p.length-1].x && p[0].y==p[p.length-1].y)){
      p.push({x:p[0].x,y:p[0].y});
  }
  var lines=[];
  for(var i=1;i<p.length;i++){
      var p1=p[i-1];
      var p2=p[i];
      lines.push([ 
          {x:p1.x, y:p1.y},
          {x:p2.x, y:p2.y}
      ]);
  }
  return(lines);
}
// helper: test line intersections
// point object: {x:, y:}
// p0 & p1 form one segment, p2 & p3 form the second segment
// Get interseting point of 2 line segments (if any)
// Attribution: http://paulbourke.net/geometry/pointlineplane/
function lineSegmentsCollide(p0,p1,p2,p3) {
  var unknownA = (p3.x-p2.x) * (p0.y-p2.y) - (p3.y-p2.y) * (p0.x-p2.x);
  var unknownB = (p1.x-p0.x) * (p0.y-p2.y) - (p1.y-p0.y) * (p0.x-p2.x);
  var denominator  = (p3.y-p2.y) * (p1.x-p0.x) - (p3.x-p2.x) * (p1.y-p0.y);        

  // Test if Coincident
  // If the denominator and numerator for the ua and ub are 0
  //    then the two lines are coincident.    
  if(unknownA==0 && unknownB==0 && denominator==0){return(null);}

  // Test if Parallel 
  // If the denominator for the equations for ua and ub is 0
  //     then the two lines are parallel. 
  if (denominator == 0) return null;

  // test if line segments are colliding
  unknownA /= denominator;
  unknownB /= denominator;
  var isIntersecting=(unknownA>=0 && unknownA<=1 && unknownB>=0 && unknownB<=1)

  return(isIntersecting);
}


// calculate line and circle intersection
// [x0,y0] to [x1,y1] define a line segment
// [cx,cy] is circle centerpoint, cr is circle radius 
function isCircleSegmentColliding(x0,y0,x1,y1,cx,cy,cr){

  // calc delta distance: source point to line start
  var dx=cx-x0;
  var dy=cy-y0;

  // calc delta distance: line start to end
  var dxx=x1-x0;
  var dyy=y1-y0;

  // Calc position on line normalized between 0.00 & 1.00
  // == dot product divided by delta line distances squared
  var t=(dx*dxx+dy*dyy)/(dxx*dxx+dyy*dyy);

  // calc nearest pt on line
  var x=x0+dxx*t;
  var y=y0+dyy*t;
  
  // clamp results to being on the segment
  if(t<0){x=x0;y=y0;}
  if(t>1){x=x1;y=y1;}

  return( (cx-x)*(cx-x)+(cy-y)*(cy-y) < cr*cr );
}

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
  if (currentAmmoType == 'cannon') return 'hsl(221, 100%, 80%)'
  if (currentAmmoType == 'explosive') return 'hsl(4,89%,45%)'
  if (currentAmmoType == 'machine') return 'hsl(221, 100%, 80%)'
}

function calcHypotenuse(a, b) {
  return (Math.sqrt((a * a) + (b * b)));
}

function start(options) {
  if(options.debug) {
    debug = true
    setOnclickForArrowsTo(true)
  }
  if(options.useCamera) useCamera = true
  console.log('Called start().')
  drawBackground()
  closeModal();
  dialogContainer.style.display = ''
  toggleShipSelection()
}
function endGame() {
  gameover = true;
  clearInterval(machineTimer);
  openModal('gameover')
}

function pause() {
  console.log('Called pause().')
  if(!paused) {
    cancelAnimationFrame(drawId)
    clearInterval(machineTimer);
  }
  if(paused) {
    draw()
  }
  paused = !paused
}

//keydown
document.addEventListener('keydown', processKeydown, false)

function processKeydown(e) {
  if(e.code == 'Digit1') {
    debug = !debug
  }
  if(e.code == 'Digit2' ) {
    start();
  }
  if(e.code == 'Digit3' ) {
    pause()
  }
  if(e.code == 'KeyE') {
    console.log('Interact.')
    new InfoPopup(player.x,player.y - 50, 'Interact with (E)')
  }
  if(e.code == 'KeyF' ) {
    detonate()
  }
  if(e.code == 'KeyM' ) {
    openMenu(sectorMapGUI)
  }
  if(e.code == 'KeyI' ) {
    openMenu(inventoryGUI)
  }
  if(inventoryOpen) {
    console.log('Terminated processKeydown(e) due to inventoryOpen == true.')
    return
  }

  if(e.code == 'KeyR' ) {
    player.toggleShields()
  }
  if(e.code == 'KeyT' ) {
    let arrow = arrows.find(ar => ar.classList.contains('close'))
    if(arrow) {
      travel(arrow.dataset.direction)
    } 
    else {
      new InfoPopup(centerX,centerY, 'Cannot travel, not near a portal.')
    }
  }

  if(e.code == 'ShiftLeft') {
    pressedShift = true
  }
  if(e.code == 'ControlLeft') {
    pressedCtrl = true
  }

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
  }
  if(e.code == 'ControlLeft') {
    pressedCtrl = false
  }
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

function dodgeFinish() {
  dodgeDir = null;
  player.invulnerable = false;
  player.dodging = false
  playerMoved = false; //issue bad variable, should be stored inside of player
  windup = 0;
}

function displayDodgePositions() {
  console.log('Deprecated. Why is this getting called?')
  dodgePosVisible = true;
  if(windup < 48) windup += 8
  ctx.save()
  ctx.globalAlpha = windup / 100
  if(dodgeDir) ctx.globalAlpha *= 0.7
  ctx.strokeStyle = 'white'
  ctx.lineWidth = 2.5
  ctx.fillStyle = 'white';
  //left
  ctx.beginPath();
  ctx.arc(
    player.x - player.dodgeDistance,
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
    player.x + player.dodgeDistance,
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
    player.y - player.dodgeDistance,
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
    player.y + player.dodgeDistance,
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
    player.x - (player.dodgeDistance / 1.414),
    player.y - (player.dodgeDistance / 1.414),
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
    player.x - (player.dodgeDistance / 1.414),
    player.y + (player.dodgeDistance / 1.414),
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
    player.x + (player.dodgeDistance / 1.414),
    player.y - (player.dodgeDistance / 1.414),
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
    player.x + (player.dodgeDistance / 1.414),
    player.y + (player.dodgeDistance / 1.414),
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

function gainCurrency(source) {
  amt = +source.dataset.lootamt
  player.currency += amt
  if(debug) console.log('Gained currency: ' + amt)
  new InfoPopup(player.x, player.y - 50, `Gained ${amt} currency.`)
  source.remove()
}
function acquireItem(itemKey,source) {
  player.inventory.push(items[itemKey])
  if(debug) console.log('Item acquired: ' + itemKey)
  new InfoPopup(player.x, player.y - 50, `Acquired item: ${items[itemKey].title}.`)
  if(source) source.remove()
}
function gainAmmo(type) {
  if(type == 'regular') {
    ammoRegular++
  }
  calcAmmoTotal()
  updateAmmoVisual();
}
function calcAmmoTotal() {
  ammoTotal = ammoRegular + ammoShrapnel + ammoCannon + ammoExplosive + ammoMachine
}

//UI functionality

function toggleShipSelection() {
  console.log('Called toggleShipSelection().')

  shipSelectCont.classList.toggle('hidden')
}

function chooseShip(key) { //important
  if(key in ships) {
    player = new Ship(centerX, centerY, 0, ships[key]) 
    toggleShipSelection()
    init()
  }
  else console.log('Invalid ship key entered.')
}

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
  sectorMapGUI.classList.toggle('hidden')
  mapIcon.classList.toggle('selected')
  
  inventory.classList.add('hidden')
  invIcon.classList.remove('selected')

  inventoryOpen = false
  mapOpen = !mapOpen
}


function openMenu(menu) {
  if(debug) console.log(menu)
  menuCont.classList.remove('hidden')
  let ind = menus.indexOf(menu)

  menus.forEach(menu => {
    if(menus[ind] == menu) {
      menu.classList.toggle('hidden')
      return
    }
    else {
      menu.classList.add('hidden')
    }
  })
  if(menus.find(menu => !menu.classList.contains('hidden')) == undefined) { //basically check if all menus are hidden
    menuCont.classList.add('hidden')
    console.log('hiding the menuCont')
  }
  // console.log('openMenu(): Opened menu:' + ind)
}

function updateScoreVisual() {
  // if(debug) console.log('updateScoreVisual: deprecated.') 
  // return
  scoreTop.innerHTML = score;
}
function updateAmmoVisual() {
  ammoSpriteRegular.classList.remove('selected')
  ammoSpriteShrapnel.classList.remove('selected')
  ammoSpriteCannon.classList.remove('selected')
  ammoSpriteExplosive.classList.remove('selected')
  ammoSpriteMachine.classList.remove('selected')

  if(currentAmmoType == 'regular') {
    ammoSpriteRegular.classList.add('selected')
  }
  if(currentAmmoType == 'shrapnel') {
    ammoSpriteShrapnel.classList.add('selected')
  }
  if(currentAmmoType == 'cannon') {
    ammoSpriteCannon.classList.add('selected')
  }
  if(currentAmmoType == 'explosive') {
    ammoSpriteExplosive.classList.add('selected')
  }
  if(currentAmmoType == 'machine') {
    ammoSpriteMachine.classList.add('selected')
  }
  dispAmmoRegular.innerHTML = ammoRegular;
  dispAmmoShrapnel.innerHTML = ammoShrapnel;
  dispAmmoCannon.innerHTML = ammoCannon;
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
    currentAmmoType = 'cannon';
    updateAmmoVisual();
  }
  else if(currentAmmoType == 'cannon') {
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
      currentAmmoType = 'cannon';
      updateAmmoVisual();
    }
    else if(currentAmmoType == 'cannon') {
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

function displayPopup(arg, x, y, text = "You did not specify text (argument).") {
  console.log('displayPopup(): deprecated. Error somewhere.')
  if(arg == 'plus-ammo') {
    var info = new InfoPopup(x, y, '+2 AMMO')
  }
  if(arg == 'acquire-item') {
    var info = new InfoPopup(x, y, '+2 AMMO')
  }
}

function detonate() {
  projectiles.forEach((projectile,index)=> {
    if(projectile.type == 'explosive') {
      explosions.push(new Explosion(projectile.x,projectile.y,explosionRadius, explosionColor))
      projectile.dead = true
    }
  })
}


class Room {
  constructor(x,y,index,type,left,right,top,bottom,w = 6000, h = 4000) {
    this.x = x
    this.y = y
    this.index = index
    this.type = type
    this.w = w
    this.h = h
    // essentially if a side == portal, you can travel that direction, direction determines the x and y of the next room, left means x = x -1, y = y etc....
    this.left = left 
    this.right = right
    this.top = top
    this.bottom = bottom
    this.objective = null
    this.cleared = false;
    
    this.contents = []
    this.dialog = null
  }
  spawnAsteroid() {
    console.log('room.spawnAsteroid(): Room method that might get called based on type of room and type of content it houses.')
    console.log('Simplified asteroid spawning for testing purposes.')
    asteroids.push(new Asteroid(0,0,0,{x: 0.2, y: 0.7},'basic'))
  }
  update() {
    console.log('This method will operate the whole room logic, update internal clocks and call methods of the room.')
  }
}

class Room_Asteroid extends Room { // not use this
  constructor(x,y,index,type,left,right,top,bottom) {
    super(x,y,index,type,left,right,top,bottom)
    this.x = x
    this.y = y
    this.index = index
    this.type = type

    this.left = left
    this.right = right
    this.top = top
    this.bottom = bottom
    this.objective = null
    this.cleared = false;
    this.contents = []
    this.dialog = null
    console.log('Warning: Do not use this class, so far it isnt finished')
  }
}

class Sector {
  constructor(number) {
    this.number = number
  }
}


let sectorIndex = 0
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
  
  var roomNum = Math.abs(Math.round(Math.random() * 4 - 0.5)) + 6 // room index is only incremented after generating the 2nd room, due to how indexing works in JS
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

    var room = document.createElement('div');
    room.classList.add('room', 'empty');

    var tooltip = document.createElement('div')
    tooltip.classList.add('room-tooltip')

    room.append(tooltip)
    sectorMapGUI.append(room);

  }
  // add additional rooms inside them?????? //issue, this is stupid, it all has to be connected with rooms[], the class Room needs to contain the visual, and the visual needs to contain the populated rooms
  // it's simply dumb to reference and update multiple unconnected arrays and objects and variables
  for (let i = 0; i < rooms.length; i++) {

    var index = (rooms[i].x + 0) + (rooms[i].y + 0) *8

    sectorMapGUI.childNodes[index].dataset.x = rooms[i].x
    sectorMapGUI.childNodes[index].dataset.y = rooms[i].y
    sectorMapGUI.childNodes[index].onclick = teleport

    
    sectorMapGUI.childNodes[index].classList.replace('empty','filled')
  }
  
  
}

let roomTypes = {
  docking_station: {
    permittedContent: [
      'docking_station',
      'debris_small',
    ],
    max_per_sector: 1,
  },
  asteroid_belt: {
    permittedContent: [
      'asteroids',
      'asteroids_drifting',
    ],
    max_per_sector: 1,
  },
}

let roomCont = {
  asteroids: {
    count: 10,
    load() {
      distributeObjects('asteroid', this.count)
    }
  },
  enemy_ship: {
    count: 1,
    load() {
      spawnEnemyShip()
    }
  },
  debris_small: {
    count: 3,
    count_min: 1,
    count_max: 3,
    load() {
      distributeObjects('debris',this.count)
    }
  },
  debris_field: {
    count: 15,
    load() {
      distributeObjects('debris',this.count)
    }  
  },
  empty: {
    load() {

    }
  },
  docking_station: {
    count: 1,
    load() {
      spawnDockingStation()
    }
  },
}

let roomContSpecial = {
  game_intro: {
    max_per_sector: 1,
    load () {

    }
  }
}

function randomPropertyFrom(obj) {
  var keys = Object.keys(obj);
  return obj[keys[ keys.length * Math.random() << 0]];
}

function generateRooms() {

  rooms.forEach((room,index)=> {
    if(room.type == 'entrance' && sectorIndex == 0) {
      room.contents.push(roomContSpecial['game_intro'])
      room.dialog = dialogs['game_intro']
    }
    
    // if(room.type == 'normal') {
    //   var rand = Math.round(Math.random()*roomCont.length - 0.5)
    //   if(rand >= roomCont.length) {
    //     rand = roomCont.length - 1
    //     console.log('Corrected bad math for room generation. Pls fix.')
    //   }
    //   room.contents.push(roomCont[rand])
    //   room.dialog = randomPropertyFrom(dialogs)
    // }
    if(room.type == 'normal') {
      room.contents.push(randomPropertyFrom(roomCont))
      room.dialog = randomPropertyFrom(dialogs)
  }
    
  })

}

function initSectorVars() {
  rooms = []
  currRoom = null
  roomIndex = 0
}

function clearMap() {
  sectorMapGUI.innerHTML = '' //issue // this is bad code, this will break if i add anything to the sector map
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

function travel(dir) {
  if(player.stuck) {
    console.log('Player stuck!! Player stuck!!!!!! Unable to travel.')
    return
  }
  
  // clear room
  clearRoom()

  var destination
  if(dir == 'left') {
    destination = rooms.find(
      room => 
      room.x == currRoom.x - 1 && 
      room.y == currRoom.y
    )
  }
  if(dir == 'right') {
    destination = rooms.find(
      room => 
      room.x == currRoom.x + 1 && 
      room.y == currRoom.y
    )
  }
  if(dir == 'up') {
    destination = rooms.find(
      room => 
      room.x == currRoom.x && 
      room.y == currRoom.y - 1
    )
  }
  if(dir == 'down') {
    destination = rooms.find(
      room => 
      room.x == currRoom.x && 
      room.y == currRoom.y + 1
    )
  }


  if(!destination) {
    console.log('There is no room over there.')
    return
  }
  player.stuck = false
  spawnPlayer(dir)
  currRoom = destination
  console.log('Traveled to room: ' + currRoom.x + ' ' + currRoom.y)
  console.log(currRoom)
  updateRoomDebugVisual()
  updateArrows()
  updateMapVisual(currRoom)
  loadRoom(currRoom)
  console.log('|--traveled--|')
}

function spawnPlayer(dir) {
  if(dir == 'left') {
    player.x = cw - player.radius*4
    player.y = centerY
  }
  if(dir == 'right') {
    player.x = 0 + player.radius*4
    player.y = centerY
  }
  if(dir == 'up') {
    player.x = centerX
    player.y = ch - player.radius*4
  }
  if(dir == 'down') {
    player.x = centerX
    player.y = 0 + player.radius*4
  }
}

function jump() {
  // this could be the new feature, of jumping several rooms but consuming 1 unit of U235
}

function teleport() { //debug // this is mostly a debug feature, it probably won't make it into the game, i like the linear travel, this feels cheaty
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

let dialogs = {
  game_intro: {
    text: `
        The princess of the ruling council of Draco II had gone missing. 
    
        Your mission is to locate her and transport her safely back to the council.
    
        She could be anywhere in the near galactic cluster...
        
    `
  },
  empty_1: {
    text: `
        There is nothing in this part of the sector. Just some space dust and you... Romantic
        
    `
  },
  empty_2: {
    text: `
        This part of space is just as empty as your close friends circle after leaving high school.
        
    `
  },
  empty_3: {
    text: `
        Nothing here, not a thing, zero, nil, nowt, damn all not a sausage sweet Fanny Adams.
        
    `
  },
  asteroid_1: {
    text: `
        You've encountered a dense asteroid field. Be careful here.
        
    `
  },
  debris_field: {
    text: `
        It seems as if a battle took place here recently, or a ship crashed somewhere nearby. Perhaps you could search around.
        
    `
  },
}

function loadRoom(room) {
  // this function loads all content that should be inside a room when you travel there
  console.log('Loaded room at x: ' + room.x + ' y: ' + room.y)

  room.contents.forEach((content)=> {
    content.load()
  })
  
  if(room.dialog != null) {
    dialogsVisible.push(new Dialog(room.dialog.text))
  }
}
function clearRoom() {
  // ghosts = [] //issue bug, this causes some weird visual quirks
  projectiles = []
  particles = []
  enemies = []
  explosions = []
  enemyships = []
  enemyProjectiles = []
  asteroids = []
  debriss = []
  deadShipDialogs = []
  dockingStations = []
  dialogOverlay.innerHTML = ''
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

// drawBackground() //debug, this might not be here later on



function distributeDebris(total) {
  if(!total) var total = 3
  var num = 0
  while(num < total) {
    var x = Math.random()*cw
    var y = Math.random()*ch
    var rotation = Math.round(Math.random()*360)
    // var velocity = {
    //   x: 0,
    //   y: 0,
    // }
    var velocity = {
      x: Math.random()*2 - 1,
      y: Math.random()*2 - 1,
    }
    var types = debrisTypes
    var rand = Math.round(Math.random()*3 - 0.5)
    if(debug) console.log('Debris type set randomly to index of: ' + rand)
    debriss.push(new Debris(x, y, rotation, velocity, types[rand]))
    num++
  }
  
}

function distributeObjects(type, total, options = {static: false, overlap: false}) {
  if(!total) var total = 3
  let index = 0
  let dist_objects = []
  objects_all.forEach(obj=> dist_objects.push(obj))
  while(index < total) {
    let x = 
    centerX + 
    (Math.random()*cw - cw/2)

    let y = 
    centerX + 
    (Math.random()*ch - ch/2)

    let rotation = Math.random()*360

    let velocity;
    if(options.static == true) {
      velocity = {
        x: 0,
        y: 0,
      }
    } else {
      velocity = {
        x: Math.random()*2 - 1,
        y: Math.random()*2 - 1,
      }
    }

    let currentObject;
    
    if(type == 'asteroid') {
      currentObject = new Asteroid(x, y, rotation, velocity, 'basic')
    }

    if(type == 'debris') {
      let types = debrisTypes
      let rand = Math.round(Math.random()*3 - 0.5)
      currentObject = new Debris(x, y, rotation, velocity, types[rand])
    }
    

    let doesOverlap = true;

    //check against the dist_objects if there is any overlap
    if(index > 0) {

      while(doesOverlap) {
        doesOverlap = false
        dist_objects.forEach((obj) => {
          let dist = Math.hypot(currentObject.x - obj.x, currentObject.y - obj.y)
          // console.log('Current object radius: ' + currentObject.radius + ' checked object radius: ' + obj.radius)
          if(dist < currentObject.radius + obj.radius) {
            doesOverlap = true
          }
          
        })
        if(doesOverlap) {
          currentObject.x = Math.random()*cw

          currentObject.y = Math.random()*ch
        }

      }
    }

    dist_objects.push(currentObject)

    if(type == 'asteroid') {
      asteroids.push(currentObject)
    }
    if(type == 'debris') {
      debriss.push(currentObject)
    }
    index++
  }
  console.log('Distributed objects + total game objects count: ' + dist_objects.length)
}


// collision detection code



function detectBroad(target) {
  // for each object in objects_collidable - make adjacent grid cells to look for objects whose center lays in these cells
  
  let filtered_objects = objects_collidable.filter((obj) => 
    obj.grid_pos.x >= target.grid_pos.x - 1 &&
    obj.grid_pos.x <= target.grid_pos.x + 1 &&
    obj.grid_pos.y >= target.grid_pos.y - 1 &&
    obj.grid_pos.y <= target.grid_pos.y + 1 &&
    objects_collidable.indexOf(target) !== objects_collidable.indexOf(obj)
  )
  
  if(debug) filtered_objects.forEach(obj=> {
      ctx.beginPath()
      ctx.fillStyle = 'hsl(0,100%,50%)'
      ctx.arc(obj.x,obj.y,5,0,pi*2,false)
      ctx.fill()
      ctx.closePath()
  })

  filtered_objects.forEach(obj=> {
    detectCollision(obj,target)
  })
}


function hitboxCollision(obj1,obj2) {
  // if(
  //   box2.x1 > box1.x1 && box2.x1 < box1.x2 &&
  //   box2.x2 < box1.x2 && box2.x2 > box1.x1 &&
  //   box2.y1 > box1.y1 && box2.y1 < box1.y2 &&
  //   box2.y2 < box1.y2 && box2.y2 > box1.y1
  // ) {
  //   return true
  // }
  if(
    true
  ) {
    return true
  }
}

function calcBoxPosition(box) {
  
}

function detectCollision(obj1,obj2) {
  
  obj1.hitbox.forEach(box1=> {
    obj2.hitbox.forEach(box2=> {
      if(false) { //unfinished, plop in rectIntersect and test for hitbox components overlapping
        resolveCollision(obj1, obj2)
      }
      
    })
  })
  
}
// function detectCollision(obj1,obj2) {
//   let box_count = 0
//   obj1.hitbox.forEach(box1=> {
//     obj2.hitbox.forEach(box2=> {
//       if(hitboxCollision(obj1,obj2)) { //unfinished, plop in rectIntersect and test for hitbox components overlapping
//         // resolveCollision(obj1, obj2)
//       if(debug) console.log('Collision detected.')
        
//       }
//       box_count++
//     })
//   })
//   if(debug) console.log(box_count)
// }



// Last updated November 2011
// By Simon Sarris
// www.simonsarris.com
// my name @gmail.com
//
// Free to use and distribute at will
// So long as you are nice to people, etc

// Simple class for keeping track of the current transformation matrix

// For instance:
//    var t = new Transform();
//    t.rotate(5);
//    var m = t.m;
//    ctx.setTransform(m[0], m[1], m[2], m[3], m[4], m[5]);

// Is equivalent to:
//    ctx.rotate(5);

// But now you can retrieve it :)

// Remember that this does not account for any CSS transforms applied to the canvas

function Transform() {
  this.reset();
}

Transform.prototype.reset = function() {
  this.m = [1,0,0,1,0,0];
};

Transform.prototype.multiply = function(matrix) {
  var m11 = this.m[0] * matrix.m[0] + this.m[2] * matrix.m[1];
  var m12 = this.m[1] * matrix.m[0] + this.m[3] * matrix.m[1];

  var m21 = this.m[0] * matrix.m[2] + this.m[2] * matrix.m[3];
  var m22 = this.m[1] * matrix.m[2] + this.m[3] * matrix.m[3];

  var dx = this.m[0] * matrix.m[4] + this.m[2] * matrix.m[5] + this.m[4];
  var dy = this.m[1] * matrix.m[4] + this.m[3] * matrix.m[5] + this.m[5];

  this.m[0] = m11;
  this.m[1] = m12;
  this.m[2] = m21;
  this.m[3] = m22;
  this.m[4] = dx;
  this.m[5] = dy;
};

Transform.prototype.invert = function() {
  var d = 1 / (this.m[0] * this.m[3] - this.m[1] * this.m[2]);
  var m0 = this.m[3] * d;
  var m1 = -this.m[1] * d;
  var m2 = -this.m[2] * d;
  var m3 = this.m[0] * d;
  var m4 = d * (this.m[2] * this.m[5] - this.m[3] * this.m[4]);
  var m5 = d * (this.m[1] * this.m[4] - this.m[0] * this.m[5]);
  this.m[0] = m0;
  this.m[1] = m1;
  this.m[2] = m2;
  this.m[3] = m3;
  this.m[4] = m4;
  this.m[5] = m5;
};

Transform.prototype.rotate = function(rad) {
  var c = Math.cos(rad);
  var s = Math.sin(rad);
  var m11 = this.m[0] * c + this.m[2] * s;
  var m12 = this.m[1] * c + this.m[3] * s;
  var m21 = this.m[0] * -s + this.m[2] * c;
  var m22 = this.m[1] * -s + this.m[3] * c;
  this.m[0] = m11;
  this.m[1] = m12;
  this.m[2] = m21;
  this.m[3] = m22;
};

Transform.prototype.translate = function(x, y) {
  this.m[4] += this.m[0] * x + this.m[2] * y;
  this.m[5] += this.m[1] * x + this.m[3] * y;
};

Transform.prototype.scale = function(sx, sy) {
  this.m[0] *= sx;
  this.m[1] *= sx;
  this.m[2] *= sy;
  this.m[3] *= sy;
};

Transform.prototype.transformPoint = function(px, py) {
  var x = px;
  var y = py;
  px = x * this.m[0] + y * this.m[2] + this.m[4];
  py = x * this.m[1] + y * this.m[3] + this.m[5];
  return [px, py];
};



/**
 * Rotates coordinate system for velocities
 *
 * Takes velocities and alters them as if the coordinate system they're on was rotated
 *
 * @param  Object | velocity | The velocity of an individual particle
 * @param  Float  | angle    | The angle of collision between two objects in radians
 * @return Object | The altered x and y velocities after the coordinate system has been rotated
 */

 function rotate(velocity, angle) {
  const rotatedVelocities = {
      x: velocity.x * Math.cos(angle) - velocity.y * Math.sin(angle),
      y: velocity.x * Math.sin(angle) + velocity.y * Math.cos(angle)
  };

  return rotatedVelocities;
}

/**
* Swaps out two colliding particles' x and y velocities after running through
* an elastic collision reaction equation
*
* @param  Object | particle      | A particle object with x and y coordinates, plus velocity
* @param  Object | otherParticle | A particle object with x and y coordinates, plus velocity
* @return Null | Does not return a value
*/

function resolveCollision(obj1, obj2) {
  const xVelocityDiff = obj1.velocity.x - obj2.velocity.x;
  const yVelocityDiff = obj1.velocity.y - obj2.velocity.y;

  const xDist = obj2.x - obj1.x;
  const yDist = obj2.y - obj1.y;

  // Prevent accidental overlap of particles - so if they're running AWAY from each other, then no transform is applied anymore, that's genious
  if (xVelocityDiff * xDist + yVelocityDiff * yDist >= 0) {

      // Grab angle between the two colliding particles
      const angle = -Math.atan2(obj2.y - obj1.y, obj2.x - obj1.x);

      // Store mass in var for better readability in collision equation
      const m1 = obj1.mass;
      const m2 = obj2.mass;

      // Velocity before equation
      const u1 = rotate(obj1.velocity, angle);
      const u2 = rotate(obj2.velocity, angle);

      // Velocity after 1d collision equation
      const v1 = { 
        x: u1.x * (m1 - m2) / (m1 + m2) + u2.x * 2 * m2 / (m1 + m2), 
        y: u1.y 
      };
      const v2 = { 
        x: u2.x * (m1 - m2) / (m1 + m2) + u1.x * 2 * m2 / (m1 + m2), 
        y: u2.y 
      };

      // Final velocity after rotating axis back to original location
      const vFinal1 = rotate(v1, -angle);
      const vFinal2 = rotate(v2, -angle);

      // Swap particle velocities for realistic bounce effect
      obj1.velocity.x = vFinal1.x;
      obj1.velocity.y = vFinal1.y;

      obj2.velocity.x = vFinal2.x;
      obj2.velocity.y = vFinal2.y;
  }
}