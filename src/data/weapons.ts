export type WeaponId = 'pulseRifle' | 'scatterGun' | 'railSpike';

export interface WeaponDef {
  id: WeaponId;
  name: string;
  /** Time between trigger pulls. */
  fireCooldownMs: number;
  /** Half-angle cone in degrees; 0 = perfectly accurate. */
  spreadDeg: number;
  /** Projectiles spawned per trigger pull. */
  pelletCount: number;
  damage: number;
  bulletSpeed: number;
  pierce: number;
  maxMag: number;
  maxReserve: number;
}

/** Free starter Weapon for Slice 1 (Run Loadout comes later). */
export const STARTER_WEAPON_ID: WeaponId = 'pulseRifle';

export const WEAPONS: Record<WeaponId, WeaponDef> = {
  pulseRifle: {
    id: 'pulseRifle',
    name: 'Pulse Rifle',
    fireCooldownMs: 220,
    spreadDeg: 2,
    pelletCount: 1,
    damage: 1,
    bulletSpeed: 28,
    pierce: 0,
    maxMag: 12,
    maxReserve: 36,
  },
  scatterGun: {
    id: 'scatterGun',
    name: 'Scatter Gun',
    fireCooldownMs: 480,
    spreadDeg: 12,
    pelletCount: 5,
    damage: 1,
    bulletSpeed: 22,
    pierce: 0,
    maxMag: 6,
    maxReserve: 24,
  },
  railSpike: {
    id: 'railSpike',
    name: 'Rail Spike',
    fireCooldownMs: 700,
    spreadDeg: 0,
    pelletCount: 1,
    damage: 3,
    bulletSpeed: 42,
    pierce: 1,
    maxMag: 4,
    maxReserve: 16,
  },
};

export function getWeapon(id: WeaponId): WeaponDef {
  return WEAPONS[id];
}

/** Apply horizontal cone spread around a forward aim vector. */
export function aimWithSpread(
  forward: { x: number; y: number; z: number },
  spreadDeg: number,
  rand: () => number = Math.random,
): { x: number; y: number; z: number } {
  if (spreadDeg <= 0) return { x: forward.x, y: forward.y, z: forward.z };
  const yaw = ((rand() * 2 - 1) * spreadDeg * Math.PI) / 180;
  const pitch = ((rand() * 2 - 1) * spreadDeg * 0.35 * Math.PI) / 180;
  const cosY = Math.cos(yaw);
  const sinY = Math.sin(yaw);
  const cosP = Math.cos(pitch);
  const sinP = Math.sin(pitch);
  // Rotate around Y then slight pitch
  const x1 = forward.x * cosY + forward.z * sinY;
  const z1 = -forward.x * sinY + forward.z * cosY;
  const y1 = forward.y * cosP - z1 * sinP;
  const z2 = forward.y * sinP + z1 * cosP;
  const len = Math.hypot(x1, y1, z2) || 1;
  return { x: x1 / len, y: y1 / len, z: z2 / len };
}
