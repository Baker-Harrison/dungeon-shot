import type { RunState } from './types';
import { createBaseStatsFromMeta, type MetaState } from './types';
import { generateDungeon } from '../dungeon/generate';
import { applyUpgrade, type UpgradeId } from '../data/upgrades';
import {
  purchaseShopOffer,
  type ShopOffer,
  type ShopRunSlice,
} from '../data/shop';
import { rollRelicDrop } from '../data/relics';
import { REWARDS } from '../util/constants';

let activeRun: RunState | null = null;
let activeMeta: MetaState | null = null;

export function getRun(): RunState {
  if (!activeRun) throw new Error('No active run');
  return activeRun;
}

export function tryGetRun(): RunState | null {
  return activeRun;
}

export function setRun(run: RunState | null): void {
  activeRun = run;
}

export function getMeta(): MetaState {
  if (!activeMeta) throw new Error('No meta loaded');
  return activeMeta;
}

export function setMeta(meta: MetaState): void {
  activeMeta = meta;
}

export function startNewRun(meta: MetaState, seed: number): RunState {
  const dungeon = generateDungeon(seed);
  const stats = createBaseStatsFromMeta(meta);
  const run: RunState = {
    seed,
    dungeon,
    currentRoomId: dungeon.startId,
    currentSectionIndex: 0,
    visitedRoomIds: [dungeon.startId],
    ...stats,
    roomsCleared: 0,
    currencyEarned: 0,
    pickedUpgrades: [],
    won: false,
    dead: false,
    enteredFrom: null,
  };
  activeRun = run;
  return run;
}

export function applyRunUpgrade(id: UpgradeId): void {
  const run = getRun();
  const next = applyUpgrade(
    {
      maxHp: run.maxHp,
      hp: run.hp,
      damage: run.damage,
      fireCooldownMs: run.fireCooldownMs,
      moveSpeed: run.moveSpeed,
      pierce: run.pierce,
      spreadMult: run.spreadMult,
      ricochet: run.ricochet,
      lifesteal: run.lifesteal,
    },
    id,
  );
  run.maxHp = next.maxHp;
  run.hp = next.hp;
  run.damage = next.damage;
  run.fireCooldownMs = next.fireCooldownMs;
  run.moveSpeed = next.moveSpeed;
  run.pierce = next.pierce;
  run.spreadMult = next.spreadMult ?? 1;
  run.ricochet = next.ricochet;
  run.lifesteal = next.lifesteal;
  run.pickedUpgrades.push(id);
}

function toShopSlice(run: RunState): ShopRunSlice {
  return {
    relics: run.relics,
    hp: run.hp,
    maxHp: run.maxHp,
    mag: run.mag,
    reserve: run.reserve,
    maxMag: run.maxMag,
    maxReserve: run.maxReserve,
    weaponId: run.weaponId,
    weaponMods: run.weaponMods,
    damage: run.damage,
    fireCooldownMs: run.fireCooldownMs,
    pierce: run.pierce,
    spreadMult: run.spreadMult,
    pelletCount: run.pelletCount,
    bulletSpeed: run.bulletSpeed,
  };
}

function applyShopSlice(run: RunState, next: ShopRunSlice): void {
  run.relics = next.relics;
  run.hp = next.hp;
  run.maxHp = next.maxHp;
  run.mag = next.mag;
  run.reserve = next.reserve;
  run.maxMag = next.maxMag;
  run.maxReserve = next.maxReserve;
  run.weaponMods = next.weaponMods;
  run.damage = next.damage;
  run.fireCooldownMs = next.fireCooldownMs;
  run.pierce = next.pierce;
  run.spreadMult = next.spreadMult;
  run.pelletCount = next.pelletCount;
  run.bulletSpeed = next.bulletSpeed;
}

/** Spend Relics at a Shop. Returns false when the purchase is blocked. */
export function purchaseRunShopOffer(offer: ShopOffer): boolean {
  const run = getRun();
  const next = purchaseShopOffer(toShopSlice(run), offer);
  if (!next) return false;
  applyShopSlice(run, next);
  return true;
}

/** Roll a Relic drop into the active Run. Returns true when a Relic was gained. */
export function tryGrantRelicDrop(rng: () => number): boolean {
  const run = getRun();
  if (!rollRelicDrop(rng)) return false;
  run.relics += 1;
  return true;
}

export function markRoomCleared(roomId: string): void {
  const run = getRun();
  const room = run.dungeon.rooms[roomId];
  if (!room || room.cleared) return;
  room.cleared = true;
  run.roomsCleared += 1;
  if (room.type === 'boss') {
    run.currencyEarned += REWARDS.bossKill;
    run.won = true;
  } else if (room.type === 'miniBoss') {
    run.currencyEarned += REWARDS.miniBossKill;
  } else if (room.type === 'combat') {
    run.currencyEarned += REWARDS.roomClear;
  }
}

export function markRoomVisited(roomId: string): void {
  const run = getRun();
  if (!run.visitedRoomIds.includes(roomId)) {
    run.visitedRoomIds.push(roomId);
  }
  const room = run.dungeon.rooms[roomId];
  if (room) run.currentSectionIndex = room.sectionIndex;
}

export function markPlayerDead(): void {
  const run = getRun();
  run.dead = true;
  run.currencyEarned += run.roomsCleared * REWARDS.deathBonusPerRoom;
}
