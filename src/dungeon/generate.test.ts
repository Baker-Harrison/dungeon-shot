import { describe, expect, it } from 'vitest';
import { generateDungeon, rollUpgradeChoices } from './generate';
import { applyUpgrade, RUN_UPGRADES, type CombatStats } from '../data/upgrades';
import { BASE_STATS } from '../util/constants';

describe('generateDungeon', () => {
  it('creates 5-7 combat rooms plus start and boss', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const d = generateDungeon(seed);
      const rooms = Object.values(d.rooms);
      const combat = rooms.filter((r) => r.type === 'combat');
      const bosses = rooms.filter((r) => r.type === 'boss');
      const starts = rooms.filter((r) => r.type === 'start');

      expect(starts).toHaveLength(1);
      expect(bosses).toHaveLength(1);
      expect(combat.length).toBeGreaterThanOrEqual(5);
      expect(combat.length).toBeLessThanOrEqual(7);
      expect(d.combatCount).toBe(combat.length);
      expect(d.rooms[d.startId]?.type).toBe('start');
      expect(d.rooms[d.bossId]?.type).toBe('boss');
      expect(d.rooms[d.bossId]?.enemies).toEqual(['boss']);
    }
  });

  it('is deterministic for the same seed', () => {
    const a = generateDungeon(42);
    const b = generateDungeon(42);
    expect(Object.keys(a.rooms).sort()).toEqual(Object.keys(b.rooms).sort());
    expect(a.combatCount).toBe(b.combatCount);
    expect(a.bossId).toBe(b.bossId);
  });

  it('connects rooms bidirectionally', () => {
    const d = generateDungeon(99);
    for (const room of Object.values(d.rooms)) {
      for (const [dir, otherId] of Object.entries(room.connections)) {
        const other = d.rooms[otherId!];
        expect(other).toBeDefined();
        const back = Object.entries(other!.connections).find(
          ([, id]) => id === room.id,
        );
        expect(back).toBeDefined();
        void dir;
      }
    }
  });
});

describe('applyUpgrade', () => {
  const base = (): CombatStats => ({
    maxHp: BASE_STATS.maxHp,
    hp: BASE_STATS.maxHp,
    damage: BASE_STATS.damage,
    fireCooldownMs: BASE_STATS.fireCooldownMs,
    moveSpeed: BASE_STATS.moveSpeed,
    pierce: 0,
  });

  it('stacks damage and pierce', () => {
    let s = applyUpgrade(base(), 'damage');
    s = applyUpgrade(s, 'pierce');
    expect(s.damage).toBe(BASE_STATS.damage + 1);
    expect(s.pierce).toBe(1);
  });

  it('heals when gaining max HP', () => {
    const hurt = { ...base(), hp: 2 };
    const s = applyUpgrade(hurt, 'maxHp');
    expect(s.maxHp).toBe(BASE_STATS.maxHp + 1);
    expect(s.hp).toBe(3);
  });
});

describe('rollUpgradeChoices', () => {
  it('returns unique choices from the pool', () => {
    const ids = rollUpgradeChoices(1, 0, RUN_UPGRADES, 3);
    expect(ids).toHaveLength(3);
    expect(new Set(ids).size).toBe(3);
  });
});
