import { BASE_STATS } from '../util/constants';
import type { MetaUpgradeId } from '../data/metaUpgrades';
import type { UpgradeId } from '../data/upgrades';
import type { Dungeon } from '../dungeon/types';

export interface MetaState {
  currency: number;
  upgrades: Record<MetaUpgradeId, number>;
}

export const DEFAULT_META: MetaState = {
  currency: 0,
  upgrades: {
    startDamage: 0,
    startMaxHp: 0,
    startMoveSpeed: 0,
  },
};

export interface RunState {
  seed: number;
  dungeon: Dungeon;
  currentRoomId: string;
  currentSectionIndex: number;
  visitedRoomIds: string[];
  hp: number;
  maxHp: number;
  damage: number;
  fireCooldownMs: number;
  moveSpeed: number;
  pierce: number;
  roomsCleared: number;
  currencyEarned: number;
  pickedUpgrades: UpgradeId[];
  won: boolean;
  dead: boolean;
  /** Door entered from: used to place player on opposite side */
  enteredFrom: 'N' | 'E' | 'S' | 'W' | null;
}

export function createBaseStatsFromMeta(meta: MetaState) {
  const maxHp = BASE_STATS.maxHp + meta.upgrades.startMaxHp;
  return {
    maxHp,
    hp: maxHp,
    damage: BASE_STATS.damage + meta.upgrades.startDamage,
    fireCooldownMs: BASE_STATS.fireCooldownMs,
    moveSpeed:
      BASE_STATS.moveSpeed * (1 + 0.08 * meta.upgrades.startMoveSpeed),
    pierce: BASE_STATS.pierce,
  };
}
