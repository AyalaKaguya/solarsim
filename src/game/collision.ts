import { C2, SPEED_LIMIT } from './constants'
import type { CollisionType, GameObject } from './gameObjects'

type CollisionHandler = (a: GameObject, b: GameObject, dist: number, nx: number, ny: number) => void

function computeVelocityFromMomentum(px: number, py: number, mass: number): { vx: number, vy: number, gamma: number } {
  const p2 = px * px + py * py
  const gamma = Math.sqrt(1 + p2 / (mass * mass * C2))
  return {
    vx: px / (gamma * mass),
    vy: py / (gamma * mass),
    gamma,
  }
}

export const COLLISION_HANDLERS = {
  elastic: null as CollisionHandler | null,
  inelastic: null as CollisionHandler | null,
  fragment: null as CollisionHandler | null,
}

COLLISION_HANDLERS.elastic = function resolveElastic(a, b, dist, nx, ny) {
  const vrx = a.velX - b.velX
  const vry = a.velY - b.velY
  const vrn = vrx * nx + vry * ny

  if (vrn <= 0) return

  const maInv = a.isStatic ? 0 : (1 / (a.mass * a.gamma))
  const mbInv = b.isStatic ? 0 : (1 / (b.mass * b.gamma))
  const invSum = maInv + mbInv
  if (invSum === 0) return

  const j = 2 * vrn / invSum

  let momentumAX = a.gamma * a.mass * a.velX
  let momentumAY = a.gamma * a.mass * a.velY
  let momentumBX = b.gamma * b.mass * b.velX
  let momentumBY = b.gamma * b.mass * b.velY

  if (!a.isStatic) {
    momentumAX -= j * nx
    momentumAY -= j * ny
    const nextA = computeVelocityFromMomentum(momentumAX, momentumAY, a.mass)
    a.velX = nextA.vx
    a.velY = nextA.vy
    a.gamma = nextA.gamma

    const speedA = Math.sqrt(a.velX * a.velX + a.velY * a.velY)
    if (speedA > SPEED_LIMIT) {
      const scale = SPEED_LIMIT / speedA
      a.velX *= scale
      a.velY *= scale
    }
  }
  if (!b.isStatic) {
    momentumBX += j * nx
    momentumBY += j * ny
    const nextB = computeVelocityFromMomentum(momentumBX, momentumBY, b.mass)
    b.velX = nextB.vx
    b.velY = nextB.vy
    b.gamma = nextB.gamma

    const speedB = Math.sqrt(b.velX * b.velX + b.velY * b.velY)
    if (speedB > SPEED_LIMIT) {
      const scale = SPEED_LIMIT / speedB
      b.velX *= scale
      b.velY *= scale
    }
  }

  const overlap = a.radius + b.radius - dist
  if (overlap > 0) {
    const totalInv = maInv + mbInv
    if (totalInv === 0) return
    const shiftA = overlap * (maInv / totalInv)
    const shiftB = overlap * (mbInv / totalInv)
    if (!a.isStatic) {
      a.posX -= shiftA * nx
      a.posY -= shiftA * ny
    }
    if (!b.isStatic) {
      b.posX += shiftB * nx
      b.posY += shiftB * ny
    }
  }
}

COLLISION_HANDLERS.inelastic = function resolveInelastic(_a, _b, _dist, _nx, _ny) {
  throw new Error('Inelastic collision not yet implemented')
}

COLLISION_HANDLERS.fragment = function resolveFragment(_a, _b, _dist, _nx, _ny) {
  throw new Error('Fragment collision not yet implemented')
}

export class CollisionSystem {
  process(objects: GameObject[]): void {
    const count = objects.length
    for (let i = 0; i < count; i++) {
      for (let j = i + 1; j < count; j++) {
        const a = objects[i]
        const b = objects[j]
        if (a.isStatic && b.isStatic) continue

        const dx = b.posX - a.posX
        const dy = b.posY - a.posY
        const distSq = dx * dx + dy * dy
        const minDist = a.radius + b.radius
        if (distSq >= minDist * minDist) continue

        const dist = Math.sqrt(distSq)
        if (dist < 1e-10) continue

        const nx = dx / dist
        const ny = dy / dist

        const handlerName: CollisionType = a.collisionType === 'elastic' && b.collisionType === 'elastic'
          ? 'elastic'
          : a.collisionType

        const handler = COLLISION_HANDLERS[handlerName]
        if (handler) handler(a, b, dist, nx, ny)
      }
    }
  }
}
