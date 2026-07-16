import type { WeaponId } from './weapons';

export type WeaponModId =
  | 'pulseExtendedMag'
  | 'pulseBurst'
  | 'pulseStabilizer'
  | 'pulseRapid'
  | 'scatterExtendedMag'
  | 'scatterSlug'
  | 'scatterWider'
  | 'scatterShells'
  | 'railExtendedMag'
  | 'railPierce'
  | 'railCharge'
  | 'railCapacitor';

export interface WeaponModDef {
  id: WeaponModId;
  weaponId: WeaponId;
  name: string;
  description: string;
  cost: number;
  /** Optional prior mod required to unlock this branch. */
  requires?: WeaponModId;
}

export const WEAPON_MODS: Record<WeaponModId, WeaponModDef> = {
  pulseExtendedMag: {
    id: 'pulseExtendedMag',
    weaponId: 'pulseRifle',
    name: 'Extended Mag',
    description: '+4 magazine and +12 reserve Ammo max',
    cost: 3,
  },
  pulseBurst: {
    id: 'pulseBurst',
    weaponId: 'pulseRifle',
    name: 'Burst Feed',
    description: 'Fire 2 extra pellets per shot',
    cost: 4,
  },
  pulseStabilizer: {
    id: 'pulseStabilizer',
    weaponId: 'pulseRifle',
    name: 'Stabilizer',
    description: 'Tighten spread sharply',
    cost: 3,
  },
  pulseRapid: {
    id: 'pulseRapid',
    weaponId: 'pulseRifle',
    name: 'Rapid Pulse',
    description: 'Fire 25% faster (requires Stabilizer)',
    cost: 5,
    requires: 'pulseStabilizer',
  },
  scatterExtendedMag: {
    id: 'scatterExtendedMag',
    weaponId: 'scatterGun',
    name: 'Drum Mag',
    description: '+2 magazine and +8 reserve Ammo max',
    cost: 3,
  },
  scatterSlug: {
    id: 'scatterSlug',
    weaponId: 'scatterGun',
    name: 'Slug Barrel',
    description: 'Fewer pellets, more damage, tighter cone',
    cost: 4,
  },
  scatterWider: {
    id: 'scatterWider',
    weaponId: 'scatterGun',
    name: 'Wide Choke',
    description: '+2 pellets and a wider spray',
    cost: 3,
  },
  scatterShells: {
    id: 'scatterShells',
    weaponId: 'scatterGun',
    name: 'Hot Shells',
    description: '+1 damage per pellet (requires Wide Choke)',
    cost: 5,
    requires: 'scatterWider',
  },
  railExtendedMag: {
    id: 'railExtendedMag',
    weaponId: 'railSpike',
    name: 'Cap Bank',
    description: '+2 magazine and +6 reserve Ammo max',
    cost: 3,
  },
  railPierce: {
    id: 'railPierce',
    weaponId: 'railSpike',
    name: 'Spike Core',
    description: 'Bullets pierce +1 extra enemy',
    cost: 4,
  },
  railCharge: {
    id: 'railCharge',
    weaponId: 'railSpike',
    name: 'Overcharge',
    description: '+2 damage per shot',
    cost: 4,
  },
  railCapacitor: {
    id: 'railCapacitor',
    weaponId: 'railSpike',
    name: 'Fast Capacitor',
    description: 'Fire 20% faster (requires Overcharge)',
    cost: 5,
    requires: 'railCharge',
  },
};

export function modsForWeapon(weaponId: WeaponId): WeaponModDef[] {
  return Object.values(WEAPON_MODS).filter((m) => m.weaponId === weaponId);
}

export function getWeaponMod(id: WeaponModId): WeaponModDef {
  return WEAPON_MODS[id];
}

/** Combat fields a Weapon Mod may mutate (pure). */
export interface WeaponModStats {
  maxMag: number;
  maxReserve: number;
  mag: number;
  reserve: number;
  damage: number;
  fireCooldownMs: number;
  pierce: number;
  spreadMult: number;
  pelletCount: number;
  bulletSpeed: number;
}

export function applyWeaponMod(
  stats: WeaponModStats,
  id: WeaponModId,
): WeaponModStats {
  const next = { ...stats };
  switch (id) {
    case 'pulseExtendedMag':
      next.maxMag += 4;
      next.maxReserve += 12;
      break;
    case 'pulseBurst':
      next.pelletCount += 2;
      break;
    case 'pulseStabilizer':
      next.spreadMult *= 0.4;
      break;
    case 'pulseRapid':
      next.fireCooldownMs = Math.max(
        80,
        Math.round(next.fireCooldownMs * 0.75),
      );
      break;
    case 'scatterExtendedMag':
      next.maxMag += 2;
      next.maxReserve += 8;
      break;
    case 'scatterSlug':
      next.pelletCount = Math.max(1, next.pelletCount - 3);
      next.damage += 2;
      next.spreadMult *= 0.35;
      next.bulletSpeed += 6;
      break;
    case 'scatterWider':
      next.pelletCount += 2;
      next.spreadMult *= 1.35;
      break;
    case 'scatterShells':
      next.damage += 1;
      break;
    case 'railExtendedMag':
      next.maxMag += 2;
      next.maxReserve += 6;
      break;
    case 'railPierce':
      next.pierce += 1;
      break;
    case 'railCharge':
      next.damage += 2;
      break;
    case 'railCapacitor':
      next.fireCooldownMs = Math.max(
        80,
        Math.round(next.fireCooldownMs * 0.8),
      );
      break;
  }
  return next;
}
