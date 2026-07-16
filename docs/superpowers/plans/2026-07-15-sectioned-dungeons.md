# Sectioned Complex Dungeons — Implementation Plan

> **For agentic workers:** Work task-by-task. Prefer TDD for generation/layout pure logic.

**Goal:** Ship sectioned dungeon gen, sized layout rooms, mini-boss + iris wipe, minimap + M map.

## Task 1: Types + generation + tests
- Extend `RoomType`, `RoomNode`, `Dungeon`, `RunState`.
- Rewrite `generateDungeon`; update `generate.test.ts`.

## Task 2: Room size + layouts
- Parameterize `Door` / `buildRoomWalls` / spawn by room w×h.
- Add `layouts.ts`; wire obstacles in `RunScene.loadRoom`.

## Task 3: Mini-boss + iris
- Add `miniBoss` enemy + texture.
- Section-exit door after mini-boss clear; iris wipe into next section.

## Task 4: Maps
- `Minimap` HUD + `MapScene` on M; register in `main.ts`.
