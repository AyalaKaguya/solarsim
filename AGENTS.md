# AGENTS.md

## Project Scope

- This repo is a browser-based spaceflight sandbox built with Vite, TypeScript, and Konva.
- There is no framework — the entry point is a vanilla TypeScript file [src/main.ts](src/main.ts).
- The real application entry point is `GameEngine` in [src/game/engine.ts](src/game/engine.ts).

## Run And Validate

- Install dependencies with `bun i` or `npm install`.
- Start local development with `npm run dev`.
- Build before handing off changes with `npm run build`.
- Run lint after TypeScript or React changes with `npm run lint`.
- There is no automated test suite in this workspace; validate gameplay changes manually in the browser.

## Architecture

- [src/game/engine.ts](src/game/engine.ts) owns the RAF loop, Konva stage/layers, HUD text, camera follow, resize handling, and object-to-node synchronization.
- [src/game/physics.ts](src/game/physics.ts) computes gravity, drag, thrust, relativistic gamma, integration, and speed limiting.
- [src/game/collision.ts](src/game/collision.ts) owns collision detection and response.
- [src/game/input.ts](src/game/input.ts) owns keyboard, mouse wheel, and middle-mouse pan handling.
- [src/game/camera.ts](src/game/camera.ts) owns zoom, pan offsets, coordinate transforms, and visibility-safe zoom-out behavior.
- [src/game/solarSystem.ts](src/game/solarSystem.ts) creates the initial solar system and spawns the player near Earth.
- Shared tuning values and planet definitions live in [src/game/constants.ts](src/game/constants.ts); add new simulation constants there instead of scattering literals.
- All systems operate on mutable `GameObject` records from [src/game/gameObjects.ts](src/game/gameObjects.ts).

## Konva Layer Layout (top to bottom)

| Layer | Content |
|---|---|
| `orbitLayer` | Dashed ellipses for 19 orbiting bodies (8 planets + 11 moons) |
| `predictionLayer` | Dashed trajectory prediction line |
| `gameLayer` | Planet/player Circle nodes + velocityArrow + forceArrow |
| `hudLayer` | 6 Konva.Text elements (speed, force, gamma, thrust, time, zoom) |

## TypeScript

- Strict mode is enabled in [tsconfig.json](tsconfig.json); all files are `.ts` / `.tsx`.
- Key types:
  - `GameObject` and `CollisionType` (`'elastic' | 'inelastic' | 'fragment'`) in [src/game/gameObjects.ts](src/game/gameObjects.ts)
  - `OrbitingBodyDefinition` in [src/game/constants.ts](src/game/constants.ts) — used by `PLANETS` and `SATELLITES` arrays
  - `VelocityReferenceMode` (`'off' | 'solar' | 'dominant-body'`) in [src/game/input.ts](src/game/input.ts)
- Linting is configured in [eslint.config.js](eslint.config.js) with `typescript-eslint` recommended rules.

## Controls

| Key | Action |
|---|---|
| `WASD` / Arrow keys | Absolute-direction thrust |
| `Z` | Prograde thrust (aligned with current velocity) |
| `X` | Retrograde thrust (opposite velocity); holding X alone enables velocity brake |
| `1` / `2` / `3` | Thrust level (1e5 / 4e5 / 1.6e6 N) |
| `7` / `8` / `9` / `0` | Time scale (1x second / 60x minute / 3600x hour / 86400x day) |
| `+` / `-` | Fine-tune time scale ±10x |
| `I` | Cycle force-vector display: OFF → AUTO → SHOW |
| `J` | Cycle velocity reference mode: off → solar-relative → dominant-body-relative |
| `K` | Toggle trajectory prediction line |
| Mouse wheel | Zoom in/out |
| Middle-mouse drag | Pan camera (auto-decays to follow player) |

## Physics Notes

- All physics in SI units (m, kg, s, N). `c = 299792458 m/s` (real value).
- Hard speed cap at `0.999c`.
- Relativistic momentum integration: `p += F*dt`, then `v` derived from `p / (m * gamma)`.
- `gamma` clamped to `beta² ≤ 0.998001` to avoid overflow.
- Gravity uses `effectiveDist = max(dist, rA + rB)` — surface clamp, never skipped during overlap.
- `VACUUM_DRAG_COEFFICIENT = 1e-20` — negligible numeric stabilizer.
- Time acceleration multiplies the sim dt; each substep max `60 s`, max `120` substeps/frame.
- Collision system uses a `COLLISION_HANDLERS` registry with `elastic` (implemented), `inelastic` and `fragment` (throw on call).

## Solar System

- 1 Sun (static) + 8 planets + 11 moons, all positioned via Keplerian elements at J2000.0 epoch.
- Newton-Raphson solver for Kepler equation, 30 iterations, 1e-14 tolerance.
- Moons: Moon (Earth), Phobos+Deimos (Mars), Io+Europa+Ganymede+Callisto (Jupiter), Titan (Saturn), Titania+Oberon (Uranus), Triton (Neptune, retrograde `direction: -1`).
- Player spawns in LEO 400 km above Earth, assigned Earth's orbital velocity + circular LEO speed.
- Minimum screen radii: planets 3px, Sun 15px, player 5px.

## Editing Guidance

- Preserve the thin entry point; most gameplay changes belong under [src/game](src/game).
- When adding a new body, use the `OrbitingBodyDefinition` interface and `createOrbitingBody()` helper, or `createGameObject()` for non-orbiting bodies.
- If you add or remove runtime objects, confirm `_syncNodes()` and `_syncOrbitGuides()` still track them.
- Keep new physics, camera, and HUD tuning values in [src/game/constants.ts](src/game/constants.ts).
- Be cautious with large world-space numbers and relativistic calculations; small math changes can create unstable behavior quickly.
- Keep lifecycle cleanup intact: `engine.destroy()` must cancel RAF, remove resize listener, detach input, and destroy the Konva stage.

## Project Notes

- [README.md](README.md) is still the default Vite template, so do not treat it as authoritative project documentation.
