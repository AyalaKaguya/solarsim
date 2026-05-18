import Konva from 'konva'
import { createSolarSystem, createPlayer } from './solarSystem.js'
import { InputSystem } from './input.js'
import { Camera } from './camera.js'
import { PhysicsSystem } from './physics.js'
import { CollisionSystem } from './collision.js'
import {
  FIXED_DT,
  MAX_STEP_DT,
  MAX_SIM_STEPS,
  THRUST_LEVELS,
  VEL_MAX_DISPLAY,
  VEL_ARROW_FRAC,
  ACCEL_MAX_DISPLAY,
  ACCEL_ARROW_FRAC,
  MIN_SCREEN_RADIUS_PLANET,
  MIN_SCREEN_RADIUS_SUN,
  MIN_SCREEN_RADIUS_PLAYER,
  C,
} from './constants.js'

export class GameEngine {
  constructor(stageElement) {
    this.stageWidth = window.innerWidth
    this.stageHeight = window.innerHeight

    this.stage = new Konva.Stage({
      container: stageElement,
      width: this.stageWidth,
      height: this.stageHeight,
    })

    this.gameLayer = new Konva.Layer()
    this.hudLayer = new Konva.Layer()
    this.stage.add(this.gameLayer)
    this.stage.add(this.hudLayer)

    this.physics = new PhysicsSystem()
    this.collision = new CollisionSystem()
    this.input = new InputSystem()
    this.camera = new Camera(this.stageWidth, this.stageHeight)

    this.objects = createSolarSystem()
    this.player = null
    this.nodeMap = new Map()

    this._initPlayer()

    this.input.attach(this.stage.container())

    window.addEventListener('resize', this._onResize.bind(this))

    this._lastTime = performance.now()

    this.velocityArrow = new Konva.Arrow({
      points: [0, 0, 0, 0],
      stroke: 'white',
      strokeWidth: 2,
      fill: 'white',
      pointerLength: 10,
      pointerWidth: 6,
      visible: false,
    })
    this.forceArrow = new Konva.Arrow({
      points: [0, 0, 0, 0],
      stroke: '#ff4444',
      strokeWidth: 2,
      fill: '#ff4444',
      pointerLength: 10,
      pointerWidth: 6,
      visible: false,
    })
    this.gameLayer.add(this.velocityArrow)
    this.gameLayer.add(this.forceArrow)

    this.hudTexts = {}
    const hudLines = [
      { key: 'speed', y: 16 },
      { key: 'force', y: 38 },
      { key: 'gamma', y: 60 },
      { key: 'thrust', y: 82 },
      { key: 'time', y: 104 },
      { key: 'zoom', y: 126 },
    ]
    for (const { key, y } of hudLines) {
      const t = new Konva.Text({
        x: 16,
        y,
        text: '',
        fontSize: key === 'zoom' ? 12 : 14,
        fill: key === 'zoom' ? '#666666' : '#d0d0d0',
        fontFamily: 'monospace',
      })
      this.hudTexts[key] = t
      this.hudLayer.add(t)
    }

    this._syncNodes()
    this._loop(performance.now())
  }

  _initPlayer() {
    const earth = this.objects.find(o => o.label === 'Earth')
    this.player = createPlayer(earth)
    this.objects.push(this.player)
  }

  _onResize() {
    this.stageWidth = window.innerWidth
    this.stageHeight = window.innerHeight
    this.stage.width(this.stageWidth)
    this.stage.height(this.stageHeight)
    this.camera.resize(this.stageWidth, this.stageHeight)
  }

  _syncNodes() {
    const currentIds = new Set(this.objects.map(o => o.id))

    for (const [id, node] of this.nodeMap) {
      if (!currentIds.has(id)) {
        node.destroy()
        this.nodeMap.delete(id)
      }
    }

    for (const obj of this.objects) {
      if (!this.nodeMap.has(obj.id)) {
        const circle = new Konva.Circle({
          x: 0,
          y: 0,
          radius: 5,
          fill: obj.color,
          stroke: obj.label === 'Player' ? '#ffffff' : undefined,
          strokeWidth: obj.label === 'Player' ? 1.5 : 0,
        })
        this.gameLayer.add(circle)
        circle.moveToBottom()
        this.nodeMap.set(obj.id, circle)
      }
    }
  }

  _loop(now) {
    requestAnimationFrame((t) => this._loop(t))

    let dt = (now - this._lastTime) / 1000
    this._lastTime = now
    if (dt > 0.1) dt = 0.1

    const pan = this.input.getPanDelta()
    if (pan) {
      this.camera.pan(-pan.x, -pan.y)
      this.input.panStart = { x: this.input.panCurrent.x, y: this.input.panCurrent.y }
    } else {
      this.camera.decayPan()
    }

    const wheel = this.input.consumeWheel()
    if (wheel !== 0) {
      this.camera.zoom(wheel)
    }

    const thrust = this.input.getThrustForce()
    const timeScale = this.input.getTimeScale()

    let remaining = dt * timeScale
    let steps = 0
    while (remaining > 1e-9 && steps < MAX_SIM_STEPS) {
      const stepDt = Math.min(remaining, MAX_STEP_DT)
      this._fixedUpdate(thrust, stepDt)
      remaining -= stepDt
      steps++
    }

    this._render()
  }

