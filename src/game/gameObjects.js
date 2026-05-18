let nextId = 0

export function createGameObject({
  label = 'object',
  posX = 0,
  posY = 0,
  velX = 0,
  velY = 0,
  mass = 1000,
  density = 1000,
  volume = null,
  radius = null,
  isStatic = false,
  collisionType = 'elastic',
  color = '#ffffff',
}) {
  const vol = volume ?? (mass / density)
  const r = radius ?? Math.cbrt((3 * vol) / (4 * Math.PI))

  return {
    id: String(nextId++),
    label,
    posX,
    posY,
    velX,
    velY,
    mass,
    density,
    volume: vol,
    radius: r,
    isStatic,
    collisionType,
    color,
    forceX: 0,
    forceY: 0,
    gamma: 1,
  }
}
