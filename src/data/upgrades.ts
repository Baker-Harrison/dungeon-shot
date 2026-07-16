export type UpgradeId =
  | 'damage'
  | 'fireRate'
  | 'moveSpeed'
  | 'maxHp'
  | 'pierce'
  | 'overclock'
  | 'ricochet'
  | 'vampiric'
  | 'steadyAim';

export type UpgradeRarity = 'common' | 'uncommon' | 'rare';
export type UpgradeKind = 'stat' | 'mechanic';

export interface UpgradeDef {
  id: UpgradeId;
  name: string;
  description: string;
  rarity: UpgradeRarity;
  kind: UpgradeKind;
}

/** Higher weight = more often offered in draft. Commons dominate. */
export const RARITY_WEIGHT: Record<UpgradeRarity, number> = {
  common: 60,
  uncommon: 30,
  rare: 10,
};

export const RUN_UPGRADES: UpgradeDef[] = [
  {
    id: 'damage',
    name: '+Damage',
    description: 'Bullets deal +1 damage',
    rarity: 'common',
    kind: 'stat',
  },
  {
    id: 'fireRate',
    name: '+Fire Rate',
    description: 'Shoot 15% faster',
    rarity: 'common',
    kind: 'stat',
  },
  {
    id: 'moveSpeed',
    name: '+Move Speed',
    description: 'Move 12% faster',
    rarity: 'common',
    kind: 'stat',
  },
  {
    id: 'maxHp',
    name: '+Max HP',
    description: '+1 max HP and heal 1',
    rarity: 'common',
    kind: 'stat',
  },
  {
    id: 'pierce',
    name: 'Pierce',
    description: 'Bullets hit +1 extra enemy',
    rarity: 'uncommon',
    kind: 'stat',
  },
  {
    id: 'steadyAim',
    name: 'Steady Aim',
    description: '+1 damage and slightly tighter fire feel',
    rarity: 'uncommon',
    kind: 'stat',
  },
  {
    id: 'overclock',
    name: 'Overclock',
    description: 'Fire rate jumps — cooldown cut in half (min 80ms)',
    rarity: 'rare',
    kind: 'mechanic',
  },
  {
    id: 'ricochet',
    name: 'Ricochet',
    description: 'Bullets bounce once off walls',
    rarity: 'rare',
    kind: 'mechanic',
  },
  {
    id: 'vampiric',
    name: 'Vampiric Rounds',
    description: 'Killing an enemy restores 1 HP',
    rarity: 'rare',
    kind: 'mechanic',
  },
];

export interface CombatStats {
  maxHp: number;
  hp: number;
  damage: number;
  fireCooldownMs: number;
  moveSpeed: number;
  pierce: number;
  /** Multiplier on Weapon spreadDeg (1 = baseline). */
  spreadMult?: number;
  /** Mechanic: bullets bounce once off walls. */
  ricochet?: boolean;
  /** Mechanic: kills restore 1 HP. */
  lifesteal?: boolean;
}

export function applyUpgrade(stats: CombatStats, id: UpgradeId): CombatStats {
  const next = { ...stats };
  switch (id) {
    case 'damage':
      next.damage += 1;
      break;
    case 'fireRate':
      next.fireCooldownMs = Math.max(80, Math.round(next.fireCooldownMs * 0.85));
      break;
    case 'moveSpeed':
      next.moveSpeed = next.moveSpeed * 1.12;
      break;
    case 'maxHp':
      next.maxHp += 1;
      next.hp = Math.min(next.maxHp, next.hp + 1);
      break;
    case 'pierce':
      next.pierce += 1;
      break;
    case 'steadyAim':
      next.damage += 1;
      next.spreadMult = (next.spreadMult ?? 1) * 0.5;
      break;
    case 'overclock':
      next.fireCooldownMs = Math.max(80, Math.round(next.fireCooldownMs * 0.5));
      break;
    case 'ricochet':
      next.ricochet = true;
      break;
    case 'vampiric':
      next.lifesteal = true;
      break;
  }
  return next;
}
