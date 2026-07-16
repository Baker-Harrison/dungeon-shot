# Three.js First-Person Port — Design

## Goal
Replace Phaser 2D twin-stick with a Three.js first-person dungeon crawler while preserving sectioned generation, combat, upgrades, meta, iris transitions, and fog maps.

## Stack
- Vite + TypeScript + Three.js
- DOM/HTML/CSS for Menu, Meta Hub, Upgrade Pick, Results, HUD, Map (`M`), iris wipe
- Custom XZ AABB + player capsule collision (no physics engine)

## Controls
Pointer lock; WASD move; mouse look; LMB shoot; `M` map; Esc releases pointer / closes map.

## Coordinates
Room local 2D `(x, y)` → Three `(x, 0, z)` with scale `1/40` from legacy pixel sizes. Floor y=0; eye height 1.6; walls height ~3.

## Parity
Keep dungeon gen, layouts, session/meta/upgrades/enemies. One chamber loaded at a time. Mini-boss clear → upgrade → exit door → iris → next section.
