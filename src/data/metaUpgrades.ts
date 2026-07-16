export type MetaUpgradeId = 'startDamage' | 'startMaxHp' | 'startMoveSpeed';

export interface MetaUpgradeDef {
  id: MetaUpgradeId;
  name: string;
  description: string;
  cost: number;
  maxLevel: number;
}

export const META_UPGRADES: MetaUpgradeDef[] = [
  {
    id: 'startDamage',
    name: 'Starting Damage',
    description: '+1 starting damage per level',
    cost: 20,
    maxLevel: 3,
  },
  {
    id: 'startMaxHp',
    name: 'Starting Max HP',
    description: '+1 starting max HP per level',
    cost: 25,
    maxLevel: 3,
  },
  {
    id: 'startMoveSpeed',
    name: 'Starting Speed',
    description: '+8% starting move speed per level',
    cost: 15,
    maxLevel: 3,
  },
];

export function metaUpgradeCost(def: MetaUpgradeDef, currentLevel: number): number {
  return def.cost + currentLevel * Math.floor(def.cost * 0.5);
}
