export const GAME_WIDTH = 960;
export const GAME_HEIGHT = 640;

export const ROOM_WIDTH = 800;
export const ROOM_HEIGHT = 480;
export const WALL_THICKNESS = 24;
export const DOOR_WIDTH = 64;

export const DEPTH = {
  floor: 0,
  wall: 10,
  door: 15,
  bullet: 20,
  enemy: 25,
  player: 30,
  ui: 100,
} as const;

export const COLORS = {
  bg: 0x1a1f2e,
  floor: 0x2d3748,
  wall: 0x4a5568,
  doorLocked: 0x742a2a,
  doorOpen: 0x276749,
  player: 0x63b3ed,
  bullet: 0xf6e05e,
  enemyBullet: 0xfc8181,
  chaser: 0xe53e3e,
  shooter: 0xd69e2e,
  boss: 0x9f7aea,
  hp: 0xf56565,
  text: '#e2e8f0',
} as const;

export const BASE_STATS = {
  maxHp: 5,
  damage: 1,
  fireCooldownMs: 220,
  moveSpeed: 220,
  bulletSpeed: 420,
  pierce: 0,
  iFrameMs: 800,
} as const;

export const REWARDS = {
  roomClear: 5,
  bossKill: 25,
  deathBonusPerRoom: 2,
} as const;
