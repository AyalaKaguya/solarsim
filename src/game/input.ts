import { THRUST_LEVELS, TIME_SCALE_MAP } from './constants'

type Vec2 = { x: number, y: number }

export class InputSystem {
  keys: Record<string, boolean>
  private _toggleKeys: Set<string>
  private wheelDelta: number
  private isPanning: boolean
  panStart: Vec2 | null
  panCurrent: Vec2 | null
  private _thrustLevel: number
  private _timeScale: number
  private _forceDisplayMode: number

  private _onKeyDown: (e: KeyboardEvent) => void
  private _onKeyUp: (e: KeyboardEvent) => void
  private _onWheel: (e: WheelEvent) => void
  private _onMouseDown: (e: MouseEvent) => void
  private _onMouseMove: (e: MouseEvent) => void
  private _onMouseUp: (e: MouseEvent) => void

  constructor() {
    this.keys = {}
    this._toggleKeys = new Set()
    this.wheelDelta = 0
    this.isPanning = false
    this.panStart = null
    this.panCurrent = null
    this._thrustLevel = 0
    this._timeScale = 1
    this._forceDisplayMode = 1

    this._onKeyDown = this._onKeyDownImpl.bind(this)
    this._onKeyUp = this._onKeyUpImpl.bind(this)
    this._onWheel = this._onWheelImpl.bind(this)
    this._onMouseDown = this._onMouseDownImpl.bind(this)
    this._onMouseMove = this._onMouseMoveImpl.bind(this)
    this._onMouseUp = this._onMouseUpImpl.bind(this)
  }

  attach(element: HTMLElement): void {
    window.addEventListener('keydown', this._onKeyDown)
    window.addEventListener('keyup', this._onKeyUp)
    element.addEventListener('wheel', this._onWheel, { passive: false })
    element.addEventListener('mousedown', this._onMouseDown)
    window.addEventListener('mousemove', this._onMouseMove)
    window.addEventListener('mouseup', this._onMouseUp)
  }

  detach(element: HTMLElement): void {
    window.removeEventListener('keydown', this._onKeyDown)
    window.removeEventListener('keyup', this._onKeyUp)
    element.removeEventListener('wheel', this._onWheel)
    element.removeEventListener('mousedown', this._onMouseDown)
    window.removeEventListener('mousemove', this._onMouseMove)
    window.removeEventListener('mouseup', this._onMouseUp)
  }

  private _onKeyDownImpl(e: KeyboardEvent): void {
    const k = e.key.toLowerCase()

    if (k === '1') this._thrustLevel = 0
    else if (k === '2') this._thrustLevel = 1
    else if (k === '3') this._thrustLevel = 2
    else if (k === 'i') {
      if (!this._toggleKeys.has(k)) {
        this._forceDisplayMode = (this._forceDisplayMode + 1) % 3
        this._toggleKeys.add(k)
      }
    }
    else if (TIME_SCALE_MAP[k] !== undefined) {
      if (!this._toggleKeys.has(k)) {
        this._timeScale = TIME_SCALE_MAP[k]
        this._toggleKeys.add(k)
      }
    }
    else this.keys[k] = true
  }

  private _onKeyUpImpl(e: KeyboardEvent): void {
    const k = e.key.toLowerCase()
    this.keys[k] = false
    this._toggleKeys.delete(k)
  }

  private _onWheelImpl(e: WheelEvent): void {
    e.preventDefault()
    this.wheelDelta += e.deltaY > 0 ? 1 : -1
  }

  private _onMouseDownImpl(e: MouseEvent): void {
    if (e.button === 1) {
      e.preventDefault()
      this.isPanning = true
      this.panStart = { x: e.clientX, y: e.clientY }
      this.panCurrent = { x: e.clientX, y: e.clientY }
    }
  }

  private _onMouseMoveImpl(e: MouseEvent): void {
    if (this.isPanning) {
      this.panCurrent = { x: e.clientX, y: e.clientY }
    }
  }

  private _onMouseUpImpl(e: MouseEvent): void {
    if (e.button === 1) {
      this.isPanning = false
      this.panStart = null
    }
  }

  getThrustForce(): Vec2 {
    let fx = 0
    let fy = 0
    if (this.keys['d'] || this.keys['arrowright']) fx += 1
    if (this.keys['a'] || this.keys['arrowleft']) fx -= 1
    if (this.keys['w'] || this.keys['arrowup']) fy -= 1
    if (this.keys['s'] || this.keys['arrowdown']) fy += 1

    if (fx === 0 && fy === 0) return { x: 0, y: 0 }

    const thrust = THRUST_LEVELS[this._thrustLevel]
    const len = Math.sqrt(fx * fx + fy * fy)
    return {
      x: (fx / len) * thrust,
      y: (fy / len) * thrust,
    }
  }

  getThrustLevel(): number {
    return this._thrustLevel
  }

  getTimeScale(): number {
    return this._timeScale
  }

  getForceDisplayMode(): number {
    return this._forceDisplayMode
  }

  consumeWheel(): number {
    const d = this.wheelDelta
    this.wheelDelta = 0
    return d
  }

  getPanDelta(): Vec2 | null {
    if (!this.panStart || !this.panCurrent) return null
    return {
      x: this.panCurrent.x - this.panStart.x,
      y: this.panCurrent.y - this.panStart.y,
    }
  }
}