  _fixedUpdate(thrust, dt) {
    this.physics.beginFrame(this.objects)
    this.physics.applyThrust(this.player, thrust.x, thrust.y)
    this.physics.addGravity(this.objects)
    this.physics.addDrag(this.objects)
    this.physics.integrate(this.objects, dt)
    this.collision.process(this.objects)
    this.camera.follow(this.player)
  }

  _render() {
    const { stageWidth, stageHeight, camera, player } = this

    camera.keepPlayerVisible(player.posX, player.posY)

    const mpp = camera.metersPerPixel

    for (const obj of this.objects) {
      const node = this.nodeMap.get(obj.id)
      if (!node) continue

      const screen = camera.worldToScreen(obj.posX, obj.posY)
      node.x(screen.x)
      node.y(screen.y)

      let minRadius = MIN_SCREEN_RADIUS_PLANET
      if (obj.label === 'Sun') minRadius = MIN_SCREEN_RADIUS_SUN
      if (obj.label === 'Player') minRadius = MIN_SCREEN_RADIUS_PLAYER
      node.radius(Math.max(obj.radius / mpp, minRadius))
    }

    this._drawArrows(player)

    const forceX = player.forceX
    const forceY = player.forceY
    const forceMag = Math.sqrt(forceX * forceX + forceY * forceY)
    const accelMag = forceMag / (player.mass * player.gamma)
    const speedMag = Math.sqrt(player.velX * player.velX + player.velY * player.velY)

    this.hudTexts.speed.text(
      `Vel: ${(speedMag / 1000).toFixed(2)} km/s  ∠${(Math.atan2(player.velY, player.velX) * 180 / Math.PI).toFixed(1)}°  (${(speedMag / C * 100).toFixed(6)}% c)`
    )
    this.hudTexts.force.text(
      `Force: ${forceMag.toExponential(2)} N  |a|: ${accelMag.toExponential(2)} m/s²  [i:${['OFF','AUTO','SHOW'][this.input.getForceDisplayMode()]}]`
    )
    this.hudTexts.gamma.text(
      `γ: ${player.gamma.toFixed(6)}`
    )
    this.hudTexts.thrust.text(
      `Thrust: ${THRUST_LEVELS[this.input.getThrustLevel()].toExponential(0)} N  [1|2|3]`
    )
    const ts = this.input.getTimeScale()
    const timeLabel = ts >= 86400 ? 'day' : ts >= 3600 ? 'hour' : ts >= 60 ? 'minute' : 'second'
    this.hudTexts.time.text(
      `Time: ${ts}x  (per ${timeLabel})  [7|8|9|0]`
    )
    this.hudTexts.zoom.text(
      `Zoom: ${mpp.toExponential(2)} m/px`
    )

    this.stage.batchDraw()
  }

  _drawArrows(player) {
    const { camera, velocityArrow, forceArrow, stageHeight } = this

    const sp = camera.worldToScreen(player.posX, player.posY)
    const maxVelPx = stageHeight * VEL_ARROW_FRAC
    const maxAccelPx = stageHeight * ACCEL_ARROW_FRAC

    const speedMag = Math.sqrt(player.velX * player.velX + player.velY * player.velY)
    if (speedMag > 1e-3) {
      const vPx = Math.min((speedMag / VEL_MAX_DISPLAY) * maxVelPx, maxVelPx)
      const vAngle = Math.atan2(player.velY, player.velX)
      const ex = sp.x + Math.cos(vAngle) * vPx
      const ey = sp.y + Math.sin(vAngle) * vPx
      velocityArrow.points([sp.x, sp.y, ex, ey])
      velocityArrow.visible(true)
    } else {
      velocityArrow.visible(false)
    }

    const forceMag = Math.sqrt(player.forceX * player.forceX + player.forceY * player.forceY)
    const mode = this.input.getForceDisplayMode()

    if (mode === 0) {
      forceArrow.visible(false)
    } else if (forceMag > 1e-6) {
      const accel = forceMag / (player.mass * player.gamma)
      let aPx = Math.min((accel / ACCEL_MAX_DISPLAY) * maxAccelPx, maxAccelPx)

      if (mode === 1 && aPx < 3) {
        forceArrow.visible(false)
      } else {
        if (mode === 2) aPx = Math.max(aPx, 10)
        const aAngle = Math.atan2(player.forceY, player.forceX)
        const ex = sp.x + Math.cos(aAngle) * aPx
        const ey = sp.y + Math.sin(aAngle) * aPx
        forceArrow.points([sp.x, sp.y, ex, ey])
        forceArrow.visible(true)
      }
    } else {
      forceArrow.visible(false)
    }
  }
}
