import { applyAmmoPickup } from './ammo';
import { createRng, pickN } from '../util/rng';
import type { WeaponId } from './weapons';
import {
  applyWeaponMod,
  getWeaponMod,
  modsForWeapon,
  type WeaponModId,
  type WeaponModStats,
} from './weaponMods';

export const SHOP_HEAL_COST = 2;
export const SHOP_HEAL_AMOUNT = 2;
export const SHOP_AMMO_REFILL_COST = 2;
export const SHOP_MOD_OFFER_COUNT = 3;

export type ShopOffer =
  | { kind: 'weaponMod'; modId: WeaponModId; cost: number }
  | { kind: 'heal'; amount: number; cost: number }
  | { kind: 'ammoRefill'; cost: number };

export interface ShopRunSlice extends WeaponModStats {
  relics: number;
  hp: number;
  maxHp: number;
  weaponId: WeaponId;
  weaponMods: WeaponModId[];
}

/**
 * Apply a Shop purchase. Returns null when blocked (cost, ownership, wrong Weapon,
 * or unmet branch requirement).
 */
export function purchaseShopOffer(
  run: ShopRunSlice,
  offer: ShopOffer,
): ShopRunSlice | null {
  if (run.relics < offer.cost) return null;

  if (offer.kind === 'heal') {
    if (run.hp >= run.maxHp) return null;
    return {
      ...run,
      relics: run.relics - offer.cost,
      hp: Math.min(run.maxHp, run.hp + offer.amount),
    };
  }

  if (offer.kind === 'ammoRefill') {
    if (run.mag >= run.maxMag && run.reserve >= run.maxReserve) return null;
    const ammo = applyAmmoPickup(
      {
        mag: run.mag,
        reserve: run.reserve,
        maxMag: run.maxMag,
        maxReserve: run.maxReserve,
      },
      run.maxMag + run.maxReserve,
    );
    return {
      ...run,
      relics: run.relics - offer.cost,
      mag: ammo.mag,
      reserve: ammo.reserve,
    };
  }

  const mod = getWeaponMod(offer.modId);
  if (mod.weaponId !== run.weaponId) return null;
  if (run.weaponMods.includes(offer.modId)) return null;
  if (mod.requires && !run.weaponMods.includes(mod.requires)) return null;

  const stats = applyWeaponMod(run, offer.modId);
  return {
    ...run,
    ...stats,
    relics: run.relics - offer.cost,
    weaponMods: [...run.weaponMods, offer.modId],
  };
}

function hashRoomId(roomId: string): number {
  let h = 0;
  for (let i = 0; i < roomId.length; i++) {
    h = (Math.imul(31, h) + roomId.charCodeAt(i)) | 0;
  }
  return h >>> 0;
}

/**
 * Seeded Shop inventory for a Chamber: Weapon Mods for the active Weapon
 * (excluding owned / locked branches) plus heal and Ammo refill wares.
 */
export function rollShopOffers(
  seed: number,
  roomId: string,
  weaponId: WeaponId,
  ownedMods: WeaponModId[],
  modCount = SHOP_MOD_OFFER_COUNT,
): ShopOffer[] {
  const rng = createRng(seed ^ hashRoomId(roomId) ^ 0x51eed);
  const available = modsForWeapon(weaponId).filter(
    (m) =>
      !ownedMods.includes(m.id) &&
      (!m.requires || ownedMods.includes(m.requires)),
  );
  const picked = pickN(rng, available, modCount);
  return [
    ...picked.map(
      (m): ShopOffer => ({ kind: 'weaponMod', modId: m.id, cost: m.cost }),
    ),
    { kind: 'heal', amount: SHOP_HEAL_AMOUNT, cost: SHOP_HEAL_COST },
    { kind: 'ammoRefill', cost: SHOP_AMMO_REFILL_COST },
  ];
}
