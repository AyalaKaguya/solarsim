# AGENTS.md

## Project Scope

- This repo is a browser-based spaceflight sandbox built with React, Vite, TypeScript, and Konva.
- React is only the mount layer in [src/App.tsx](src/App.tsx) and [src/main.tsx](src/main.tsx).
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

## Editing Guidance

- Preserve the thin React shell unless the task is explicitly about app-level UI; most gameplay changes belong under [src/game](src/game).
- When adding a new body or dynamic object, prefer the existing factories `createGameObject`, `createSolarSystem`, and `createPlayer` over ad hoc object literals.
- If you add or remove runtime objects, confirm the visual layer still stays in sync through the engine's `nodeMap` and `_syncNodes` flow.
- Keep new physics, camera, and HUD tuning values in [src/game/constants.ts](src/game/constants.ts) so the simulation remains debuggable.
- Be cautious with large world-space numbers and relativistic calculations; small math changes can create unstable behavior quickly.
- Keep lifecycle cleanup intact: engine destruction must remove listeners, detach input handlers, cancel RAF, and destroy the Konva stage.

## Controls And Manual Checks

- Movement thrust uses `WASD` or arrow keys.
- Thrust level uses `1`, `2`, `3`.
- Time scale uses `7`, `8`, `9`, `0`.
- Force-vector display mode toggles with `i`.
- Mouse wheel zooms and middle mouse drag pans.
- For manual validation, confirm the player still spawns near Earth, thrust changes velocity, zoom and pan still work, and HUD values continue updating.

## Project Notes

- [README.md](README.md) is still the default Vite template, so do not treat it as authoritative project documentation.
- TypeScript is strict via [tsconfig.json](tsconfig.json), and linting is configured in [eslint.config.js](eslint.config.js).