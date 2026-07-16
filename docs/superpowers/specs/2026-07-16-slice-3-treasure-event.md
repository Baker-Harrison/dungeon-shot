## Problem Statement

The dungeon still over-indexes on combat → draft → door. Without non-combat variety, Runs feel structurally repetitive even after builds and shops exist.

## Solution

Add Treasure Chambers (free loot, no catch) and Event Chambers (risk/reward choices) into dungeon generation and room flow. Treasure gives; Event asks; Shop (from Slice 2) spends. Depends on Slices 1–2 so rewards can include Ammo, Relics, heals, and Upgrade drafts.

## User Stories

1. As a player, I want Treasure Chambers, so that I sometimes get free power without a fight.
2. As a player, I want Treasure loot to have no catch, so that Treasure never feels like a trap.
3. As a player, I want Treasure to grant combinations of Ammo, heal, Relics, and/or a free Upgrade draft opportunity, so that rewards stay useful.
4. As a player, I want Event Chambers, so that I can take risky deals for power.
5. As a player, I want Events to present an explicit choice with upside and downside, so that I am making a decision, not reading flavor.
6. As a player, I want to be able to decline an Event when a decline option exists, so that I am not forced into bad trades (if an Event offers skip — at least some should).
7. As a player, I want Shop, Treasure, and Event to feel distinct in UI and map legend, so that I know what a room is before entering.
8. As a player, I want these special Chambers to appear in the sectioned graph without replacing mini-boss/boss gates, so that Run structure stays intact.
9. As a player, I want special Chambers to be non-combat (no clear-to-open door lock from Enemies), so that they break the combat cadence.
10. As a player, I want minimap / map to show Treasure and Event differently from combat and Shop, so that navigation is informed.
11. As a player, I want Treasure/Event outcomes to respect Ammo max and existing Build rules, so that rewards do not break Slice 1–2 invariants.
12. As a player, I want a free Upgrade draft from Treasure (when rolled) to use the same 1-of-3 UX as combat drafts, so that learning transfers.
13. As a player, I want Event costs to be understandable (HP, Relics, etc.), so that risk is readable.
14. As a player, I want dungeon generation to seed special room placement and Event rolls, so that Runs stay reproducible.
15. As a player, I want special rooms distributed across Sections, so that variety is not front-loaded only.
16. As a developer, I want loot tables and Event resolutions as pure functions on RunState, so that Vitest covers them.
17. As a player, I want this slice without requiring Meta Run Loadout, so that chamber variety can ship after Shop.

## Implementation Decisions

- Extend room types with Treasure and Event; update generator to place them with tunable density; preserve start / combat / miniBoss / boss / Shop connectivity rules.
- Treasure resolution: roll a small loot table (Ammo refill toward max, heal, Relics, optional free Upgrade draft flag).
- Event resolution: curated dilemma set (pay HP for Upgrade/Relics, gamble Relics, etc.); each Event has structured outcomes applied via pure RunState transitions.
- Map/minimap legend entries for Treasure and Event; fog rules consistent with existing visited/adjacent fog.
- Do not merge Treasure and Event into one “special” type.
- Keep Shop behavior from Slice 2 unchanged (spend Relics).

## Testing Decisions

- Good tests: generated dungeons include Treasure/Event with expected counts/connectivity; treasure never applies “catch” costs; event outcomes mutate HP/Relics/Upgrades as specified; Ammo rewards clamp to max.
- Seam: dungeon generate + pure Run rules (existing Vitest style).
- Prior art: section/room-type assertions in `generateDungeon` tests.

## Out of Scope

- Meta Hub catalog / Run Loadout (Slice 4)
- Elites
- Narrative-only Events with no mechanical stakes
- Overworld / hub exploration spaces

## Further Notes

- Domain verbs: Shop spends, Treasure gives, Event asks (CONTEXT.md).
- Prerequisites: Slice 1 and Slice 2.
- Ambiguities deferred: exact loot table weights and full Event catalog — ship a small curated set first.
