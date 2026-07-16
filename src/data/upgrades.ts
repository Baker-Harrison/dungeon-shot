export type UpgradeId =
  | 'damage'
  | 'fireRate'
  | 'moveSpeed'
  | 'maxHp'
  | 'pierce';

export interface UpgradeDef {
  id: UpgradeId;
  name: string;
  description: string;
}

export const RUN_UPGRADES: UpgradeDef[] = [
  {
    id: 'damage',
    name: '+Damage',
    description: 'Bullets deal +1 damage',
  },
  {
    id: 'fireRate',
    name: '+Fire Rate',
    description: 'Shoot 15% faster',
  },
  {
    id: 'moveSpeed',
    name: '+Move Speed',
    description: 'Move 12% faster',
  },
  {
    id: 'maxHp',
    name: '+Max HP',
    description: '+1 max HP and heal 1',
  },
  {
    id: 'pierce',
    name: 'Pierce',
    description: 'Bullets hit +1 extra enemy',
  },
];

export interface CombatStats {
  maxHp: number;
  hp: number;
  damage: number;
  fireCooldownMs: number;
  moveSpeed: number;
  pierce: number;
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
      next.moveSpeed = Math.round(next.moveSpeed * 1.12);
      break;
    case 'maxHp':
      next.maxHp += 1;
      next.hp = Math.min(next.maxHp, next.hp + 1);
      break;
    case 'pierce':
      next.pierce += 1;
      break;
  }
  return next;
}
