import type { EnemyKind } from '../data/enemies';

export type Dir = 'N' | 'E' | 'S' | 'W';

export type RoomType = 'start' | 'combat' | 'boss';

export interface RoomNode {
  id: string;
  type: RoomType;
  /** Grid coords for layout */
  x: number;
  y: number;
  connections: Partial<Record<Dir, string>>;
  /** Enemy kinds to spawn (empty for start) */
  enemies: EnemyKind[];
  cleared: boolean;
}

export interface Dungeon {
  seed: number;
  rooms: Record<string, RoomNode>;
  startId: string;
  bossId: string;
  combatCount: number;
}

export const OPPOSITE: Record<Dir, Dir> = {
  N: 'S',
  S: 'N',
  E: 'W',
  W: 'E',
};

export const DIR_DELTA: Record<Dir, { x: number; y: number }> = {
  N: { x: 0, y: -1 },
  S: { x: 0, y: 1 },
  E: { x: 1, y: 0 },
  W: { x: -1, y: 0 },
};
