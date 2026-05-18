export const G = 6.67430e-11
export const C = 299792458
export const C2 = C * C
export const SPEED_LIMIT = 0.999 * C

export const VACUUM_DRAG_COEFFICIENT = 1e-20
export const AU = 1.495978707e11

export const PLAYER_MASS = 1000
export const PLAYER_DENSITY = 1000
export const PLAYER_THRUST = 1e5

export const SOLAR_MASS = 1.9891e30
export const SOLAR_RADIUS = 6.9634e8

export const DEFAULT_ZOOM = 3e8
export const MIN_ZOOM = 1e4
export const MAX_ZOOM = 1e10

export const CAMERA_LERP = 0.08
export const CAMERA_PAN_LERP = 0.12

export const THRUST_LEVELS = [1e5, 1e6, 1e7]

export const TIME_SCALE_MAP: Record<string, number> = {
  '7': 1,
  '8': 60,
  '9': 3600,
  '0': 86400,
}
export const MAX_STEP_DT = 60
export const MAX_SIM_STEPS = 120

export const VEL_MAX_DISPLAY = 500e3
export const ACCEL_MAX_DISPLAY = 2000
export const VEL_ARROW_FRAC = 0.5
export const ACCEL_ARROW_FRAC = 0.35

export const MIN_SCREEN_RADIUS_PLANET = 3
export const MIN_SCREEN_RADIUS_SUN = 15
export const MIN_SCREEN_RADIUS_PLAYER = 5

export interface PlanetDefinition {
  label: string
  a: number
  e: number
  ω: number
  M0: number
  mass: number
  radius: number
  density: number
  color: string
}

export const PLANETS: PlanetDefinition[] = [
  {
    label: 'Mercury',
    a: 5.79091e10,
    e: 0.20563069,
    ω: 29.124 * Math.PI / 180,
    M0: 174.796 * Math.PI / 180,
    mass: 3.3010e23,
    radius: 2.4397e6,
    density: 5427,
    color: '#b0a090',
  },
  {
    label: 'Venus',
    a: 1.08209e11,
    e: 0.00677323,
    ω: 54.884 * Math.PI / 180,
    M0: 50.115 * Math.PI / 180,
    mass: 4.8673e24,
    radius: 6.0518e6,
    density: 5243,
    color: '#e8cda0',
  },
  {
    label: 'Earth',
    a: 1.495978707e11,
    e: 0.01671022,
    ω: 102.937 * Math.PI / 180,
    M0: 100.464 * Math.PI / 180,
    mass: 5.9722e24,
    radius: 6.3710e6,
    density: 5514,
    color: '#4488cc',
  },
  {
    label: 'Mars',
    a: 2.27937e11,
    e: 0.09341233,
    ω: 286.502 * Math.PI / 180,
    M0: 19.387 * Math.PI / 180,
    mass: 6.4169e23,
    radius: 3.3895e6,
    density: 3933,
    color: '#cc6644',
  },
  {
    label: 'Jupiter',
    a: 7.78479e11,
    e: 0.04839266,
    ω: 275.066 * Math.PI / 180,
    M0: 18.818 * Math.PI / 180,
    mass: 1.89813e27,
    radius: 6.9911e7,
    density: 1326,
    color: '#d4b896',
  },
  {
    label: 'Saturn',
    a: 1.43265e12,
    e: 0.05386179,
    ω: 336.013 * Math.PI / 180,
    M0: 320.347 * Math.PI / 180,
    mass: 5.6832e26,
    radius: 5.8232e7,
    density: 687,
    color: '#e8d5a0',
  },
  {
    label: 'Uranus',
    a: 2.87097e12,
    e: 0.04725744,
    ω: 96.541 * Math.PI / 180,
    M0: 142.956 * Math.PI / 180,
    mass: 8.6810e25,
    radius: 2.5362e7,
    density: 1271,
    color: '#88cccc',
  },
  {
    label: 'Neptune',
    a: 4.49840e12,
    e: 0.00859048,
    ω: 265.647 * Math.PI / 180,
    M0: 267.767 * Math.PI / 180,
    mass: 1.02410e26,
    radius: 2.4622e7,
    density: 1638,
    color: '#4466cc',
  },
]
