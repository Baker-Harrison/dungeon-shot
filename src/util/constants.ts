/** Legacy pixel sizes → Three.js world units. */
export const WORLD_SCALE = 1 / 40;

export const EYE_HEIGHT = 1.6;
export const PLAYER_RADIUS = 0.35;
export const WALL_HEIGHT = 3.2;
export const DOOR_WIDTH_WORLD = 1.8;
export const WALL_THICKNESS_WORLD = 0.55;

export const COLORS = {
  bg: 0x1a2230,
  floor: 0x4a5568,
  wall: 0x718096,
  ceiling: 0x2d3748,
  doorLocked: 0x9b2c2c,
  doorOpen: 0x38a169,
  bullet: 0xf6e05e,
  enemyBullet: 0xfc8181,
  chaser: 0xe53e3e,
  shooter: 0xd69e2e,
  tank: 0x718096,
  miniBoss: 0xed8936,
  boss: 0x9f7aea,
} as const;

export const BASE_STATS = {
  maxHp: 5,
  damage: 1,
  fireCooldownMs: 220,
  moveSpeed: 5.5,
  bulletSpeed: 28,
  pierce: 0,
  iFrameMs: 800,
} as const;

export const REWARDS = {
  roomClear: 5,
  miniBossKill: 15,
  bossKill: 25,
  deathBonusPerRoom: 2,
} as const;

/** Chance to open the Upgrade draft after clearing a combat / mini-boss Chamber. */
export const UPGRADE_OFFER_CHANCE = 0.2;

export function px(n: number): number {
  return n * WORLD_SCALE;
}
