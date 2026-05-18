export const COLLISION_HANDLERS = {
  elastic: null,
  inelastic: null,
  fragment: null,
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

  if (!a.isStatic) {
    a.velX -= j * maInv * nx
    a.velY -= j * maInv * ny
  }
  if (!b.isStatic) {
    b.velX += j * mbInv * nx
    b.velY += j * mbInv * ny
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

COLLISION_HANDLERS.inelastic = function resolveInelastic(a, b, dist, nx, ny) {
  throw new Error('Inelastic collision not yet implemented')
}

COLLISION_HANDLERS.fragment = function resolveFragment(a, b, dist, nx, ny) {
  throw new Error('Fragment collision not yet implemented')
}

export class CollisionSystem {
  process(objects) {
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

        const handlerName = a.collisionType === 'elastic' && b.collisionType === 'elastic'
          ? 'elastic'
          : a.collisionType

        const handler = COLLISION_HANDLERS[handlerName]
        if (handler) handler(a, b, dist, nx, ny)
      }
    }
  }
}
