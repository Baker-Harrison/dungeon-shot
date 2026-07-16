import type { EnemyDef, EnemyKind } from './enemies';

/**
 * Section threat curve — documented playable defaults for Slice 1.
 * HP grows fastest; speed is a mild pressure bump.
 */
export const SECTION_THREAT = {
  hpPerSection: 0.25,
  speedPerSection: 0.08,
  contactDamageEverySections: 2,
} as const;

/** Combat Enemy kinds available at a given Section index (0-based). */
export function enemyPoolForSection(sectionIndex: number): EnemyKind[] {
  if (sectionIndex <= 0) return ['chaser'];
  if (sectionIndex === 1) return ['chaser', 'shooter'];
  return ['chaser', 'shooter', 'tank'];
}

/** Apply Section numeric multipliers to a base EnemyDef. */
export function scaleEnemyDef(def: EnemyDef, sectionIndex: number): EnemyDef {
  const s = Math.max(0, sectionIndex);
  const hpMult = 1 + SECTION_THREAT.hpPerSection * s;
  const speedMult = 1 + SECTION_THREAT.speedPerSection * s;
  const contactBonus = Math.floor(s / SECTION_THREAT.contactDamageEverySections);
  return {
    ...def,
    hp: Math.max(1, Math.round(def.hp * hpMult)),
    speed: Math.round(def.speed * speedMult),
    contactDamage: def.contactDamage + contactBonus,
    bulletDamage:
      def.bulletDamage !== undefined
        ? def.bulletDamage + contactBonus
        : undefined,
  };
}
