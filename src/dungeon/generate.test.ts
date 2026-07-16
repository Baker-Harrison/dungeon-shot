import { describe, expect, it } from 'vitest';
import { generateDungeon, rollUpgradeChoices } from './generate';
import { applyUpgrade, RUN_UPGRADES, type CombatStats } from '../data/upgrades';
import { BASE_STATS } from '../util/constants';
import { obstaclesForLayout } from './layouts';

describe('generateDungeon', () => {
  it('creates 2-4 sections with mini-bosses and a final boss', () => {
    for (let seed = 1; seed <= 30; seed++) {
      const d = generateDungeon(seed);
      const rooms = Object.values(d.rooms);
      const combat = rooms.filter((r) => r.type === 'combat');
      const mini = rooms.filter((r) => r.type === 'miniBoss');
      const bosses = rooms.filter((r) => r.type === 'boss');
      const starts = rooms.filter((r) => r.type === 'start');

      expect(starts).toHaveLength(1);
      expect(bosses).toHaveLength(1);
      expect(d.sectionCount).toBeGreaterThanOrEqual(2);
      expect(d.sectionCount).toBeLessThanOrEqual(4);
      expect(mini.length).toBe(d.sectionCount - 1);
      expect(combat.length).toBeGreaterThanOrEqual(6);
      expect(d.combatCount).toBe(combat.length);
      expect(d.rooms[d.startId]?.type).toBe('start');
      expect(d.rooms[d.bossId]?.type).toBe('boss');
      expect(d.rooms[d.bossId]?.enemies).toEqual(['boss']);

      for (const room of rooms) {
        expect(room.width).toBeGreaterThan(0);
        expect(room.height).toBeGreaterThan(0);
        expect(room.layoutId).toBeTruthy();
        expect(room.sectionIndex).toBeGreaterThanOrEqual(0);
        expect(room.sectionIndex).toBeLessThan(d.sectionCount);
      }
    }
  });

  it('is deterministic for the same seed', () => {
    const a = generateDungeon(42);
    const b = generateDungeon(42);
    expect(Object.keys(a.rooms).sort()).toEqual(Object.keys(b.rooms).sort());
    expect(a.combatCount).toBe(b.combatCount);
    expect(a.bossId).toBe(b.bossId);
    expect(a.sectionCount).toBe(b.sectionCount);
  });

  it('connects rooms bidirectionally and reaches boss from start', () => {
    const d = generateDungeon(99);
    for (const room of Object.values(d.rooms)) {
      for (const [, otherId] of Object.entries(room.connections)) {
        const other = d.rooms[otherId!];
        expect(other).toBeDefined();
        const back = Object.entries(other!.connections).find(
          ([, id]) => id === room.id,
        );
        expect(back).toBeDefined();
      }
    }

    const seen = new Set<string>();
    const queue = [d.startId];
    while (queue.length) {
      const id = queue.pop()!;
      if (seen.has(id)) continue;
      seen.add(id);
      const room = d.rooms[id]!;
      for (const next of Object.values(room.connections)) {
        if (next) queue.push(next);
      }
    }
    expect(seen.has(d.bossId)).toBe(true);
  });
});

describe('obstaclesForLayout', () => {
  it('returns no obstacles for arena/open', () => {
    expect(obstaclesForLayout('arena', 1200, 720)).toEqual([]);
    expect(obstaclesForLayout('open', 1000, 640)).toEqual([]);
  });

  it('returns pillars for pillars layout', () => {
    expect(obstaclesForLayout('pillars', 1000, 640).length).toBe(4);
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
