## Problem Statement

Between Runs, Meta progress is thin (mostly small start-stat bumps). Players cannot buy Weapons, expand the Upgrade draft pool, or select a Weapon before starting, so long-term dopamine and Build planning are weak.

## Solution

Expand the Meta Hub into a full catalog: buy Weapons, permanent starting bonuses, and Upgrade pool unlocks with Meta currency only (no discovery gates). Add Run Loadout so the player picks one owned Weapon before each Run. Depends on Slices 1–3 for Weapons/Upgrades content to sell and for the in-run loop to make ownership matter.

## User Stories

1. As a player, I want a free starter Weapon always owned, so that I can always start a Run.
2. As a player, I want to buy additional Weapons in the Meta Hub with Meta currency, so that my arsenal grows over time.
3. As a player, I want no discovery/milestone gate on Weapon purchase beyond affordability, so that the shop is honest about price.
4. As a player, I want Run Loadout before starting a Run, so that I choose which owned Weapon to take.
5. As a player, I want exactly one Weapon selected in Run Loadout, so that in-run rules stay one-gun.
6. As a player, I want my last Run Loadout selection remembered as a default, so that restarts are fast.
7. As a player, I want to buy permanent starting bonuses in the Meta Hub, so that early Meta currency still helps before I own every Weapon.
8. As a player, I want to unlock Upgrade cards into the in-run draft pool via Meta purchases, so that dying still expands future Build options.
9. As a player, I want a base Upgrade pool available before any unlocks, so that new accounts still get drafts.
10. As a player, I want unlocked Upgrades to still require being offered and picked in a Run, so that Meta unlock ≠ free power.
11. As a player, I want Meta purchases to persist in localStorage, so that progress survives refresh.
12. As a player, I want unaffordable catalog items to show cost clearly, so that I know what to farm.
13. As a player, I want Run end to still grant Meta currency from existing reward rules (possibly tuned), so that the shop is fed.
14. As a player, I want the Meta Hub to list Weapons, starting bonuses, and Upgrade unlocks as distinct categories, so that the full catalog is navigable.
15. As a player, I want starting a Run to apply starting bonuses + selected Weapon baselines + Ammo full at that Weapon’s max, so that loadout is felt immediately.
16. As a player, I want in-run Relics/Weapon Mods/Upgrades to still not persist, so that Meta remains the permanent layer.
17. As a developer, I want Meta purchase and ownership checks as pure MetaState transitions, so that Vitest covers the catalog.
18. As a player, I want this slice to reuse Weapons/Upgrades introduced in earlier slices, so that the catalog is not empty placeholders only.

## Implementation Decisions

- Extend MetaState: owned Weapon ids, unlocked Upgrade ids, starting bonus levels/purchases; migrate save key carefully (version bump if needed).
- Meta Hub UI: three catalog sections — Weapons, starting bonuses, Upgrade unlocks; currency-only gates.
- Run Loadout UI: select among owned Weapons before `startNewRun`; pass Weapon id into RunState initialization.
- `createBaseStatsFromMeta` (or successor) applies starting bonuses; Weapon catalog supplies fire/Ammo baselines.
- Draft rolling filters to base pool ∪ Meta-unlocked Upgrades.
- Replace or absorb today’s three start-stat meta upgrades into the “starting bonuses” catalog rather than leaving a conflicting second system.
- No mid-run Weapon swap; ownership only affects Run start selection.

## Testing Decisions

- Good tests: purchase deducts currency and grants ownership; cannot buy twice; Run start uses selected Weapon; draft pool excludes locked Upgrades; save/load round-trips MetaState.
- Seam: pure MetaState/Run bootstrap rules (Vitest), plus any generate draft filter tests.
- Prior art: meta save helpers and upgrade roll tests — extend rather than UI snapshot testing.

## Out of Scope

- Discovery/achievement gates before items appear in shop
- Mid-run Weapon pickups
- Prestige / account systems / online accounts
- Elites
- Selling or refunding Meta purchases (unless trivially needed)

## Further Notes

- Domain: Meta, Meta Hub, Run Loadout, Weapon ownership vs in-run Build (CONTEXT.md).
- Prerequisites: Slices 1–3 (content to sell; in-run loop that makes guns/upgrades matter).
- Ambiguities deferred: exact prices, full starting-bonus list, base Upgrade pool size — choose a small shippable catalog first.
