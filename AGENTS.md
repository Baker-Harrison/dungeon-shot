## Learned User Preferences
- Do not use agent skills unless the user explicitly asks for a skill or names one
- Prefers building games in the browser
- Prefers a short procedural dungeon-crawl MVP before overworld or hub exploration
- Prefers Phaser 3 + TypeScript + Vite over thinner custom renderer stacks for this project
- Prefers twin-stick controls (WASD move, mouse aim/fire) over melee-hybrid or auto-aim
- Prefers prototype colored-rectangle art for v1 so gameplay ships before real assets
- Wants temporary in-run upgrades (pick 1 of 3 after each combat clear) plus permanent meta upgrades between runs

## Learned Workspace Facts
- Project is a browser top-down Zelda-like twin-stick roguelite MVP
- Stack is Vite + TypeScript + Phaser 3; desktop browser first
- Architecture uses Phaser scenes with a seeded room-graph dungeon (doors lock until clear), not a continuous open floor
- RunState (HP, weapon stats, picks, room progress) is discarded at run end; MetaState (currency + permanent unlocks) persists in localStorage
- v1 non-goals include overworld, multiplayer/accounts, inventory/keys/multi-weapon loadouts, and a real art pipeline

## Agent skills

### Issue tracker

Issues live in GitHub Issues for `Baker-Harrison/dungeon-shot` (via `gh`). See `docs/agents/issue-tracker.md`.

### Triage labels

Default vocabulary: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: root `CONTEXT.md` + `docs/adr/`. See `docs/agents/domain.md`.
