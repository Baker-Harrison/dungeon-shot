# Pause Menu Design

Date: 2026-07-16  
Scope: In-run pause overlay (`GameApp` DOM UI) toggled with Escape

## Goal

Add a proper pause menu during FPS runs: freeze gameplay, exit pointer lock, and offer Resume, Quit to Meta Hub, and Quit to Menu — styled like the CRT upgrade overlay.

## Non-goals

- No settings/options/volume
- No restart-run action
- No Phaser scene work
- No currency payout on abandon
- No pause during menu / hub / results

## Approach

DOM `#pause-overlay` in `GameApp`, matching CRT phosphor styling used by `#upgrade-overlay`. A `paused` flag skips run simulation while open.

## Behavior

### Open / close

| Input | Effect |
|-------|--------|
| ESC while run, map closed, not upgrading, not wiping/ending | Open pause |
| ESC while map open | Close map only (existing); do not open pause on same press |
| ESC while paused | Resume (same as Resume button) |
| ESC while upgrade overlay open | No-op (finish pick first) |
| `[ RESUME ]` | Close pause, request pointer lock |
| `[ QUIT TO META HUB ]` | Abandon run → clear world/UI → `showHub()` |
| `[ QUIT TO MENU ]` | Abandon run → clear world/UI → `showMenu()` |

### Freeze

While paused:

- Do not update controller, enemies, projectiles, firing, door travel, or room-clear logic
- Clear `fireHeld` on open; exit pointer lock
- Keep rendering the frozen 3D view under the overlay
- Map toggle (M) ignored while paused

### Abandon run

Quitting does **not** call `endRun` and does **not** award `currencyEarned`. Discard in-progress run state by clearing the world and leaving the run screen. No results panel.

### Misclick safety

Same spirit as upgrade picker: options arm after **~300ms** and require a fresh pointerdown→pointerup (or click after arm) so ESC→cursor-at-center cannot instantly hit Quit. Keyboard shortcuts optional: none required beyond ESC to resume.

## Visual

Reuse CRT language from upgrade overlay:

- Green-tinted dim + scanlines + vignette
- Centered panel, title `PAUSED`
- Three stacked option rows (Resume primary mint; quit actions slightly muted or same)
- Footer: `ESC TO RESUME`

## Files

| File | Change |
|------|--------|
| `src/ui/dom/styles.ts` | `#pause-overlay` CRT styles (can share patterns with upgrade) |
| `src/app/GameApp.ts` | Overlay markup, ESC routing, `paused` freeze, quit paths |

## Acceptance

- ESC pauses a run; world freezes; mouse unlocks
- Resume / ESC returns to play with pointer lock
- Quit paths leave run without awarding currency or showing results
- Map ESC still only closes map; upgrade picker not interrupted by pause
- Look consistent with CRT upgrade panel
