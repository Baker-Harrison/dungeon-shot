import type { WeaponDef } from './weapons';

export interface AmmoState {
  mag: number;
  reserve: number;
  maxMag: number;
  maxReserve: number;
}

/** Start a Run full at the Weapon's current Ammo max. */
export function initAmmoFromWeapon(weapon: WeaponDef): AmmoState {
  return {
    mag: weapon.maxMag,
    reserve: weapon.maxReserve,
    maxMag: weapon.maxMag,
    maxReserve: weapon.maxReserve,
  };
}

/**
 * Spend from the magazine. Returns null if there is not enough Ammo.
 * One trigger pull costs `amount` (default 1), regardless of pellet count.
 */
export function trySpendAmmo(ammo: AmmoState, amount = 1): AmmoState | null {
  if (ammo.mag < amount) return null;
  return { ...ammo, mag: ammo.mag - amount };
}

/** True when magazine isn't full and reserve has Ammo to pull. */
export function canReload(ammo: AmmoState): boolean {
  return ammo.mag < ammo.maxMag && ammo.reserve > 0;
}

/** Move Ammo from reserve into magazine up to maxMag. */
export function reloadAmmo(ammo: AmmoState): AmmoState {
  const need = ammo.maxMag - ammo.mag;
  if (need <= 0 || ammo.reserve <= 0) return ammo;
  const take = Math.min(need, ammo.reserve);
  return {
    ...ammo,
    mag: ammo.mag + take,
    reserve: ammo.reserve - take,
  };
}

/**
 * Walk-over refill. Fills magazine first, then reserve; never exceeds current max.
 */
export function applyAmmoPickup(ammo: AmmoState, amount: number): AmmoState {
  if (amount <= 0) return ammo;
  let left = amount;
  let mag = ammo.mag;
  let reserve = ammo.reserve;

  const magRoom = ammo.maxMag - mag;
  if (magRoom > 0 && left > 0) {
    const add = Math.min(magRoom, left);
    mag += add;
    left -= add;
  }
  const reserveRoom = ammo.maxReserve - reserve;
  if (reserveRoom > 0 && left > 0) {
    const add = Math.min(reserveRoom, left);
    reserve += add;
  }

  return { ...ammo, mag, reserve };
}
