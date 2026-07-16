# Dungeon Shot

Browser first-person dungeon roguelite: clear locked rooms, assemble an in-run build, beat the boss, spend meta currency between runs.

## Language

### Run loop

**Run**:
A single attempt from start until win or death.
_Avoid_: session (except code `RunState`), playthrough

**Section**:
A contiguous stretch of rooms ending in a mini-boss gate (or the final boss on the last stretch).

**Chamber**:
One loaded room the player fights or traverses in.
_Avoid_: stage, level (except as casual speech)

### Builds

**Build**:
The player's in-run combat identity: the single active **Weapon** (plus its **Weapon Mods**) and collected **Upgrades**.
_Avoid_: loadout, class, kit

**Weapon**:
The player's single primary fire identity for the current **Run** (how shots behave). Chosen in **Run Loadout** from owned **Weapons** and not replaced mid-run; depth comes from **Weapon Mods** and **Upgrades**.
_Avoid_: gun (unless referring to a specific weapon name), arm, loadout

**Upgrade**:
A temporary in-run power from the post-clear 1-of-3 draft; discarded when the **Run** ends. The pool mixes run-wide stats and run-wide mechanics, with rarity (commons skew stats; rarer picks skew mechanics).
_Avoid_: perk, buff (as a system name); **Weapon Mod**; gun-specific branches (those belong on **Weapon Mods**)

**Rarity**:
A tier on draftable **Upgrades** (and possibly other loot later) that signals power/complexity — exact tier names TBD.
_Avoid_: using rarity for **Relics** (those are one token type)

**Relic**:
A single generic in-run currency dropped by defeated enemies (notable drop chance, on the order of ~15%), spent at a **Shop** on **Weapon Mods**, heals, and **Ammo** refills.
_Avoid_: passive power item, artifact, trinket; not a kept passive in the **Build**; not multiple relic types; not **Ammo** itself

**Weapon Mod**:
A branching, weapon-specific improvement purchased at a **Shop** by spending **Relics**; changes how that **Weapon** behaves for the rest of the **Run**. May include raising **Ammo** max.
_Avoid_: Upgrade (room-clear picks), attachment (unless used as flavor text only)

**Ammo**:
The combat **Resource** — a magazine plus a reserve. The player starts the **Run** full at the **Weapon**'s current max. Room pickups are walk-over refills and never exceed the current max. Only **Weapon Mods** may raise **Ammo** max mid-run; room-clear **Upgrades** do not.
_Avoid_: energy, heat; do not call **Relics** ammo; do not treat room **Upgrades** as ammo-cap powers

**Resource**:
Alias umbrella for limited combat expendables; in this game the primary combat **Resource** is **Ammo**.
_Avoid_: mana; heat (rejected in favor of **Ammo**)

### Chambers (special)

