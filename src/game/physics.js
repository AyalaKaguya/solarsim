import { G, C, C2, SPEED_LIMIT, VACUUM_DRAG_COEFFICIENT, FIXED_DT } from './constants.js'

export class PhysicsSystem {
  beginFrame(objects) {
    for (const obj of objects) {
      obj.forceX = 0
      obj.forceY = 0
    }
  }

  addGravity(objects) {
    const count = objects.length
    for (let i = 0; i < count; i++) {
      const a = objects[i]
      if (a.isStatic) continue
      for (let j = i + 1; j < count; j++) {
        const b = objects[j]
        const dx = b.posX - a.posX
        const dy = b.posY - a.posY
        const distSq = dx * dx + dy * dy
        if (distSq < 1e-20) continue
        const dist = Math.sqrt(distSq)

        const minDist = a.radius + b.radius
        const effectiveDist = Math.max(dist, minDist)
        const forceMag = G * a.mass * a.gamma * b.mass * b.gamma / (effectiveDist * effectiveDist)
        const nx = dx / dist
        const ny = dy / dist

        a.forceX += forceMag * nx
        a.forceY += forceMag * ny
        if (!b.isStatic) {
          b.forceX -= forceMag * nx
          b.forceY -= forceMag * ny
        }
      }
    }
  }

  addDrag(objects) {
    for (const obj of objects) {
      if (obj.isStatic) continue
      obj.forceX -= VACUUM_DRAG_COEFFICIENT * obj.velX / obj.gamma
      obj.forceY -= VACUUM_DRAG_COEFFICIENT * obj.velY / obj.gamma
    }
  }

  applyThrust(obj, fx, fy) {
    if (!obj || obj.isStatic) return
    obj.forceX += fx
    obj.forceY += fy
  }

  integrate(objects, dt) {
    for (const obj of objects) {
      if (obj.isStatic) continue

      const v2 = obj.velX * obj.velX + obj.velY * obj.velY
      const beta2 = Math.min(v2 / C2, 0.998001)
      obj.gamma = 1 / Math.sqrt(1 - beta2)
      const effectiveMass = obj.mass * obj.gamma

      const ax = obj.forceX / effectiveMass
      const ay = obj.forceY / effectiveMass

      obj.velX += ax * dt
      obj.velY += ay * dt

      const speed = Math.sqrt(obj.velX * obj.velX + obj.velY * obj.velY)
      if (speed > SPEED_LIMIT) {
        const scale = SPEED_LIMIT / speed
        obj.velX *= scale
        obj.velY *= scale
      }

      obj.posX += obj.velX * dt
      obj.posY += obj.velY * dt
    }
  }
}
