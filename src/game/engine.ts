import Konva from 'konva'
import { createSolarSystem, createPlayer } from './solarSystem'
import { InputSystem, type VelocityReferenceMode } from './input'
import { Camera } from './camera'
import { PhysicsSystem } from './physics'
import { CollisionSystem } from './collision'
import {
  G,
  C2,
  SPEED_LIMIT,
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
  PLANETS,
  SATELLITES,
  TRAJECTORY_PREDICTION_STEPS,
  TRAJECTORY_PREDICTION_DT,
  C,
  type OrbitingBodyDefinition,
} from './constants'
import type { GameObject } from './gameObjects'

type HudKey = 'speed' | 'force' | 'gamma' | 'thrust' | 'time' | 'zoom'
type Vec2 = { x: number, y: number }
type PredictedState = { posX: number, posY: number, velX: number, velY: number, gamma: number }
type VelocityDisplay = {
  velX: number
  velY: number
  label: string
  mode: VelocityReferenceMode
}
type SolvedOrbit = {
  centerX: number
  centerY: number
  radiusX: number
  radiusY: number
  rotation: number
}

export class GameEngine {
  stageWidth: number
  stageHeight: number
  stage: Konva.Stage
  private orbitLayer: Konva.Layer
  private predictionLayer: Konva.Layer
  private gameLayer: Konva.Layer
  private hudLayer: Konva.Layer
  private physics: PhysicsSystem
  private collision: CollisionSystem
  private input: InputSystem
  private camera: Camera
  private objects: GameObject[]
  private player: GameObject
  private bodyByLabel: Map<string, GameObject>
  private orbitDefinitions: OrbitingBodyDefinition[]
  private orbitMap: Map<string, Konva.Ellipse>
  private nodeMap: Map<string, Konva.Circle>
  private trajectoryLine: Konva.Line
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

    this.orbitLayer = new Konva.Layer()
  this.predictionLayer = new Konva.Layer()
    this.gameLayer = new Konva.Layer()
    this.hudLayer = new Konva.Layer()
    this.stage.add(this.orbitLayer)
  this.stage.add(this.predictionLayer)
    this.stage.add(this.gameLayer)
    this.stage.add(this.hudLayer)

    this.physics = new PhysicsSystem()
    this.collision = new CollisionSystem()
    this.input = new InputSystem()
    this.camera = new Camera(this.stageWidth, this.stageHeight)

