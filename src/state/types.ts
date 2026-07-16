import type { MetaUpgradeId } from '../data/metaUpgrades';
import type { UpgradeId } from '../data/upgrades';
import type { WeaponModId } from '../data/weaponMods';
import type { Dungeon } from '../dungeon/types';
import {
  STARTER_WEAPON_ID,
  getWeapon,
  type WeaponId,
} from '../data/weapons';
import { initAmmoFromWeapon } from '../data/ammo';
import { BASE_STATS } from '../util/constants';

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
  /** Active Weapon for this Run (hardcoded starter in Slice 1). */
  weaponId: WeaponId;
  hp: number;
  maxHp: number;
  damage: number;
  fireCooldownMs: number;
  moveSpeed: number;
  pierce: number;
  mag: number;
  reserve: number;
  maxMag: number;
  maxReserve: number;
  /** Multiplier on Weapon spreadDeg (1 = baseline). */
  spreadMult: number;
  /** Effective pellet count after Weapon Mods. */
  pelletCount: number;
  /** Effective bullet speed after Weapon Mods. */
  bulletSpeed: number;
  /** In-run Relic currency (discarded when the Run ends). */
  relics: number;
  /** Purchased Weapon Mods for this Run. */
  weaponMods: WeaponModId[];
  ricochet?: boolean;
  lifesteal?: boolean;
  roomsCleared: number;
  currencyEarned: number;
  pickedUpgrades: UpgradeId[];
  won: boolean;
  dead: boolean;
  /** Door entered from: used to place player on opposite side */
  enteredFrom: 'N' | 'E' | 'S' | 'W' | null;
}

export function createBaseStatsFromMeta(
  meta: MetaState,
  weaponId: WeaponId = STARTER_WEAPON_ID,
) {
  const weapon = getWeapon(weaponId);
  const ammo = initAmmoFromWeapon(weapon);
  const maxHp = BASE_STATS.maxHp + meta.upgrades.startMaxHp;
  return {
    weaponId,
    maxHp,
    hp: maxHp,
    damage: weapon.damage + meta.upgrades.startDamage,
    fireCooldownMs: weapon.fireCooldownMs,
    moveSpeed:
      BASE_STATS.moveSpeed * (1 + 0.08 * meta.upgrades.startMoveSpeed),
    pierce: weapon.pierce,
    mag: ammo.mag,
    reserve: ammo.reserve,
    maxMag: ammo.maxMag,
    maxReserve: ammo.maxReserve,
    spreadMult: 1,
    pelletCount: weapon.pelletCount,
    bulletSpeed: weapon.bulletSpeed,
    relics: 0,
    weaponMods: [] as WeaponModId[],
    ricochet: false,
    lifesteal: false,
  };
}
