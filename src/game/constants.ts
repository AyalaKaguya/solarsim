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
export const TRAJECTORY_PREDICTION_STEPS = 180
export const TRAJECTORY_PREDICTION_DT = 120

export interface OrbitingBodyDefinition {
  label: string
  parentLabel: string
  a: number
  e: number
  ω: number
  M0: number
  mass: number
  radius: number
  density: number
  color: string
  direction?: 1 | -1
}

export const PLANETS: OrbitingBodyDefinition[] = [
  {
    label: 'Mercury',
    parentLabel: 'Sun',
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
    parentLabel: 'Sun',
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
    parentLabel: 'Sun',
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
    parentLabel: 'Sun',
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
    parentLabel: 'Sun',
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
    parentLabel: 'Sun',
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
    parentLabel: 'Sun',
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
    parentLabel: 'Sun',
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

export const SATELLITES: OrbitingBodyDefinition[] = [
  {
    label: 'Moon',
    parentLabel: 'Earth',
    a: 3.844e8,
    e: 0.0549,
    ω: 318.15 * Math.PI / 180,
    M0: 135.27 * Math.PI / 180,
    mass: 7.342e22,
    radius: 1.7374e6,
    density: 3344,
    color: '#cfcfcf',
  },
  {
    label: 'Phobos',
    parentLabel: 'Mars',
    a: 9.376e6,
    e: 0.0151,
    ω: 150 * Math.PI / 180,
    M0: 45 * Math.PI / 180,
    mass: 1.0659e16,
    radius: 1.12667e4,
    density: 1860,
    color: '#9f8d7a',
  },
  {
    label: 'Deimos',
    parentLabel: 'Mars',
    a: 2.34632e7,
    e: 0.0002,
    ω: 260 * Math.PI / 180,
    M0: 180 * Math.PI / 180,
    mass: 1.4762e15,
    radius: 6.2e3,
    density: 1471,
    color: '#a89a88',
  },
  {
    label: 'Io',
    parentLabel: 'Jupiter',
    a: 4.217e8,
    e: 0.0041,
    ω: 84 * Math.PI / 180,
    M0: 120 * Math.PI / 180,
    mass: 8.9319e22,
    radius: 1.8216e6,
    density: 3528,
    color: '#f6d17f',
  },
  {
    label: 'Europa',
    parentLabel: 'Jupiter',
    a: 6.711e8,
    e: 0.0094,
    ω: 219 * Math.PI / 180,
    M0: 15 * Math.PI / 180,
    mass: 4.7998e22,
    radius: 1.5608e6,
    density: 3013,
    color: '#d8d3c7',
  },
  {
    label: 'Ganymede',
    parentLabel: 'Jupiter',
    a: 1.0704e9,
    e: 0.0013,
    ω: 63 * Math.PI / 180,
    M0: 210 * Math.PI / 180,
    mass: 1.4819e23,
    radius: 2.6341e6,
    density: 1942,
    color: '#9a8d7b',
  },
  {
    label: 'Callisto',
    parentLabel: 'Jupiter',
    a: 1.8827e9,
    e: 0.0074,
    ω: 298 * Math.PI / 180,
    M0: 250 * Math.PI / 180,
    mass: 1.0759e23,
    radius: 2.4103e6,
    density: 1834,
    color: '#6f665d',
  },
  {
    label: 'Titan',
    parentLabel: 'Saturn',
    a: 1.22187e9,
    e: 0.0288,
    ω: 186 * Math.PI / 180,
    M0: 90 * Math.PI / 180,
    mass: 1.3452e23,
    radius: 2.5747e6,
    density: 1880,
    color: '#d9b977',
  },
  {
    label: 'Titania',
    parentLabel: 'Uranus',
    a: 4.363e8,
    e: 0.0011,
    ω: 30 * Math.PI / 180,
    M0: 300 * Math.PI / 180,
    mass: 3.527e21,
    radius: 7.889e5,
    density: 1710,
    color: '#bcb7af',
  },
  {
    label: 'Oberon',
    parentLabel: 'Uranus',
    a: 5.835e8,
    e: 0.0014,
    ω: 300 * Math.PI / 180,
    M0: 150 * Math.PI / 180,
    mass: 3.014e21,
    radius: 7.614e5,
    density: 1630,
    color: '#8f8a82',
  },
  {
    label: 'Triton',
    parentLabel: 'Neptune',
    a: 3.54759e8,
    e: 0.000016,
    ω: 160 * Math.PI / 180,
    M0: 250 * Math.PI / 180,
    mass: 2.14e22,
    radius: 1.3534e6,
    density: 2061,
    color: '#d2c8bd',
    direction: -1,
  },
]
