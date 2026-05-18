import { DEFAULT_ZOOM, MIN_ZOOM, MAX_ZOOM, CAMERA_LERP, CAMERA_PAN_LERP } from './constants'
import type { GameObject } from './gameObjects'

export class Camera {
  x: number
  y: number
  metersPerPixel: number
  stageWidth: number
  stageHeight: number
  private _panOffsetX: number
  private _panOffsetY: number

  constructor(stageWidth: number, stageHeight: number) {
    this.x = 0
    this.y = 0
    this.metersPerPixel = DEFAULT_ZOOM
    this.stageWidth = stageWidth
    this.stageHeight = stageHeight
    this._panOffsetX = 0
    this._panOffsetY = 0
  }

  resize(w: number, h: number): void {
    this.stageWidth = w
    this.stageHeight = h
  }

  follow(target: GameObject): void {
    this.x += (target.posX - this.x) * CAMERA_LERP
    this.y += (target.posY - this.y) * CAMERA_LERP
  }

  pan(dx: number, dy: number): void {
    this._panOffsetX += dx * this.metersPerPixel * (1 - CAMERA_PAN_LERP)
    this._panOffsetY += dy * this.metersPerPixel * (1 - CAMERA_PAN_LERP)
  }

  zoom(deltaSteps: number): void {
    const factor = Math.pow(1.15, deltaSteps)
    const newMpp = this.metersPerPixel / factor
    if (newMpp < MIN_ZOOM || newMpp > MAX_ZOOM) return
    this.metersPerPixel = newMpp
  }

  worldToScreen(wx: number, wy: number): { x: number, y: number } {
    return {
      x: (wx - (this.x + this._panOffsetX)) / this.metersPerPixel + this.stageWidth / 2,
      y: (wy - (this.y + this._panOffsetY)) / this.metersPerPixel + this.stageHeight / 2,
    }
  }

  screenToWorld(sx: number, sy: number): { x: number, y: number } {
    return {
      x: (sx - this.stageWidth / 2) * this.metersPerPixel + (this.x + this._panOffsetX),
      y: (sy - this.stageHeight / 2) * this.metersPerPixel + (this.y + this._panOffsetY),
    }
  }

  screenRadius(physicalRadius: number): number {
    return physicalRadius / this.metersPerPixel
  }

  decayPan(): void {
    this._panOffsetX *= (1 - CAMERA_PAN_LERP)
    this._panOffsetY *= (1 - CAMERA_PAN_LERP)
  }

  keepPlayerVisible(playerX: number, playerY: number): void {
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
