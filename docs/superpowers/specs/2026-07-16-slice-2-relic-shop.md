## Problem Statement

Even with better guns and upgrades, mid-run growth lacks a spend sink and gun-crafting fantasy. Players cannot convert combat success into Weapon-specific power, heals, or Ammo top-ups at a Shop, so Relics-as-economy and branching Weapon Mods do not exist yet.

## Solution

Add Relics as a single in-run currency (~15% Enemy drop chance), spent at in-run Shop Chambers on branching Weapon Mods, heals, and Ammo refills. Weapon Mods are weapon-specific, persist for the rest of the Run, and are the only way to raise Ammo max. Depends on Slice 1 combat identity (Weapons + Ammo + richer Upgrades).

## User Stories

1. As a player, I want Relics to drop from defeated Enemies at a notable chance (~15%), so that clears feed an economy.
2. As a player, I want Relics to be one generic token type, so that I am not blocked by wrong drop types.
3. As a player, I want Relics to show on the HUD, so that I know what I can afford.
4. As a player, I want Relics to discard at Run end, so that they are not Meta currency.
5. As a player, I want Shop Chambers in the dungeon graph, so that I have a place to spend Relics.
6. As a player, I want Shops to sell Weapon Mods, so that I can branch my gun’s behavior.
7. As a player, I want Weapon Mods to be specific to my current Weapon, so that each gun has its own craft path.
8. As a player, I want Weapon Mods to change how the Weapon feels (not only flat global stats), so that spending Relics is exciting.
9. As a player, I want some Weapon Mods to raise Ammo max, so that logistics can improve without Upgrade cards doing it.
10. As a player, I want Shops to sell heals for Relics, so that I can trade build power for survival.
11. As a player, I want Shops to sell Ammo refills for Relics, so that I can recover when pickups are scarce.
12. As a player, I want Shop Ammo refills to respect current Ammo max, so that purchases cannot overflow the cap.
13. As a player, I want a clear choice between mods vs heal vs Ammo at the Shop, so that Relic spending is a real decision.
14. As a player, I want purchased Weapon Mods to last for the rest of the Run, so that investment feels permanent within the Run.
15. As a player, I want Weapon Mods to not be confused with Upgrades in UI copy, so that the mental model stays sharp.
16. As a player, I want Shops to be non-combat Chambers (doors not combat-locked by Enemies), so that shopping is safe.
17. As a player, I want dungeon generation to place a reasonable number of Shops across Sections, so that Relics have sinks.
18. As a player, I want Shop offers to be seeded where the Run is seeded, so that Runs stay reproducible.
19. As a player, I want to leave a Shop without buying, so that I can save Relics for a later mod.
20. As a player, I want insufficient Relics to block a purchase, so that prices matter.
21. As a developer, I want purchase and drop rules as pure RunState transitions, so that Vitest covers economy without rendering.
22. As a player, I want this slice without Treasure/Event and without Meta weapon shopping, so that economy ships before those systems.

## Implementation Decisions

- Add Relic count to RunState; on Enemy death, roll drop (~15%, tunable constant); one token type only.
- Add Shop as a Chamber type in dungeon generation and room loading; no Enemy clear requirement to “unlock” shopping.
- Shop inventory: Weapon Mod offers for the active Weapon, plus heal and Ammo refill wares priced in Relics.
- Weapon Mod catalog keyed by Weapon id; purchasing applies mod to RunState / Weapon runtime stats (including possible Ammo max increases) and deducts Relics.
- Ammo refill ware restores toward current max only; heal ware restores HP toward maxHp.
- UI: Shop overlay consistent with existing CRT/DOM overlay patterns; distinguish Weapon Mod vs Upgrade language.
- Do not implement mid-run Weapon swap; mods always apply to the Run’s single Weapon.
- Meta currency earning can optionally bump slightly for Shop visits or Relic sinks — only if needed for feel; default keep existing clear/boss rewards.

## Testing Decisions

- Good tests: drop rate bounds over many rolls (statistical or fixed RNG inject), purchase success/fail, Ammo clamp on Shop refill, mod application effects, generation includes Shop rooms with connections.
- Seam: pure Run/Meta rules + dungeon generate (extend existing Vitest prior art).
- Do not test Three.js Shop meshes; DOM smoke optional but not required for agent completion.
- Prior art: `generateDungeon` structure tests; upgrade apply tests — mirror for mods/relics.

## Out of Scope

- Treasure and Event Chambers (Slice 3)
- Meta Hub catalog and Run Loadout (Slice 4)
- Typed Relics / rarity Relics
- Elites
- Changing the one-Weapon-per-Run rule

## Further Notes

- Domain: Relic, Shop, Weapon Mod vs Upgrade, Ammo max ownership (CONTEXT.md).
- Prerequisite: Slice 1 combat identity.
- Ambiguities deferred: exact mod trees per Weapon, exact prices, Shop density per Section — choose playable defaults, data-driven.
