# solarsim

A browser-based relativistic spaceflight sandbox. Navigate a spacecraft through an N-body simulation of the solar system, with real orbital mechanics, relativistic effects, and accurate planetary data.

## Setup

```bash
npm install
npm run dev
```

Open the URL printed by Vite (default `http://localhost:5173`).

## Controls

| Key | Action |
|---|---|
| WASD / Arrow keys | Thrust in absolute directions |
| Z | Prograde thrust (aligned with velocity) |
| X | Retrograde thrust; hold X alone for velocity brake |
| 1 / 2 / 3 | Thrust level: 1e5 / 4e5 / 1.6e6 N |
| 7 / 8 / 9 / 0 | Time scale: 1x (second) / 60x (minute) / 3600x (hour) / 86400x (day) |
| + / - | Fine-tune time scale by 10x |
| I | Cycle force-vector display: OFF / AUTO / SHOW |
| J | Cycle velocity reference mode: off / solar-relative / dominant-body-relative |
| K | Toggle trajectory prediction line |
| Mouse wheel | Zoom in/out |
| Middle-mouse drag | Pan camera (auto-decays back to player) |

## Architecture

The game runs entirely on a Konva Canvas managed by `GameEngine` in `src/game/engine.ts`. There is no framework -- `src/main.ts` is a thin entry point that instantiates the engine.

| Module | File | Purpose |
|---|---|---|
| Engine | `game/engine.ts` | RAF loop, Konva stage/layers, HUD, rendering, object-to-node sync |
| Physics | `game/physics.ts` | N-body gravity, vacuum drag, relativistic momentum integration, speed cap |
| Collision | `game/collision.ts` | Circle-circle detection, elastic impulse response, extensible handler registry |
| Input | `game/input.ts` | Keyboard state, mouse wheel zoom, middle-mouse pan |
| Camera | `game/camera.ts` | Follow, zoom, pan, world/screen coordinate transforms, auto-zoom-out |
| Solar System | `game/solarSystem.ts` | Keplerian position/velocity solver, 1 sun + 8 planets + 11 moons |
| Constants | `game/constants.ts` | Physical constants, tuning values, planet/moon definitions |

## Physics

All simulation runs in SI units (meters, kilograms, seconds, newtons). Key features:

- Newtonian gravity with relativistic mass (`m_eff = m_rest * gamma`).
- Lorentz factor computed from velocity, clamped at `beta^2 <= 0.998001`.
- Speed capped at `0.999c` (real value of c = 299,792,458 m/s).
- Gravitational force uses `max(dist, rA + rB)` to cap at surface value -- never skips gravity during overlap.
- Vacuum drag coefficient of `1e-20` for numerical stability.
- Fixed-timestep sub-stepping: max 60 simulation seconds per step, up to 120 steps per frame.
- Relativistic momentum integration: `p += F * dt`, then velocity derived from `p / (m * gamma)`.
- Collision system uses a handler registry. `elastic` is implemented; `inelastic` and `fragment` throw NotImplemented.

## Solar System Data

Planetary positions and velocities are computed from Keplerian orbital elements at the J2000.0 epoch via Newton-Raphson iteration (30 iterations, 1e-14 tolerance). Bodies include:

- 1 Sun (static at origin)
- 8 planets: Mercury through Neptune
- 11 moons: Moon (Earth), Phobos & Deimos (Mars), Io, Europa, Ganymede & Callisto (Jupiter), Titan (Saturn), Titania & Oberon (Uranus), Triton (Neptune, retrograde)

The player spawns in Low Earth Orbit, 400 km above Earth's surface, with Earth's orbital velocity plus LEO circular speed.

## Build

```bash
npm run build    # production bundle to dist/
npm run lint     # ESLint with typescript-eslint
```
