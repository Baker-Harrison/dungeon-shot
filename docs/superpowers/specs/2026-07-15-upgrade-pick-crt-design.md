# Upgrade Pick CRT Design

Date: 2026-07-15  
Scope: In-run upgrade picker UI (`#upgrade-overlay` in Three.js `GameApp`) + accidental-click guard

## Goal

Make the post-clear upgrade picker feel like the CRT / phosphor title screen, and stop held shoot clicks from accidentally selecting an upgrade when pointer lock ends and the overlay appears under the crosshair.

## Non-goals

- No Phaser `UpgradePickScene` changes
- No new image assets or font files
- No changes to upgrade effects, roll logic, or meta hub purchases
- No WebGL CRT shader

## Approach

Restyle and harden the existing DOM overlay in `GameApp` (Approach A). CSS for CRT look; arm/disarm logic for input safety.

## Visual system

### Palette (aligned with title CRT)

- Overlay wash: near-black with deep phosphor green tint (e.g. `rgba(5, 8, 6, 0.88)`)
- Scanlines: repeating dark translucent horizontals via CSS gradient
- Title: bright phosphor green (`#9ae6b4`)
- Option primary: mint (`#68d391`)
- Option secondary / description: muted grey-green
- Borders: dark green (`#2d4a3e`), brighten on hover/focus when armed

### Layout

1. Full-screen dim + scanlines + soft vignette
2. Centered terminal panel (not three giant centered buttons alone)
3. Header `CHOOSE AN UPGRADE` with thin rule underneath
4. Three stacked option rows: `[1] Name` on first line, description muted below
5. Footer hint: `PRESS 1–3 · CLICK WHEN READY` (while disarming, show wait copy instead)

Options stay as interactive rows (buttons), but visually read as terminal menu lines rather than sparse outlined boxes.

### Motion (light)

- Overlay fade-in (~150–200ms)
- Options may soft-fade or slide in slightly staggered
- No heavy glow stacks or bouncing

## Misclick safety

Root cause: overlay opens under screen center while LMB may still be held from shooting; pointer unlock also places the cursor on the options.

### Rules

1. On `openUpgrade`: exit pointer lock, clear `fireHeld` on `Input`, show overlay in **disarmed** state (`pointer-events: none` on options, or `disabled` + no key handlers yet).
2. Arm only when **both** are true:
   - at least **450ms** since overlay open
   - primary mouse button is **up** (not held)
3. While disarmed: options visible but not selectable; footer can say e.g. `RELEASE TO CHOOSE…`
4. Once armed: enable `pointerup` (not raw `click` alone) on options; enable keys `1` / `2` / `3`.
5. A `pointerup` that completes the shoot-release used to open the menu must not count — arm requires mouse already up *after* the delay, or ignore the first release if it was held at open. Prefer: do not arm until mouse is up; only then start accepting new `pointerdown`→`pointerup` or key presses.
6. On pick: apply upgrade, hide overlay, clear key listeners / arm timers, unlock doors as today, request pointer lock again.

### Key handling

Replace the current per-button leaky `keydown` listeners with a single overlay-scoped handler that only fires while the overlay is shown and armed, and is removed on pick/close.

## Files

| File | Change |
|------|--------|
| `src/ui/dom/styles.ts` | CRT styles for `#upgrade-overlay` (scanlines, panel, option rows, armed/disarmed) |
| `src/app/GameApp.ts` | Rebuild overlay markup; arm delay + mouse-up gate; cleanup listeners; clear `fireHeld` |
| `src/fps/input.ts` | Expose a way to clear `fireHeld` (small public method) if not already accessible |

## Acceptance

- After a combat clear, upgrade UI reads as CRT/phosphor terminal, consistent with title palette
- Holding LMB through room clear cannot select an upgrade
- Rapid click at the exact moment the overlay appears cannot select until armed
- Keys 1–3 work only when armed; pick still applies upgrade and returns to FPS play
- No leftover key listeners after pick