    this.objects = createSolarSystem()
    this.player = this.objects[0]
    this.bodyByLabel = new Map(this.objects.map((obj) => [obj.label, obj]))
    this.orbitDefinitions = [...PLANETS, ...SATELLITES]
    this.orbitMap = new Map()
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
    this.trajectoryLine = new Konva.Line({
      points: [],
      stroke: '#d9f0ff',
      strokeWidth: 2,
      dash: [1, 10],
      lineCap: 'round',
      lineJoin: 'round',
      opacity: 0.7,
      listening: false,
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
    this.predictionLayer.add(this.trajectoryLine)
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

    this._syncOrbitGuides()
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
    this.bodyByLabel.set(this.player.label, this.player)
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

  private _syncOrbitGuides(): void {
    const currentLabels = new Set(this.orbitDefinitions.map(def => def.label))

    for (const [label, line] of this.orbitMap) {
      if (!currentLabels.has(label)) {
        line.destroy()
        this.orbitMap.delete(label)
      }
    }

    for (const definition of this.orbitDefinitions) {
      if (this.orbitMap.has(definition.label)) continue

      const orbitLine = new Konva.Ellipse({
        x: 0,
        y: 0,
        radiusX: 0,
        radiusY: 0,
        stroke: definition.color,
        strokeWidth: 1,
        dash: [6, 8],
        opacity: 0.28,
        fillEnabled: false,
        listening: false,
      })
      this.orbitLayer.add(orbitLine)
      this.orbitMap.set(definition.label, orbitLine)
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

    const thrust = this.input.getThrustForce({
      x: this.player.velX,
      y: this.player.velY,
    })
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
    const prevVelX = this.player.velX
    const prevVelY = this.player.velY
    const prevSpeedSq = prevVelX * prevVelX + prevVelY * prevVelY

    this.physics.beginFrame(this.objects)
    this.physics.applyThrust(this.player, thrust.x, thrust.y)
    this.physics.addGravity(this.objects)
    this.physics.addDrag(this.objects)
    this.physics.integrate(this.objects, dt)

    if (this.input.isVelocityBrakeActive() && prevSpeedSq > 1e-9) {
      const velocityDot = prevVelX * this.player.velX + prevVelY * this.player.velY
      if (velocityDot <= 0) {
        this.player.velX = 0
        this.player.velY = 0
      }
    }

    this.collision.process(this.objects)
    this.camera.follow(this.player)
  }

  private _render(): void {
    const { camera, player } = this

    camera.keepPlayerVisible(player.posX, player.posY)
    this._renderOrbitGuides()
    this._renderPredictedTrajectory()

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
    const velocityDisplay = this._getVelocityDisplay(player)

    const forceX = player.forceX
    const forceY = player.forceY
    const forceMag = Math.sqrt(forceX * forceX + forceY * forceY)
    const accelMag = forceMag / (player.mass * player.gamma)
    const speedMag = Math.sqrt(
      velocityDisplay.velX * velocityDisplay.velX + velocityDisplay.velY * velocityDisplay.velY,
    )

    this.hudTexts.speed.text(
      `${velocityDisplay.label}: ${(speedMag / 1000).toFixed(2)} km/s  ∠${(Math.atan2(velocityDisplay.velY, velocityDisplay.velX) * 180 / Math.PI).toFixed(1)}°  (${(speedMag / C * 100).toFixed(6)}% c)`
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
      `Time: ${ts}x  (per ${timeLabel})  [+|-|7|8|9|0]`
    )
    this.hudTexts.zoom.text(
      `Zoom: ${mpp.toExponential(2)} m/px`
    )

    this.stage.batchDraw()
  }

  private _renderPredictedTrajectory(): void {
    if (!this.input.getShowTrajectoryPrediction()) {
      this.trajectoryLine.visible(false)
      return
    }

    const solvedOrbit = this._solveDominantBodyOrbit(this.player)
    if (solvedOrbit) {
      this._renderSolvedOrbitLine(solvedOrbit)
      return
    }

    this._renderIntegratedTrajectory()
  }

  private _renderIntegratedTrajectory(): void {

    const points: number[] = []
    let state: PredictedState = {
      posX: this.player.posX,
      posY: this.player.posY,
      velX: this.player.velX,
      velY: this.player.velY,
      gamma: this.player.gamma,
    }

    for (let i = 0; i < TRAJECTORY_PREDICTION_STEPS; i++) {
      state = this._stepPredictedState(state, TRAJECTORY_PREDICTION_DT)
      const screen = this.camera.worldToScreen(state.posX, state.posY)
      points.push(screen.x, screen.y)

      if (!Number.isFinite(screen.x) || !Number.isFinite(screen.y)) break
    }

    if (points.length < 4) {
      this.trajectoryLine.visible(false)
      return
    }

    this.trajectoryLine.points(points)
    this.trajectoryLine.visible(true)
  }

  private _renderSolvedOrbitLine(orbit: SolvedOrbit): void {
    const points: number[] = []
    const segments = 180
    const cosR = Math.cos(orbit.rotation)
    const sinR = Math.sin(orbit.rotation)

    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2
      const localX = orbit.radiusX * Math.cos(angle)
      const localY = orbit.radiusY * Math.sin(angle)
      const worldX = orbit.centerX + localX * cosR - localY * sinR
      const worldY = orbit.centerY + localX * sinR + localY * cosR
      const screen = this.camera.worldToScreen(worldX, worldY)
      points.push(screen.x, screen.y)
    }

    this.trajectoryLine.points(points)
    this.trajectoryLine.visible(true)
  }

  private _stepPredictedState(state: PredictedState, dt: number): PredictedState {
    let forceX = 0
    let forceY = 0

    for (const obj of this.objects) {
      if (obj.id === this.player.id) continue

      const dx = obj.posX - state.posX
      const dy = obj.posY - state.posY
      const distSq = dx * dx + dy * dy
      if (distSq < 1e-20) continue

      const dist = Math.sqrt(distSq)
      const effectiveDist = Math.max(dist, obj.radius + this.player.radius)
      const forceMag = G * this.player.mass * obj.mass / (effectiveDist * effectiveDist)
      forceX += forceMag * dx / dist
      forceY += forceMag * dy / dist
    }

    const gamma = this._computeGamma(state.velX, state.velY)
    const effectiveMass = this.player.mass * gamma
    let velX = state.velX + (forceX / effectiveMass) * dt
    let velY = state.velY + (forceY / effectiveMass) * dt

    const speed = Math.sqrt(velX * velX + velY * velY)
    if (speed > SPEED_LIMIT) {
      const scale = SPEED_LIMIT / speed
      velX *= scale
      velY *= scale
    }

    return {
      posX: state.posX + velX * dt,
      posY: state.posY + velY * dt,
      velX,
      velY,
      gamma: this._computeGamma(velX, velY),
    }
  }

  private _renderOrbitGuides(): void {
    for (const definition of this.orbitDefinitions) {
      const orbit = this.orbitMap.get(definition.label)
      if (!orbit) continue

      const parent = this.bodyByLabel.get(definition.parentLabel)
      if (!parent) {
        orbit.visible(false)
        continue
      }

      const semiMinor = definition.a * Math.sqrt(1 - definition.e * definition.e)
      const centerOffset = definition.a * definition.e
      const cosω = Math.cos(definition.ω)
      const sinω = Math.sin(definition.ω)
      const centerWorldX = parent.posX - centerOffset * cosω
      const centerWorldY = parent.posY - centerOffset * sinω
      const centerScreen = this.camera.worldToScreen(centerWorldX, centerWorldY)
      const radiusX = definition.a / this.camera.metersPerPixel
      const radiusY = semiMinor / this.camera.metersPerPixel
      const maxScreenRadius = Math.max(radiusX, radiusY)

      if (maxScreenRadius < 6 || maxScreenRadius > Math.max(this.stageWidth, this.stageHeight) * 3) {
        orbit.visible(false)
        continue
      }

      orbit.x(centerScreen.x)
      orbit.y(centerScreen.y)
      orbit.radiusX(radiusX)
      orbit.radiusY(radiusY)
      orbit.rotation(definition.ω * 180 / Math.PI)
      orbit.visible(true)
    }
  }

  private _drawArrows(player: GameObject): void {
    const { camera, velocityArrow, forceArrow, stageHeight } = this

    const sp = camera.worldToScreen(player.posX, player.posY)
    const maxVelPx = stageHeight * VEL_ARROW_FRAC
    const maxAccelPx = stageHeight * ACCEL_ARROW_FRAC
    const velocityDisplay = this._getVelocityDisplay(player)

    const speedMag = Math.sqrt(
      velocityDisplay.velX * velocityDisplay.velX + velocityDisplay.velY * velocityDisplay.velY,
    )
    if (velocityDisplay.mode !== 'off' && speedMag > 1e-3) {
      const vPx = Math.min((speedMag / VEL_MAX_DISPLAY) * maxVelPx, maxVelPx)
      const vAngle = Math.atan2(velocityDisplay.velY, velocityDisplay.velX)
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

  private _getVelocityDisplay(player: GameObject): VelocityDisplay {
    const mode = this.input.getVelocityReferenceMode()

    if (mode === 'off') {
      return {
        velX: player.velX,
        velY: player.velY,
        label: 'Vel[j:OFF]',
        mode,
      }
    }

    if (mode === 'solar') {
      return {
        velX: player.velX,
        velY: player.velY,
        label: 'Vel(Solar)[j]',
        mode,
      }
    }

    const dominantBody = this._getDominantGravityBody(player)
    if (!dominantBody) {
      return {
        velX: player.velX,
        velY: player.velY,
        label: 'Vel(Solar)[j]',
        mode: 'solar',
      }
    }

    return {
      velX: player.velX - dominantBody.velX,
      velY: player.velY - dominantBody.velY,
      label: `Vel(rel ${dominantBody.label})[j]`,
      mode,
    }
  }

  private _getDominantGravityBody(player: GameObject): GameObject | null {
    let dominantBody: GameObject | null = null
    let dominantForceSq = -1

    for (const obj of this.objects) {
      if (obj.id === player.id) continue

      const dx = obj.posX - player.posX
      const dy = obj.posY - player.posY
      const distSq = dx * dx + dy * dy
      if (distSq < 1e-20) continue

      const dist = Math.sqrt(distSq)
      const effectiveDist = Math.max(dist, obj.radius + player.radius)
      const accelMag = G * obj.mass / (effectiveDist * effectiveDist)
      const accelSq = accelMag * accelMag
      if (accelSq > dominantForceSq) {
        dominantBody = obj
        dominantForceSq = accelSq
      }
    }

    return dominantBody
  }

  private _solveDominantBodyOrbit(player: GameObject): SolvedOrbit | null {
    const dominantBody = this._getDominantGravityBody(player)
    if (!dominantBody) return null

    const relPosX = player.posX - dominantBody.posX
    const relPosY = player.posY - dominantBody.posY
    const relVelX = player.velX - dominantBody.velX
    const relVelY = player.velY - dominantBody.velY

    const radius = Math.sqrt(relPosX * relPosX + relPosY * relPosY)
    const speedSq = relVelX * relVelX + relVelY * relVelY
    if (radius < 1e-6) return null

    const mu = G * (dominantBody.mass + player.mass)
    const specificEnergy = speedSq / 2 - mu / radius
    if (!Number.isFinite(specificEnergy) || specificEnergy >= 0) return null

    const radialVelocity = relPosX * relVelX + relPosY * relVelY
    const factor = speedSq - mu / radius
    const eccX = (factor * relPosX - radialVelocity * relVelX) / mu
    const eccY = (factor * relPosY - radialVelocity * relVelY) / mu
    const eccentricity = Math.sqrt(eccX * eccX + eccY * eccY)
    if (!Number.isFinite(eccentricity) || eccentricity >= 1) return null

    const semiMajorAxis = -mu / (2 * specificEnergy)
    const semiMinorAxis = semiMajorAxis * Math.sqrt(1 - eccentricity * eccentricity)
    const periapsisAngle = eccentricity > 1e-8
      ? Math.atan2(eccY, eccX)
      : Math.atan2(relPosY, relPosX)
    const centerOffset = semiMajorAxis * eccentricity

    return {
      centerX: dominantBody.posX - centerOffset * Math.cos(periapsisAngle),
      centerY: dominantBody.posY - centerOffset * Math.sin(periapsisAngle),
      radiusX: semiMajorAxis,
      radiusY: semiMinorAxis,
      rotation: periapsisAngle,
    }
  }

  private _computeGamma(vx: number, vy: number): number {
    const v2 = vx * vx + vy * vy
    const beta2 = Math.min(v2 / C2, 0.998001)
    return 1 / Math.sqrt(1 - beta2)
  }
}
