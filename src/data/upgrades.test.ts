import { describe, expect, it } from 'vitest';
import {
  RUN_UPGRADES,
  applyUpgrade,
  type CombatStats,
  type UpgradeId,
} from './upgrades';
import { rollUpgradeChoices } from '../dungeon/generate';
import { BASE_STATS } from '../util/constants';

function baseStats(): CombatStats {
  return {
    maxHp: BASE_STATS.maxHp,
    hp: BASE_STATS.maxHp,
    damage: BASE_STATS.damage,
    fireCooldownMs: BASE_STATS.fireCooldownMs,
    moveSpeed: BASE_STATS.moveSpeed,
    pierce: 0,
  };
}

describe('upgrade catalog rarity', () => {
  it('assigns Rarity and kind to every Upgrade', () => {
    expect(RUN_UPGRADES.length).toBeGreaterThanOrEqual(8);
    for (const u of RUN_UPGRADES) {
      expect(['common', 'uncommon', 'rare']).toContain(u.rarity);
      expect(['stat', 'mechanic']).toContain(u.kind);
    }
  });

  it('skews commons toward stats and rarer picks toward mechanics', () => {
    const commons = RUN_UPGRADES.filter((u) => u.rarity === 'common');
    const rares = RUN_UPGRADES.filter((u) => u.rarity === 'rare');
    expect(commons.length).toBeGreaterThan(0);
    expect(rares.length).toBeGreaterThan(0);
    expect(commons.every((u) => u.kind === 'stat')).toBe(true);
    expect(rares.every((u) => u.kind === 'mechanic')).toBe(true);
  });

  it('never raises Ammo max via room-clear Upgrades', () => {
    const ammoKeys = ['maxMag', 'maxReserve', 'mag', 'reserve'] as const;
    for (const u of RUN_UPGRADES) {
      const after = applyUpgrade(baseStats(), u.id);
      for (const key of ammoKeys) {
        expect((after as unknown as Record<string, unknown>)[key]).toBeUndefined();
      }
    }
  });
});

describe('rollUpgradeChoices with rarity', () => {
  it('returns unique choices from the pool', () => {
    const ids = rollUpgradeChoices(1, 0, RUN_UPGRADES, 3);
    expect(ids).toHaveLength(3);
    expect(new Set(ids).size).toBe(3);
  });

  it('is deterministic for the same seed and roomsCleared', () => {
    const a = rollUpgradeChoices(42, 3, RUN_UPGRADES, 3);
    const b = rollUpgradeChoices(42, 3, RUN_UPGRADES, 3);
    expect(a).toEqual(b);
  });

  it('can offer mechanic Upgrades from the expanded catalog', () => {
    const seen = new Set<string>();
    for (let seed = 1; seed <= 80; seed++) {
      for (const id of rollUpgradeChoices(seed, seed % 5, RUN_UPGRADES, 3)) {
        seen.add(id);
      }
    }
    const mechanics = RUN_UPGRADES.filter((u) => u.kind === 'mechanic').map(
      (u) => u.id,
    );
    expect(mechanics.some((id) => seen.has(id))).toBe(true);
  });

  it('weights commons more often than rares across many rolls', () => {
    const rarityOf = new Map(RUN_UPGRADES.map((u) => [u.id, u.rarity]));
    let common = 0;
    let rare = 0;
    for (let seed = 1; seed <= 200; seed++) {
      for (const id of rollUpgradeChoices(seed, seed % 7, RUN_UPGRADES, 3)) {
        const r = rarityOf.get(id as UpgradeId);
        if (r === 'common') common += 1;
        if (r === 'rare') rare += 1;
      }
    }
    expect(common).toBeGreaterThan(rare);
  });
});

describe('mechanic upgrade application', () => {
  it('applies run-wide mechanic effects without touching Ammo caps', () => {
    let s = applyUpgrade(baseStats(), 'ricochet');
    expect(s.ricochet).toBe(true);

    s = applyUpgrade(s, 'vampiric');
    expect(s.lifesteal).toBe(true);

    s = applyUpgrade(s, 'overclock');
    expect(s.fireCooldownMs).toBeLessThan(BASE_STATS.fireCooldownMs);

    s = applyUpgrade(baseStats(), 'steadyAim');
    expect(s.damage).toBe(BASE_STATS.damage + 1);
    expect(s.spreadMult).toBe(0.5);
  });
});
