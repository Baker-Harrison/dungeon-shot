import { describe, expect, it } from 'vitest';
import {
  startNewRun,
  setMeta,
  setRun,
  applyRunUpgrade,
  getRun,
  purchaseRunShopOffer,
  tryGrantRelicDrop,
} from './session';
import { DEFAULT_META } from './types';
import { STARTER_WEAPON_ID, getWeapon } from '../data/weapons';
import { trySpendAmmo, reloadAmmo, applyAmmoPickup } from '../data/ammo';
import { WEAPON_MODS } from '../data/weaponMods';

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
    expect(run.relics).toBe(0);
    expect(run.weaponMods).toEqual([]);
    expect(run.pelletCount).toBe(weapon.pelletCount);
  });

  it('discards picked Upgrades and Relics when a new Run starts', () => {
    setMeta(DEFAULT_META);
    setRun(null);
    startNewRun(DEFAULT_META, 1);
    applyRunUpgrade('damage');
    getRun().relics = 5;
    expect(getRun().pickedUpgrades).toContain('damage');
    const next = startNewRun(DEFAULT_META, 2);
    expect(next.pickedUpgrades).toEqual([]);
    expect(next.relics).toBe(0);
    expect(next.weaponMods).toEqual([]);
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

describe('Relic economy session hooks', () => {
  it('grants Relics from drop rolls into RunState', () => {
    setRun(null);
    startNewRun(DEFAULT_META, 9);
    const always = () => 0;
    expect(tryGrantRelicDrop(always)).toBe(true);
    expect(getRun().relics).toBe(1);
  });

  it('applies Shop Weapon Mod purchases through RunState', () => {
    setRun(null);
    const run = startNewRun(DEFAULT_META, 10);
    const mod = WEAPON_MODS.pulseExtendedMag;
    run.relics = mod.cost;
    expect(
      purchaseRunShopOffer({
        kind: 'weaponMod',
        modId: mod.id,
        cost: mod.cost,
      }),
    ).toBe(true);
    expect(getRun().weaponMods).toContain(mod.id);
    expect(getRun().maxMag).toBeGreaterThan(getWeapon(STARTER_WEAPON_ID).maxMag);
    expect(getRun().relics).toBe(0);
  });

  it('blocks Shop purchases that cannot be afforded', () => {
    setRun(null);
    startNewRun(DEFAULT_META, 11);
    const mod = WEAPON_MODS.pulseExtendedMag;
    getRun().relics = 0;
    expect(
      purchaseRunShopOffer({
        kind: 'weaponMod',
        modId: mod.id,
        cost: mod.cost,
      }),
    ).toBe(false);
  });
});
