# Title Screen CRT Arcade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give `MenuScene` an arcade CRT / phosphor look while keeping the existing bracket buttons and start-run flow.

**Architecture:** Build atmosphere entirely inside `MenuScene` with Phaser rectangles, graphics, text, and tweens. No shaders, CSS overlays, or new assets. CRT helpers stay local to the scene file.

**Tech Stack:** Phaser 3, TypeScript, Vite

## Global Constraints

- Keep `[ START RUN ]` and `[ META HUB ]` labels, colors, hover, and click behavior
- Remove subtitle and WASD/controls copy
- Keep meta currency visible as a quiet line under the buttons
- Pure Phaser graphics only — no CSS CRT overlay, no WebGL shaders, no new fonts/images
- Do not change Meta Hub, Run, or Results scenes
- Do not commit unless the user explicitly asks

---

## File Structure

| File | Responsibility |
|------|----------------|
| `src/scenes/MenuScene.ts` | All title-screen CRT visuals, copy, motion, and button wiring |
| `docs/superpowers/specs/2026-07-15-title-screen-crt-design.md` | Approved design (reference only; no edits required) |

No new source files — helpers are private methods on `MenuScene`.

---

### Task 1: CRT background + copy cleanup in MenuScene

**Files:**
- Modify: `src/scenes/MenuScene.ts`

**Interfaces:**
- Consumes: `GAME_WIDTH`, `GAME_HEIGHT` from `src/util/constants.ts`; `getMeta`, `startNewRun` from `src/state/session.ts`; `makeSeed` from `src/util/rng.ts`
- Produces: `MenuScene.create()` renders CRT atmosphere and cleaned copy; private helpers `drawCrtBackground()`, `drawTitleMotif()`, `wireButtons()`

- [x] **Step 1: Replace flat navy fill and filler copy with CRT atmosphere**

Rewrite `src/scenes/MenuScene.ts` to:

1. Draw near-black phosphor base (`0x050806`)
2. Draw soft vignette (layered dark edge rects or concentric semi-transparent fills)
3. Draw horizontal scanlines (thin dark rects every 3–4px, low alpha)
4. Draw faint centered crosshair / grid motif behind the title
5. Title `DUNGEON SHOT` larger (~56–64px), phosphor green (`#9ae6b4` or similar), with a soft glow twin text behind it at lower alpha
6. Thin horizontal rule under the title
7. Keep buttons at same Y positions (~400 / ~460) with same colors/hover/handlers
8. Show `CREDITS ${meta.currency}` quietly under buttons (~520), muted grey-green
9. Remove `Twin-stick dungeon roguelite` and WASD/controls text
10. Tween: title glow alpha breathe (~2.5s yoyo loop); scanline container slight alpha flicker or 1px vertical drift loop
11. Optional: on button hover, show a faint underscore under that button; hide on out
12. Keep `ENTER` / `SPACE` → `beginRun()`

Target structure:

```typescript
import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../util/constants';
import { getMeta, startNewRun } from '../state/session';
import { makeSeed } from '../util/rng';

const CRT = {
  bg: 0x050806,
  phosphor: '#9ae6b4',
  phosphorDim: '#4a7c59',
  muted: '#6b8f71',
  start: '#68d391',
  startHover: '#9ae6b4',
  hub: '#63b3ed',
  hubHover: '#90cdf4',
} as const;

export class MenuScene extends Phaser.Scene {
  constructor() {
    super('Menu');
  }

  create(): void {
    const meta = getMeta();
    this.drawCrtBackground();
    this.drawTitleMotif();
    // title + glow + rule + buttons + credits
    // tweens for glow breathe + scanline flicker
    this.input.keyboard?.once('keydown-ENTER', () => this.beginRun());
    this.input.keyboard?.once('keydown-SPACE', () => this.beginRun());
  }

  private drawCrtBackground(): void { /* base, vignette, scanlines */ }
  private drawTitleMotif(): void { /* faint crosshair/grid */ }
  private beginRun(): void {
    startNewRun(getMeta(), makeSeed());
    this.scene.start('Run');
  }
}
```

Implement the full file with working visuals — do not leave stubs.

- [x] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: exit 0, no errors in `MenuScene.ts`

- [x] **Step 3: Visual verify in browser**

Run: `npm run dev` (if not already running)
Open the game, confirm:
- CRT/phosphor look is obvious (not flat navy)
- No subtitle / controls blurb
- Both buttons work (click + hover)
- Credits line shows under buttons
- Title glow breathes; scanlines feel slightly alive

---

## Spec coverage

| Spec requirement | Task |
|------------------|------|
| Phosphor near-black bg + scanlines + vignette | Task 1 |
| Hero title with glow breathe | Task 1 |
| Crosshair/grid + thin rule | Task 1 |
| Keep buttons as-is | Task 1 |
| Quiet credits under buttons | Task 1 |
| Remove filler copy | Task 1 |
| Pure Phaser, no shaders/CSS/assets | Task 1 |
| Keyboard shortcuts unchanged | Task 1 |
