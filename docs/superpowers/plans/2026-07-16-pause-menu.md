# Pause Menu Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans or implement task-by-task.

**Goal:** ESC pause overlay with Resume / Quit to Meta Hub / Quit to Menu; freeze run; CRT look.

**Architecture:** `#pause-overlay` DOM + `paused` flag in `GameApp`; styles in `styles.ts`.

## Tasks

- [x] Styles for `#pause-overlay` (CRT, match upgrade)
- [x] GameApp: overlay, open/close, ESC routing, freeze frame loop, abandon quit
- [x] Verify tsc/tests
