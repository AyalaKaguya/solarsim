import { DEFAULT_ZOOM, MIN_ZOOM, MAX_ZOOM, CAMERA_LERP, CAMERA_PAN_LERP } from './constants.js'

export class Camera {
  constructor(stageWidth, stageHeight) {
    this.x = 0
    this.y = 0
    this.metersPerPixel = DEFAULT_ZOOM
    this.stageWidth = stageWidth
    this.stageHeight = stageHeight
    this._panOffsetX = 0
    this._panOffsetY = 0
  }

  resize(w, h) {
    this.stageWidth = w
    this.stageHeight = h
  }

  follow(target) {
    this.x += (target.posX - this.x) * CAMERA_LERP
    this.y += (target.posY - this.y) * CAMERA_LERP
  }

  pan(dx, dy) {
    this._panOffsetX += dx * this.metersPerPixel * (1 - CAMERA_PAN_LERP)
    this._panOffsetY += dy * this.metersPerPixel * (1 - CAMERA_PAN_LERP)
  }

  zoom(deltaSteps) {
    const factor = Math.pow(1.15, deltaSteps)
    const newMpp = this.metersPerPixel / factor
    if (newMpp < MIN_ZOOM || newMpp > MAX_ZOOM) return
    this.metersPerPixel = newMpp
  }

  worldToScreen(wx, wy) {
    return {
      x: (wx - (this.x + this._panOffsetX)) / this.metersPerPixel + this.stageWidth / 2,
      y: (wy - (this.y + this._panOffsetY)) / this.metersPerPixel + this.stageHeight / 2,
    }
  }

  screenToWorld(sx, sy) {
    return {
      x: (sx - this.stageWidth / 2) * this.metersPerPixel + (this.x + this._panOffsetX),
      y: (sy - this.stageHeight / 2) * this.metersPerPixel + (this.y + this._panOffsetY),
    }
  }

  screenRadius(physicalRadius) {
    return physicalRadius / this.metersPerPixel
  }

  decayPan() {
    this._panOffsetX *= (1 - CAMERA_PAN_LERP)
    this._panOffsetY *= (1 - CAMERA_PAN_LERP)
  }

  keepPlayerVisible(playerX, playerY) {
    const screen = this.worldToScreen(playerX, playerY)
    const cx = this.stageWidth / 2
    const cy = this.stageHeight / 2
    const dx = Math.abs(screen.x - cx)
    const dy = Math.abs(screen.y - cy)
    const safeRadius = Math.min(this.stageWidth, this.stageHeight) * 0.45

    const maxDist = Math.max(dx, dy)
    if (maxDist <= safeRadius) return

    const factor = 1 + (maxDist - safeRadius) / safeRadius * 0.6
    this.metersPerPixel = Math.min(this.metersPerPixel * factor, MAX_ZOOM)
  }
}
