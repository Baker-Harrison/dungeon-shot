export type EnemyKind = 'chaser' | 'shooter' | 'miniBoss' | 'boss';

export interface EnemyDef {
  kind: EnemyKind;
  hp: number;
  speed: number;
  contactDamage: number;
  shootCooldownMs?: number;
  bulletDamage?: number;
  scoreValue: number;
}

export const ENEMY_DEFS: Record<EnemyKind, EnemyDef> = {
  chaser: {
    kind: 'chaser',
    hp: 3,
    speed: 110,
    contactDamage: 1,
    scoreValue: 1,
  },
  shooter: {
    kind: 'shooter',
    hp: 2,
    speed: 70,
    contactDamage: 1,
    shootCooldownMs: 1400,
    bulletDamage: 1,
    scoreValue: 2,
  },
  miniBoss: {
    kind: 'miniBoss',
    hp: 18,
    speed: 95,
    contactDamage: 2,
    shootCooldownMs: 1100,
    bulletDamage: 1,
    scoreValue: 6,
  },
  boss: {
    kind: 'boss',
    hp: 40,
    speed: 90,
    contactDamage: 2,
    shootCooldownMs: 900,
    bulletDamage: 1,
    scoreValue: 10,
  },
};
