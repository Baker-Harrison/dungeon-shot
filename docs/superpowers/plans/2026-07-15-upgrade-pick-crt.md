# Upgrade Pick CRT Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** CRT/phosphor restyle of the in-run upgrade overlay plus arm delay so shoot-clicks cannot auto-pick.

**Architecture:** DOM overlay in `GameApp` + CSS in `styles.ts`; `Input.clearFire()` for held-button reset; overlay arms after 450ms and mouse-up.

**Tech Stack:** TypeScript, DOM/CSS (no new assets)

## Global Constraints

- Match title CRT palette (phosphor green, scanlines, near-black green tint)
- No Phaser scene changes; no new fonts/assets
- Arm only after 450ms AND mouse up; keys only when armed
- Clean up listeners/timers on pick

---

### Task 1: Clear fire-held on Input

**Files:**
- Modify: `src/fps/input.ts`

- [x] Add `clearFire(): void { this.fireHeld = false; }`
- [x] Manual check: method exists and is callable from GameApp

---

### Task 2: CRT styles for upgrade overlay

**Files:**
- Modify: `src/ui/dom/styles.ts`

- [x] Style `#upgrade-overlay` with green-tinted wash, scanlines (::before), vignette optional
- [x] Panel / title / option rows / footer / `.disarmed` / `.armed` states
- [x] Disable pointer on options while `.disarmed`; enable when `.armed`

---

### Task 3: Rebuild openUpgrade / pickUpgrade with arm gate

**Files:**
- Modify: `src/app/GameApp.ts`

- [x] Track `upgradeArmTimer`, `upgradeKeyHandler`, `upgradeArmed`
- [x] `openUpgrade`: clear fire, build CRT markup, disarmed, schedule arm after 450ms if mouse up (poll or listen mouseup)
- [x] Single keydown handler for 1/2/3 when armed
- [x] `pointerup` on options when armed
- [x] `pickUpgrade`: clear timers/listeners, existing apply/hide/relock flow

---

### Task 4: Verify

- [x] `npm test` (existing) if quick
- [ ] Manual: clear room while holding LMB → overlay shows, no pick until release + delay; 1/2/3 and click work after arm
