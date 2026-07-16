import { describe, expect, it } from 'vitest';
import { startNewRun, setMeta, setRun, applyRunUpgrade, getRun } from './session';
import { DEFAULT_META } from './types';
import { STARTER_WEAPON_ID, getWeapon } from '../data/weapons';
import { trySpendAmmo, reloadAmmo, applyAmmoPickup } from '../data/ammo';

describe('startNewRun combat identity', () => {
  it('hardcodes the starter Weapon and starts Ammo full at max', () => {
    setMeta(DEFAULT_META);
    setRun(null);
    const run = startNewRun(DEFAULT_META, 123);
    const weapon = getWeapon(STARTER_WEAPON_ID);
    expect(run.weaponId).toBe(STARTER_WEAPON_ID);
    expect(run.mag).toBe(weapon.maxMag);
    expect(run.reserve).toBe(weapon.maxReserve);
    expect(run.maxMag).toBe(weapon.maxMag);
    expect(run.maxReserve).toBe(weapon.maxReserve);
    expect(run.damage).toBe(weapon.damage);
    expect(run.fireCooldownMs).toBe(weapon.fireCooldownMs);
    expect(run.pierce).toBe(weapon.pierce);
  });

  it('discards picked Upgrades when a new Run starts', () => {
    setMeta(DEFAULT_META);
    setRun(null);
    startNewRun(DEFAULT_META, 1);
    applyRunUpgrade('damage');
    expect(getRun().pickedUpgrades).toContain('damage');
    const next = startNewRun(DEFAULT_META, 2);
    expect(next.pickedUpgrades).toEqual([]);
    expect(next.mag).toBe(getWeapon(STARTER_WEAPON_ID).maxMag);
  });

  it('mutates Ammo on the Run without raising max via pickups', () => {
    setRun(null);
    const run = startNewRun(DEFAULT_META, 5);
    const spent = trySpendAmmo(
      {
        mag: run.mag,
        reserve: run.reserve,
        maxMag: run.maxMag,
        maxReserve: run.maxReserve,
      },
      1,
    )!;
    run.mag = spent.mag;
    run.reserve = spent.reserve;
    expect(run.mag).toBe(getWeapon(STARTER_WEAPON_ID).maxMag - 1);

    const reloaded = reloadAmmo({
      mag: run.mag,
      reserve: run.reserve,
      maxMag: run.maxMag,
      maxReserve: run.maxReserve,
    });
    run.mag = reloaded.mag;
    run.reserve = reloaded.reserve;
    expect(run.mag).toBe(run.maxMag);

    run.mag = 0;
    run.reserve = run.maxReserve;
    const topped = applyAmmoPickup(
      {
        mag: run.mag,
        reserve: run.reserve,
        maxMag: run.maxMag,
        maxReserve: run.maxReserve,
      },
      99,
    );
    expect(topped.mag).toBe(run.maxMag);
    expect(topped.reserve).toBe(run.maxReserve);
  });
});
