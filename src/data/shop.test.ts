import { describe, expect, it } from 'vitest';
import { STARTER_WEAPON_ID, getWeapon } from './weapons';
import {
  WEAPON_MODS,
  applyWeaponMod,
  modsForWeapon,
  type WeaponModId,
} from './weaponMods';
import {
  purchaseShopOffer,
  rollShopOffers,
  type ShopOffer,
  type ShopRunSlice,
} from './shop';

function baseSlice(over: Partial<ShopRunSlice> = {}): ShopRunSlice {
  const weapon = getWeapon(STARTER_WEAPON_ID);
  return {
    relics: 10,
    hp: 3,
    maxHp: 5,
    mag: 4,
    reserve: 10,
    maxMag: weapon.maxMag,
    maxReserve: weapon.maxReserve,
    weaponId: STARTER_WEAPON_ID,
    weaponMods: [],
    damage: weapon.damage,
    fireCooldownMs: weapon.fireCooldownMs,
    pierce: weapon.pierce,
    spreadMult: 1,
    pelletCount: weapon.pelletCount,
    bulletSpeed: weapon.bulletSpeed,
    ...over,
  };
}

describe('modsForWeapon', () => {
  it('returns only mods for the given Weapon', () => {
    for (const id of ['pulseRifle', 'scatterGun', 'railSpike'] as const) {
      const mods = modsForWeapon(id);
      expect(mods.length).toBeGreaterThan(0);
      expect(mods.every((m) => m.weaponId === id)).toBe(true);
    }
  });
});

describe('applyWeaponMod', () => {
  it('raises Ammo max for extended-mag style mods', () => {
    const weapon = getWeapon(STARTER_WEAPON_ID);
    const next = applyWeaponMod(baseSlice(), 'pulseExtendedMag');
    expect(next.maxMag).toBeGreaterThan(weapon.maxMag);
    expect(next.maxReserve).toBeGreaterThan(weapon.maxReserve);
  });

  it('changes Weapon feel beyond flat global HP', () => {
    const before = baseSlice();
    const burst = applyWeaponMod(before, 'pulseBurst');
    expect(burst.pelletCount).toBeGreaterThan(before.pelletCount);

    const stable = applyWeaponMod(before, 'pulseStabilizer');
    expect(stable.spreadMult).toBeLessThan(before.spreadMult);
  });
});

describe('purchaseShopOffer', () => {
  it('buys a Weapon Mod when Relics are sufficient', () => {
    const mod = WEAPON_MODS.pulseExtendedMag;
    const offer: ShopOffer = {
      kind: 'weaponMod',
      modId: mod.id,
      cost: mod.cost,
    };
    const next = purchaseShopOffer(baseSlice({ relics: mod.cost }), offer);
    expect(next).not.toBeNull();
    expect(next!.relics).toBe(0);
    expect(next!.weaponMods).toContain('pulseExtendedMag' satisfies WeaponModId);
    expect(next!.maxMag).toBeGreaterThan(baseSlice().maxMag);
  });

  it('blocks purchase when Relics are insufficient', () => {
    const mod = WEAPON_MODS.pulseExtendedMag;
    const offer: ShopOffer = {
      kind: 'weaponMod',
      modId: mod.id,
      cost: mod.cost,
    };
    expect(
      purchaseShopOffer(baseSlice({ relics: mod.cost - 1 }), offer),
    ).toBeNull();
  });

  it('blocks buying an already-owned Weapon Mod', () => {
    const mod = WEAPON_MODS.pulseExtendedMag;
    const offer: ShopOffer = {
      kind: 'weaponMod',
      modId: mod.id,
      cost: mod.cost,
    };
    expect(
      purchaseShopOffer(
        baseSlice({ weaponMods: ['pulseExtendedMag'], relics: 99 }),
        offer,
      ),
    ).toBeNull();
  });

  it('heals toward maxHp without exceeding it', () => {
    const offer: ShopOffer = { kind: 'heal', amount: 2, cost: 2 };
    const next = purchaseShopOffer(baseSlice({ hp: 4, relics: 2 }), offer);
    expect(next!.hp).toBe(5);
    expect(next!.relics).toBe(0);
  });

  it('refills Ammo toward current max only', () => {
    const offer: ShopOffer = { kind: 'ammoRefill', cost: 2 };
    const next = purchaseShopOffer(
      baseSlice({ mag: 1, reserve: 2, relics: 2 }),
      offer,
    );
    expect(next!.mag).toBe(next!.maxMag);
    expect(next!.reserve).toBe(next!.maxReserve);
    expect(next!.relics).toBe(0);
  });

  it('blocks heal and Ammo refill when already full', () => {
    expect(
      purchaseShopOffer(baseSlice({ hp: 5, relics: 9 }), {
        kind: 'heal',
        amount: 2,
        cost: 2,
      }),
    ).toBeNull();
    const weapon = getWeapon(STARTER_WEAPON_ID);
    expect(
      purchaseShopOffer(
        baseSlice({
          mag: weapon.maxMag,
          reserve: weapon.maxReserve,
          relics: 9,
        }),
        { kind: 'ammoRefill', cost: 2 },
      ),
    ).toBeNull();
  });

  it('rejects Weapon Mods for a different Weapon', () => {
    const offer: ShopOffer = {
      kind: 'weaponMod',
      modId: 'scatterSlug',
      cost: 1,
    };
    expect(purchaseShopOffer(baseSlice({ relics: 99 }), offer)).toBeNull();
  });
});

describe('rollShopOffers', () => {
  it('is seeded and includes heal plus Ammo refill', () => {
    const a = rollShopOffers(11, '0,1', STARTER_WEAPON_ID, []);
    const b = rollShopOffers(11, '0,1', STARTER_WEAPON_ID, []);
    expect(a).toEqual(b);
    expect(a.some((o) => o.kind === 'heal')).toBe(true);
    expect(a.some((o) => o.kind === 'ammoRefill')).toBe(true);
    expect(a.some((o) => o.kind === 'weaponMod')).toBe(true);
    for (const o of a) {
      if (o.kind === 'weaponMod') {
        expect(WEAPON_MODS[o.modId].weaponId).toBe(STARTER_WEAPON_ID);
      }
    }
  });

  it('omits owned Weapon Mods from offers', () => {
    const offers = rollShopOffers(11, '0,1', STARTER_WEAPON_ID, [
      'pulseExtendedMag',
    ]);
    expect(
      offers.some(
        (o) => o.kind === 'weaponMod' && o.modId === 'pulseExtendedMag',
      ),
    ).toBe(false);
  });
});
