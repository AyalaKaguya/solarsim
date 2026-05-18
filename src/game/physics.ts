import { G, C2, SPEED_LIMIT, VACUUM_DRAG_COEFFICIENT } from './constants'
import type { GameObject } from './gameObjects'

function computeGamma(vx: number, vy: number): number {
  const v2 = vx * vx + vy * vy
  const beta2 = Math.min(v2 / C2, 0.998001)
  return 1 / Math.sqrt(1 - beta2)
}

function computeVelocityFromMomentum(px: number, py: number, mass: number): { vx: number, vy: number, gamma: number } {
  const p2 = px * px + py * py
  const gamma = Math.sqrt(1 + p2 / (mass * mass * C2))
  return {
    vx: px / (gamma * mass),
    vy: py / (gamma * mass),
    gamma,
  }
}

export class PhysicsSystem {
  beginFrame(objects: GameObject[]): void {
    for (const obj of objects) {
      obj.forceX = 0
      obj.forceY = 0
    }
  }

  addGravity(objects: GameObject[]): void {
    const count = objects.length
    for (let i = 0; i < count; i++) {
      const a = objects[i]
      for (let j = i + 1; j < count; j++) {
        const b = objects[j]
        const dx = b.posX - a.posX
        const dy = b.posY - a.posY
        const distSq = dx * dx + dy * dy
        if (distSq < 1e-20) continue
        const dist = Math.sqrt(distSq)

        const minDist = a.radius + b.radius
        const effectiveDist = Math.max(dist, minDist)
        const forceMag = G * a.mass * b.mass / (effectiveDist * effectiveDist)
        const nx = dx / dist
        const ny = dy / dist

        if (!a.isStatic) {
          a.forceX += forceMag * nx
          a.forceY += forceMag * ny
        }
        if (!b.isStatic) {
          b.forceX -= forceMag * nx
          b.forceY -= forceMag * ny
        }
      }
    }
  }

  addDrag(objects: GameObject[]): void {
    for (const obj of objects) {
      if (obj.isStatic) continue
      obj.forceX -= VACUUM_DRAG_COEFFICIENT * obj.velX / obj.gamma
      obj.forceY -= VACUUM_DRAG_COEFFICIENT * obj.velY / obj.gamma
    }
  }

  applyThrust(obj: GameObject | null, fx: number, fy: number): void {
    if (!obj || obj.isStatic) return
    obj.forceX += fx
    obj.forceY += fy
  }

  integrate(objects: GameObject[], dt: number): void {
    for (const obj of objects) {
      if (obj.isStatic) continue

      obj.gamma = computeGamma(obj.velX, obj.velY)
      let momentumX = obj.gamma * obj.mass * obj.velX
      let momentumY = obj.gamma * obj.mass * obj.velY

      momentumX += obj.forceX * dt
      momentumY += obj.forceY * dt

      const nextState = computeVelocityFromMomentum(momentumX, momentumY, obj.mass)
      obj.velX = nextState.vx
      obj.velY = nextState.vy
      obj.gamma = nextState.gamma

      const speed = Math.sqrt(obj.velX * obj.velX + obj.velY * obj.velY)
      if (speed > SPEED_LIMIT) {
        const scale = SPEED_LIMIT / speed
        obj.velX *= scale
        obj.velY *= scale
        obj.gamma = computeGamma(obj.velX, obj.velY)
      }

      obj.posX += obj.velX * dt
      obj.posY += obj.velY * dt
    }
  }
}
