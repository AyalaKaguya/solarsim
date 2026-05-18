import { THRUST_LEVELS, TIME_SCALE_MAP } from './constants.js'

export class InputSystem {
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

    this._onKeyDown = this._onKeyDown.bind(this)
    this._onKeyUp = this._onKeyUp.bind(this)
    this._onWheel = this._onWheel.bind(this)
    this._onMouseDown = this._onMouseDown.bind(this)
    this._onMouseMove = this._onMouseMove.bind(this)
    this._onMouseUp = this._onMouseUp.bind(this)
  }

  attach(element) {
    window.addEventListener('keydown', this._onKeyDown)
    window.addEventListener('keyup', this._onKeyUp)
    element.addEventListener('wheel', this._onWheel, { passive: false })
    element.addEventListener('mousedown', this._onMouseDown)
    window.addEventListener('mousemove', this._onMouseMove)
    window.addEventListener('mouseup', this._onMouseUp)
  }

  detach() {
    window.removeEventListener('keydown', this._onKeyDown)
    window.removeEventListener('keyup', this._onKeyUp)
  }

  _onKeyDown(e) {
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

  _onKeyUp(e) {
    const k = e.key.toLowerCase()
    this.keys[k] = false
    this._toggleKeys.delete(k)
  }

  _onWheel(e) {
    e.preventDefault()
    this.wheelDelta += e.deltaY > 0 ? 1 : -1
  }

  _onMouseDown(e) {
    if (e.button === 1) {
      e.preventDefault()
      this.isPanning = true
      this.panStart = { x: e.clientX, y: e.clientY }
      this.panCurrent = { x: e.clientX, y: e.clientY }
    }
  }

  _onMouseMove(e) {
    if (this.isPanning) {
      this.panCurrent = { x: e.clientX, y: e.clientY }
    }
  }

  _onMouseUp(e) {
    if (e.button === 1) {
      this.isPanning = false
      this.panStart = null
    }
  }

  getThrustForce() {
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

  getThrustLevel() {
    return this._thrustLevel
  }

  getTimeScale() {
    return this._timeScale
  }

  getForceDisplayMode() {
    return this._forceDisplayMode
  }

  consumeWheel() {
    const d = this.wheelDelta
    this.wheelDelta = 0
    return d
  }

  getPanDelta() {
    if (!this.panStart || !this.panCurrent) return null
    return {
      x: this.panCurrent.x - this.panStart.x,
      y: this.panCurrent.y - this.panStart.y,
    }
  }
}
