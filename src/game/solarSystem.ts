import {
  G,
  SOLAR_MASS,
  SOLAR_RADIUS,
  PLANETS,
  SATELLITES,
  PLAYER_MASS,
  PLAYER_DENSITY,
  type OrbitingBodyDefinition,
} from './constants'
import { createGameObject, type GameObject } from './gameObjects'

function solveKepler(M: number, e: number): number {
  let E = M
  for (let i = 0; i < 30; i++) {
    const sinE = Math.sin(E)
    const cosE = Math.cos(E)
    const dE = (E - e * sinE - M) / (1 - e * cosE)
    E -= dE
    if (Math.abs(dE) < 1e-14) break
  }
  return E
}

function computeOrbitalState(
  a: number,
  e: number,
  ω: number,
  M0: number,
  mu: number,
  direction: 1 | -1 = 1,
) {
  const E = solveKepler(M0, e)
  const cosE = Math.cos(E)
  const sinE = Math.sin(E)

  const cosNu = (cosE - e) / (1 - e * cosE)
  const sinNu = (Math.sqrt(1 - e * e) * sinE) / (1 - e * cosE)
  const nu = Math.atan2(sinNu, cosNu)
  const r = a * (1 - e * cosE)

  const angle = nu + ω
  const cosA = Math.cos(angle)
  const sinA = Math.sin(angle)

  const posX = r * cosA
  const posY = r * sinA

  const h = Math.sqrt(mu * a * (1 - e * e))
  const vr = (mu / h) * e * Math.sin(nu)
  const vt = h / r

  const velX = vr * cosA - direction * vt * sinA
  const velY = vr * sinA + direction * vt * cosA

  return { posX, posY, velX, velY }
}

function createOrbitingBody(definition: OrbitingBodyDefinition, parent: GameObject): GameObject {
  const state = computeOrbitalState(
    definition.a,
    definition.e,
    definition.ω,
    definition.M0,
    G * parent.mass,
    definition.direction,
  )

  return createGameObject({
    label: definition.label,
    posX: parent.posX + state.posX,
    posY: parent.posY + state.posY,
    velX: parent.velX + state.velX,
    velY: parent.velY + state.velY,
    mass: definition.mass,
    radius: definition.radius,
    density: definition.density,
    isStatic: false,
    collisionType: 'elastic',
    color: definition.color,
  })
}

export function createSolarSystem() {
  const objects: GameObject[] = []
  const bodyByLabel = new Map<string, GameObject>()

  const sun = createGameObject({
    label: 'Sun',
    posX: 0,
    posY: 0,
    velX: 0,
    velY: 0,
    mass: SOLAR_MASS,
    radius: SOLAR_RADIUS,
    density: 1408,
    isStatic: true,
    collisionType: 'elastic',
    color: '#f5c842',
  })
  objects.push(sun)
  bodyByLabel.set(sun.label, sun)

  for (const p of PLANETS) {
    const parent = bodyByLabel.get(p.parentLabel)
    if (!parent) throw new Error(`Parent body ${p.parentLabel} not found for ${p.label}`)
    const planet = createOrbitingBody(p, parent)
    objects.push(planet)
    bodyByLabel.set(planet.label, planet)
  }

  for (const satellite of SATELLITES) {
    const parent = bodyByLabel.get(satellite.parentLabel)
    if (!parent) throw new Error(`Parent body ${satellite.parentLabel} not found for ${satellite.label}`)
    const moon = createOrbitingBody(satellite, parent)
    objects.push(moon)
    bodyByLabel.set(moon.label, moon)
  }

  return objects
}

export function createPlayer(earth: GameObject): GameObject {
  const orbitRadius = earth.radius + 400000
  const orbitalSpeed = Math.sqrt(G * earth.mass / orbitRadius)
  const player = createGameObject({
    label: 'Player',
    posX: earth.posX + orbitRadius,
    posY: earth.posY,
    velX: earth.velX,
    velY: earth.velY + orbitalSpeed,
    mass: PLAYER_MASS,
    density: PLAYER_DENSITY,
    collisionType: 'elastic',
    color: '#3399ff',
  })
  return player
}
