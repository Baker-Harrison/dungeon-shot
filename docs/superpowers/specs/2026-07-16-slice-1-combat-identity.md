## Problem Statement

Runs feel samey and easy: one gun, numeric-only upgrades, and only a couple of enemy behaviors. Clearing rooms does not create a distinct Build fantasy or rising threat, so there is little dopamine or challenge across a Run.

## Solution

Ship a combat-identity slice: multiple Weapons with different fire feels, Ammo (magazine + reserve) with walk-over refill pickups, a richer Upgrade draft mixing stats and mechanics with Rarity, and Enemy kinds that unlock by Section with numeric scaling. The player still uses one Weapon for the whole Run; this slice hardcodes the starter Weapon (Meta shop and Run Loadout come later).

## User Stories

1. As a player, I want more than one Weapon defined in the game, so that future Runs can feel different once Meta selection exists.
2. As a player, I want the starter Weapon to feel distinct from at least two alternate Weapons in data/behavior, so that gun identity is real, not a reskin.
3. As a player, I want each Weapon to define its own baseline fire pattern (rate, spread, pellet count, projectile rules as appropriate), so that Weapons are not only stat sticks.
4. As a player, I want to use exactly one Weapon for an entire Run, so that controls stay simple and builds stay readable.
5. As a player, I want Ammo with a magazine and a reserve, so that shooting has resource tension.
6. As a player, I want to start each Run full on mag and reserve at the Weapon’s current max, so that I am not starved at the door.
7. As a player, I want to reload to refill the magazine from reserve, so that reload timing matters in fights.
8. As a player, I want walk-over Ammo pickups in Chambers, so that exploration and clears top me up.
9. As a player, I want pickups to never raise Ammo above the current max, so that inventory does not snowball past the Weapon’s cap.
10. As a player, I want room-clear Upgrades to never raise Ammo max, so that gun logistics stay on the Weapon / Weapon Mod path later.
11. As a player, I want the Upgrade draft after eligible clears to still be pick 1 of 3, so that the existing dopamine beat remains.
12. As a player, I want Upgrades that include both run-wide stats and run-wide mechanics, so that Builds diverge beyond numbers.
13. As a player, I want Upgrades to have Rarity, so that commons feel safe and rares feel exciting.
14. As a player, I want common Upgrades to skew toward stats and rarer Upgrades to skew toward mechanics, so that rarity communicates complexity.
15. As a player, I want Upgrades to be run-wide (not gun-tree branches), so they do not collide with future Weapon Mods.
16. As a player, I want my picked Upgrades discarded at Run end, so that Meta stays the only permanent progress.
17. As a player, I want later Sections to introduce new Enemy kinds, so that late Run combat reads differently.
18. As a player, I want Enemy numeric threat to scale with Section depth, so that pressure rises even for familiar kinds.
19. As a player, I want early Sections to remain teachable, so that new players are not crushed by the full cast.
20. As a player, I want mini-boss and boss fights to still gate Sections / victory, so that Run structure stays intact.
21. As a player, I want HUD feedback for Ammo (mag and reserve), so that I can manage reloads and pickups.
22. As a player, I want Upgrade cards to show Rarity clearly, so that draft choices are informed.
23. As a player, I want deterministic draft/enemy composition for a seed where the game already uses seeding, so that Runs remain reproducible for tests and debugging.
24. As a developer, I want combat rules expressible as pure RunState transitions, so that Vitest can cover Ammo, drafts, and section threat without Three.js.
25. As a player, I want this slice playable without Shop, Relics, Treasure, Event, or Meta weapon buying, so that combat identity ships before economy systems.

## Implementation Decisions

- Extend RunState to carry Weapon id, Ammo magazine, Ammo reserve, and Ammo max fields derived from the active Weapon (and later Weapon Mods).
- Introduce a Weapon catalog (id, presentation name, baseline combat params, default Ammo max mag/reserve). This slice always starts Runs on the free starter Weapon.
- Keep one Weapon per Run; do not implement mid-run Weapon swaps.
- Ammo: firing spends magazine; reload moves from reserve to magazine; walk-over pickups add to reserve/mag toward current max only.
- Expand the Upgrade catalog with Rarity tiers; rolling logic weights commons toward stats and higher rarities toward mechanics.
- Upgrade application remains run-wide CombatStats / RunState mutation; no Weapon-specific upgrade branches in this slice.
- Dungeon / spawn composition: Enemy kind availability gated by Section index; apply Section numeric multipliers to Enemy stats or spawn counts (exact curve chosen for feel, documented in code constants).
- Prefer pure functions for: starting Ammo from Weapon, applying pickup refill, reload step, rolling Upgrade choices with Rarity, resolving Section Enemy pool + scaling.
- GameApp / FPS layer wires input (reload, pickup overlap) and HUD; keep rules out of render code where practical.
- Persist nothing new to Meta in this slice beyond existing currency flow unless required for compile continuity with current start-stat meta.

## Testing Decisions

- Good tests assert observable rules outcomes (state fields, rolled sets, pool membership), not Three.js meshes or DOM.
- Primary seam: pure Run/Meta rules and dungeon generation helpers (same Vitest style as existing dungeon generate / upgrade roll tests).
- Modules under test: Weapon defaults → Run Ammo init; Ammo spend/reload/pickup clamp; Upgrade roll with Rarity constraints; Section Enemy availability + scaling inputs to spawn lists.
- Prior art: existing `generateDungeon` / `rollUpgradeChoices` / `applyUpgrade` Vitest coverage — extend that pattern rather than adding renderer tests.
- Property-style checks where useful: pickups never exceed max; reload never pulls more than reserve; same seed → same draft/enemy composition decisions.

## Out of Scope

- Relics, in-run Shop, Weapon Mods, heals-for-sale, Shop Ammo refills
- Treasure and Event Chambers
- Meta Hub weapon shop, Upgrade pool unlocks catalog expansion UI, Run Loadout selection UI (hardcode starter)
- Elites as a modifier layer
- Mid-run Weapon pickup/swap
- Final art pipeline, overworld, multiplayer
- Exact long-term balance numbers beyond a playable first pass

## Further Notes

- Domain vocabulary: Run, Section, Chamber, Build, Weapon, Upgrade, Rarity, Ammo, Enemy (see CONTEXT.md).
- Slice order: (1) this combat identity spec → (2) Relic economy & Shop → (3) Treasure/Event → (4) Meta catalog & Run Loadout.
- Ambiguities deferred: exact Rarity tier names/weights; exact Enemy unlock table per Section; exact scale curve — implementers pick sensible defaults and keep them data-driven.
