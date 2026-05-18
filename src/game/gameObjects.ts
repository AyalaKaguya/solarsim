let nextId = 0

export type CollisionType = 'elastic' | 'inelastic' | 'fragment'

export interface GameObject {
  id: string
  label: string
  posX: number
  posY: number
  velX: number
  velY: number
  mass: number
  density: number
  volume: number
  radius: number
  isStatic: boolean
  collisionType: CollisionType
  color: string
  forceX: number
  forceY: number
  gamma: number
}

export interface CreateGameObjectOptions {
  label?: string
  posX?: number
  posY?: number
  velX?: number
  velY?: number
  mass?: number
  density?: number
  volume?: number | null
  radius?: number | null
  isStatic?: boolean
  collisionType?: CollisionType
  color?: string
}

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
}: CreateGameObjectOptions): GameObject {
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
