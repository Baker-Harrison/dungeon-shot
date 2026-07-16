import { describe, expect, it } from 'vitest';
import {
  enemyPoolForSection,
  scaleEnemyDef,
  SECTION_THREAT,
} from './sectionThreat';
import { ENEMY_DEFS, type EnemyKind } from './enemies';
import { generateDungeon } from '../dungeon/generate';
import { combatEnemiesForSection } from '../dungeon/generate';

describe('section enemy availability', () => {
  it('keeps early Sections teachable with a small Enemy pool', () => {
    expect(enemyPoolForSection(0)).toEqual(['chaser']);
  });

  it('unlocks new Enemy kinds in later Sections', () => {
    const s0 = new Set(enemyPoolForSection(0));
    const s1 = new Set(enemyPoolForSection(1));
    const s2 = new Set(enemyPoolForSection(2));
    expect(s1.size).toBeGreaterThan(s0.size);
    expect(s1.has('shooter')).toBe(true);
    expect(s2.has('tank')).toBe(true);
  });

  it('never places unlocked kinds in earlier Section pools', () => {
    expect(enemyPoolForSection(0)).not.toContain('shooter');
    expect(enemyPoolForSection(0)).not.toContain('tank');
    expect(enemyPoolForSection(1)).not.toContain('tank');
  });
});

describe('section numeric scaling', () => {
  it('raises Enemy threat with Section depth', () => {
    const base = ENEMY_DEFS.chaser;
    const s0 = scaleEnemyDef(base, 0);
    const s2 = scaleEnemyDef(base, 2);
    expect(s2.hp).toBeGreaterThan(s0.hp);
    expect(s2.speed).toBeGreaterThanOrEqual(s0.speed);
    expect(s2.contactDamage).toBeGreaterThanOrEqual(s0.contactDamage);
  });

  it('uses documented curve constants', () => {
    expect(SECTION_THREAT.hpPerSection).toBeGreaterThan(0);
    expect(SECTION_THREAT.speedPerSection).toBeGreaterThanOrEqual(0);
  });
});

describe('combat enemy composition by section', () => {
  it('only rolls kinds from the Section pool', () => {
    const rng = () => 0.5;
    for (let section = 0; section <= 3; section++) {
      const pool = new Set(enemyPoolForSection(section));
      const enemies = combatEnemiesForSection(rng, section);
      expect(enemies.length).toBeGreaterThan(0);
      for (const kind of enemies) {
        expect(pool.has(kind)).toBe(true);
      }
    }
  });

  it('is deterministic for the same seed via dungeon generation', () => {
    const a = generateDungeon(77);
    const b = generateDungeon(77);
    for (const id of Object.keys(a.rooms)) {
      expect(a.rooms[id]!.enemies).toEqual(b.rooms[id]!.enemies);
    }
  });

  it('places section-gated kinds only in unlocked Sections', () => {
    const kindsBySection = new Map<number, Set<EnemyKind>>();
    for (let seed = 1; seed <= 40; seed++) {
      const d = generateDungeon(seed);
      for (const room of Object.values(d.rooms)) {
        if (room.type !== 'combat') continue;
        let set = kindsBySection.get(room.sectionIndex);
        if (!set) {
          set = new Set();
          kindsBySection.set(room.sectionIndex, set);
        }
        for (const k of room.enemies) set.add(k);
      }
    }
    for (const k of kindsBySection.get(0) ?? []) {
      expect(enemyPoolForSection(0)).toContain(k);
    }
    if (kindsBySection.has(2)) {
      const late = [...(kindsBySection.get(2) ?? [])];
      // tank may or may not appear depending on rolls; if present only in unlocked
      if (late.includes('tank')) {
        expect(enemyPoolForSection(2)).toContain('tank');
      }
    }
  });
});
