# Sectioned Complex Dungeons — Design

## Goal
Replace the single empty-room path with seeded multi-section runs: larger chambers with interior collision layouts, mini-boss gates, iris wipe between sections, and fog-of-war maps.

## Structure
- Run: start → 2–4 sections → final boss.
- Each section: branched graph of combat chambers (side paths, dead ends, occasional loops).
- Section end: mini-boss room (except last section ends at final boss).
- Intra-section travel: normal door hop.
- Leaving a cleared mini-boss via the section-exit door: black iris wipe (close in, then open out), then load next section start.

## Chambers
- Per-room size from seeded table (M / L / XL); mini-boss and boss prefer larger open arenas.
- Layout templates add axis-aligned obstacle rects (pillars, center block, split lanes, alcoves).
- Still one loaded chamber at a time (existing `loadRoom` model).

## Maps
- HUD minimap (top-right): visited rooms solid; neighbors of visited rooms fogged; current room highlighted.
- `M`: fullscreen pause map with legend; `M` / `Esc` closes. Prior sections remain visible (dimmer).

## Non-goals
Overworld, keys/inventory, real art, continuous multi-room camera.
