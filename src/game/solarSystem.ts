import { G, SOLAR_MASS, SOLAR_RADIUS, PLANETS, PLAYER_MASS, PLAYER_DENSITY } from './constants'
import { createGameObject, type GameObject } from './gameObjects'

const MU = G * SOLAR_MASS

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

function computeOrbitalState(a: number, e: number, ω: number, M0: number) {
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

  const h = Math.sqrt(MU * a * (1 - e * e))
  const vr = (MU / h) * e * Math.sin(nu)
  const vt = h / r

  const velX = vr * cosA - vt * sinA
  const velY = vr * sinA + vt * cosA

  return { posX, posY, velX, velY }
}

export function createSolarSystem() {
  const objects: GameObject[] = []

  objects.push(
    createGameObject({
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
  )

  for (const p of PLANETS) {
    const state = computeOrbitalState(p.a, p.e, p.ω, p.M0)
    objects.push(
      createGameObject({
        label: p.label,
        posX: state.posX,
        posY: state.posY,
        velX: state.velX,
        velY: state.velY,
        mass: p.mass,
        radius: p.radius,
        density: p.density,
        isStatic: false,
        collisionType: 'elastic',
        color: p.color,
      })
    )
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