**Shop**:
A non-combat **Chamber** where the player spends **Relics** on **Weapon Mods**, heals, and **Ammo** refills.
_Avoid_: Meta Hub shop (that's between runs)

**Treasure**:
A non-combat **Chamber** that grants free loot with no catch (**Ammo**, heal, **Relics**, and/or a free **Upgrade** opportunity — exact table TBD).
_Avoid_: Shop, Event

**Event**:
A non-combat **Chamber** that presents a risk/reward choice (pay a cost for a benefit, or gamble).
_Avoid_: Treasure, Shop, narrative-only flavor with no real stakes

### Threat

**Enemy**:
A hostile combatant in a **Chamber**. New **Enemy** kinds are introduced as **Sections** advance, and numeric threat also scales with **Section** depth.
_Avoid_: mob (ok casually), monster as a system name

**Elite**:
Not required for the base difficulty model (new kinds + section scaling). May be added later as a modifier layer.
_Avoid_: treating every hard enemy as an Elite

### Meta

**Meta**:
Permanent progress between **Runs**. The **Meta Hub** shop sells a full catalog: **Weapons** (beyond the free starter), permanent starting bonuses, and unlocks for the in-run **Upgrade** draft pool — currency only, no discovery gates.
_Avoid_: account progression, prestige (unless added later)

**Meta Hub**:
The between-run screen where the player spends **Meta** currency (buying **Weapons**, starting bonuses, and **Upgrade** pool unlocks) and sets **Run Loadout**.
_Avoid_: hub world, town (not a playable space in current scope)

**Run Loadout**:
The pre-**Run** choice of which owned **Weapon** to take into the next **Run**.
_Avoid_: loadout (when implying multi-weapon carry in-run), class select

## Relationships

- A **Run** contains one or more **Sections**; a **Section** contains many **Chambers**
- A **Build** is assembled during a **Run** from one **Weapon**, its **Weapon Mods**, and **Upgrades**
- The player uses exactly one **Weapon** for the entire **Run** (no mid-run weapon swap)
- Owned **Weapons**, starting bonuses, and unlocked draft **Upgrades** are bought with **Meta** currency only (no other unlock gates); the player chooses a **Weapon** via **Run Loadout** before starting
- Each account starts with one free starter **Weapon**, baseline starting stats, and a base **Upgrade** pool (size TBD)
- Enemy kills may drop **Relics** (one shared token type); **Relics** are spent at a **Shop** for **Weapon Mods**, heals, and **Ammo** refills
- A **Section** introduces additional **Enemy** kinds and raises numeric threat versus earlier **Sections**
- **Shop** spends **Relics**; **Treasure** gives free loot; **Event** asks for a risk/reward choice
- **Upgrades**, **Relics**, and **Weapon Mods** from a **Run** do not persist; owned **Weapons**, starting bonuses, unlocked draft **Upgrades**, and other **Meta** progress do
- **Ammo** starts full at the **Weapon**'s max; walk-over pickups and **Shop** refills restore toward current max only; only **Weapon Mods** may raise that max; **Ammo** does not carry to **Meta**

## Example dialogue

> **Dev:** "I spent **Relics** at the **Shop** — is that an **Upgrade**?"
> **Domain expert:** "Only if you bought a **Weapon Mod**. The **Shop** also sells heals and **Ammo** refills — those aren't **Upgrades**. **Upgrades** are draft picks after clears (or a free draft from **Treasure**, if offered)."

> **Dev:** "Can I pick up a shotgun mid-**Run**?"
> **Domain expert:** "No — one **Weapon** for the **Run**. Buy guns in the **Meta Hub**, pick one in **Run Loadout**, then grow it with **Weapon Mods** and **Upgrades**."

> **Dev:** "I bought something in the **Meta Hub** — is that an in-run **Upgrade**?"
> **Domain expert:** "If it was an **Upgrade** unlock, you added it to the draft pool — you still must be offered it and pick it during a **Run**. If it was a starting bonus or a **Weapon**, that applies at **Run** start / **Run Loadout**."

> **Dev:** "Is a bigger magazine an **Upgrade**?"
> **Domain expert:** "No — magazine max is a **Weapon Mod**. An **Upgrade** is a run-wide draft pick, stats or mechanics, with **Rarity**."

> **Dev:** "Do later **Sections** just add HP?"
> **Domain expert:** "Numbers go up, but new **Enemy** kinds show up too — that's the difficulty model. **Elites** are optional later."

## Flagged ambiguities

- Expansion vision is sequenced as four slices: (1) combat identity, (2) Relic economy & Shop, (3) Treasure/Event chambers, (4) Meta catalog & Run Loadout.
- Legacy docs still mention Phaser twin-stick; live game is Three.js FPS — presentation term TBD if needed.
- Exact **Treasure** loot table and **Event** dilemma set are unresolved.
- Exact **Rarity** tier names and weights for **Upgrades** are unresolved.
- How large the free base **Upgrade** pool is before **Meta** unlocks is unresolved.
- Exact list of permanent starting bonuses in the **Meta** catalog is unresolved.
- Which **Enemy** kinds unlock at which **Section**, and exact scale curves, are unresolved.
