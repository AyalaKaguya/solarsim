import Konva from 'konva'
import { createSolarSystem, createPlayer } from './solarSystem'
import { InputSystem } from './input'
import { Camera } from './camera'
import { PhysicsSystem } from './physics'
import { CollisionSystem } from './collision'
import {
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
} from './constants'
import type { GameObject } from './gameObjects'

type HudKey = 'speed' | 'force' | 'gamma' | 'thrust' | 'time' | 'zoom'
type Vec2 = { x: number, y: number }

export class GameEngine {
  stageWidth: number
  stageHeight: number
  stage: Konva.Stage
  private gameLayer: Konva.Layer
  private hudLayer: Konva.Layer
  private physics: PhysicsSystem
  private collision: CollisionSystem
  private input: InputSystem
  private camera: Camera
  private objects: GameObject[]
  private player: GameObject
  private nodeMap: Map<string, Konva.Circle>
  private velocityArrow: Konva.Arrow
  private forceArrow: Konva.Arrow
  private hudTexts: Record<HudKey, Konva.Text>
  private _lastTime: number
  private _rafId: number | null
  private readonly _boundResize: () => void

  constructor(stageElement: HTMLDivElement) {
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
    this.player = this.objects[0]
    this.nodeMap = new Map()

    this._initPlayer()

    this.input.attach(this.stage.container())

    this._boundResize = this._onResize.bind(this)
    window.addEventListener('resize', this._boundResize)

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

    this.hudTexts = {} as Record<HudKey, Konva.Text>
    const hudLines: Array<{ key: HudKey, y: number }> = [
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
    this._rafId = requestAnimationFrame((t) => this._loop(t))
  }

  destroy(): void {
    if (this._rafId !== null) cancelAnimationFrame(this._rafId)
    window.removeEventListener('resize', this._boundResize)
    this.input.detach(this.stage.container())
    this.stage.destroy()
  }

  private _initPlayer(): void {
    const earth = this.objects.find(o => o.label === 'Earth')
    if (!earth) throw new Error('Earth not found in solar system objects')
    this.player = createPlayer(earth)
    this.objects.push(this.player)
  }

  private _onResize(): void {
    this.stageWidth = window.innerWidth
    this.stageHeight = window.innerHeight
    this.stage.width(this.stageWidth)
    this.stage.height(this.stageHeight)
    this.camera.resize(this.stageWidth, this.stageHeight)
  }

  private _syncNodes(): void {
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

  private _loop(now: number): void {
    this._rafId = requestAnimationFrame((t) => this._loop(t))

    let dt = (now - this._lastTime) / 1000
    this._lastTime = now
    if (dt > 0.1) dt = 0.1

    const pan = this.input.getPanDelta()
    if (pan) {
      this.camera.pan(-pan.x, -pan.y)
      const current = this.input.panCurrent
      if (current) {
        this.input.panStart = { x: current.x, y: current.y }
      }
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

  private _fixedUpdate(thrust: Vec2, dt: number): void {
    this.physics.beginFrame(this.objects)
    this.physics.applyThrust(this.player, thrust.x, thrust.y)
    this.physics.addGravity(this.objects)
    this.physics.addDrag(this.objects)
    this.physics.integrate(this.objects, dt)
    this.collision.process(this.objects)
    this.camera.follow(this.player)
  }

  private _render(): void {
    const { camera, player } = this

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

  private _drawArrows(player: GameObject): void {
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
