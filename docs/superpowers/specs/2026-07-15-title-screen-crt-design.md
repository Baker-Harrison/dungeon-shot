# Title Screen CRT Arcade Design

Date: 2026-07-15  
Scope: `MenuScene` visual polish only

## Goal

Replace the flat navy title screen with an arcade CRT / phosphor aesthetic so the menu feels unique, while keeping `[ START RUN ]` and `[ META HUB ]` behavior and look intact.

## Non-goals

- No CSS overlays or WebGL CRT shaders
- No new image assets or font files
- No changes to Meta Hub, Run, or Results scenes
- No redesign of button labels, colors, or interaction model

## Approach

Pure Phaser graphics in `MenuScene` (shapes, text, tweens). Matches the prototype rectangle art style and stays lightweight.

## Visual system

### Palette (title screen only)

- Base fill: near-black with deep phosphor green tint (e.g. `#050806`–`#0a120e`)
- Scanlines: dark translucent horizontals
- Title: bright phosphor green / off-white with soft glow
- Secondary info: muted phosphor grey-green
- Buttons: keep existing mint (`#68d391`) and sky (`#63b3ed`) with current hover brightening

### Layout

1. Full-bleed CRT background (fill + vignette + scanlines)
2. `DUNGEON SHOT` as hero title (larger than today, centered upper third)
3. Faint centered crosshair / grid motif behind the title, plus a thin rule under the title — subtle, not competing with brand
4. Buttons in the same positions/style as today
5. Meta currency as a small quiet line just under the buttons — e.g. `CREDITS 0` — no controls lecture

### Copy changes

| Keep | Remove |
|------|--------|
| `DUNGEON SHOT` | `Twin-stick dungeon roguelite` |
| `[ START RUN ]` | `WASD move · Mouse aim/fire` |
| `[ META HUB ]` | |
| Meta currency value (quietly) | |

## Motion

1. **Title phosphor breathe** — slow alpha/tint pulse on title glow (~2–3s loop)
2. **Scanline drift or flicker** — subtle vertical offset or opacity flicker so the CRT feels alive
3. **Button hover** — keep existing color brighten; optional faint underline/cursor blink on hover only

Motion must stay restrained: noticeable in a few seconds of looking, never distracting.

## Technical notes

- Implement atmosphere with Phaser `Graphics` / stacked rectangles (vignette via dark edge rects or radial-ish layered fills; scanlines via repeated thin rects or a tiled texture generated at runtime)
- Depth order: background → vignette/scanlines → decorative motif → title → buttons → currency
- Keyboard shortcuts (`ENTER` / `SPACE` → start run) unchanged
- Prefer keeping CRT helpers local to `MenuScene` unless a tiny shared helper clearly reduces clutter

## Success criteria

- Title screen no longer reads as “blank blue + filler text”
- CRT/phosphor identity is obvious at a glance
- Both buttons still work exactly as today (click + hover)
- Meta currency still visible without dominating
- No new dependencies or external assets
