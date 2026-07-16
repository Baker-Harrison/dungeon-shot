import { describe, expect, it } from 'vitest';
import {
  STARTER_WEAPON_ID,
  WEAPONS,
  getWeapon,
  type WeaponId,
} from './weapons';
import {
  applyAmmoPickup,
  initAmmoFromWeapon,
  reloadAmmo,
  trySpendAmmo,
} from './ammo';

describe('weapon catalog', () => {
  it('defines a starter and at least two alternate Weapons with distinct fire patterns', () => {
    const ids = Object.keys(WEAPONS) as WeaponId[];
    expect(ids.length).toBeGreaterThanOrEqual(3);
    expect(WEAPONS[STARTER_WEAPON_ID]).toBeDefined();

    const patterns = ids.map((id) => {
      const w = WEAPONS[id];
      return `${w.fireCooldownMs}:${w.spreadDeg}:${w.pelletCount}:${w.damage}:${w.pierce}`;
    });
    expect(new Set(patterns).size).toBe(patterns.length);
  });

  it('exposes baseline Ammo caps per Weapon', () => {
    for (const w of Object.values(WEAPONS)) {
      expect(w.maxMag).toBeGreaterThan(0);
      expect(w.maxReserve).toBeGreaterThan(0);
      expect(w.reloadMs).toBeGreaterThan(0);
    }
  });
});

describe('ammo rules', () => {
  const starter = () => getWeapon(STARTER_WEAPON_ID);

  it('starts a Run full at the Weapon Ammo max', () => {
    const ammo = initAmmoFromWeapon(starter());
    expect(ammo.mag).toBe(starter().maxMag);
    expect(ammo.reserve).toBe(starter().maxReserve);
    expect(ammo.maxMag).toBe(starter().maxMag);
    expect(ammo.maxReserve).toBe(starter().maxReserve);
  });

  it('spends magazine on fire and refuses empty magazine', () => {
    let ammo = initAmmoFromWeapon(starter());
    const spent = trySpendAmmo(ammo, 1);
    expect(spent).not.toBeNull();
    expect(spent!.mag).toBe(starter().maxMag - 1);
    expect(spent!.reserve).toBe(starter().maxReserve);

    ammo = { ...ammo, mag: 0 };
    expect(trySpendAmmo(ammo, 1)).toBeNull();
  });

  it('reloads magazine from reserve without exceeding mag max or available reserve', () => {
    const w = starter();
    let ammo = {
      mag: 0,
      reserve: 3,
      maxMag: w.maxMag,
      maxReserve: w.maxReserve,
    };
    ammo = reloadAmmo(ammo);
    const filled = Math.min(w.maxMag, 3);
    expect(ammo.mag).toBe(filled);
    expect(ammo.reserve).toBe(3 - filled);

    ammo = reloadAmmo({
      mag: w.maxMag,
      reserve: 10,
      maxMag: w.maxMag,
      maxReserve: w.maxReserve,
    });
    expect(ammo.mag).toBe(w.maxMag);
    expect(ammo.reserve).toBe(10);
  });

  it('pickups never raise Ammo above current max', () => {
    const w = starter();
    const full = initAmmoFromWeapon(w);
    expect(applyAmmoPickup(full, 99)).toEqual(full);

    const partial = {
      mag: 1,
      reserve: w.maxReserve - 2,
      maxMag: w.maxMag,
      maxReserve: w.maxReserve,
    };
    const topped = applyAmmoPickup(partial, 10);
    expect(topped.mag + topped.reserve).toBeLessThanOrEqual(
      topped.maxMag + topped.maxReserve,
    );
    expect(topped.mag).toBeLessThanOrEqual(topped.maxMag);
    expect(topped.reserve).toBeLessThanOrEqual(topped.maxReserve);
  });
});
