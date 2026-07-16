import type { RunState } from './types';
import { createBaseStatsFromMeta, type MetaState } from './types';
import { generateDungeon } from '../dungeon/generate';
import { applyUpgrade, type UpgradeId } from '../data/upgrades';
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
    },
    id,
  );
  run.maxHp = next.maxHp;
  run.hp = next.hp;
  run.damage = next.damage;
  run.fireCooldownMs = next.fireCooldownMs;
  run.moveSpeed = next.moveSpeed;
  run.pierce = next.pierce;
  run.pickedUpgrades.push(id);
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
  } else if (room.type === 'combat') {
    run.currencyEarned += REWARDS.roomClear;
  }
}

export function markPlayerDead(): void {
  const run = getRun();
  run.dead = true;
  run.currencyEarned += run.roomsCleared * REWARDS.deathBonusPerRoom;
}
