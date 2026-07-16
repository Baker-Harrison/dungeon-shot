import type { EnemyKind } from '../data/enemies';

export type Dir = 'N' | 'E' | 'S' | 'W';

export type RoomType = 'start' | 'combat' | 'miniBoss' | 'boss';

export type LayoutId =
  | 'open'
  | 'pillars'
  | 'centerBlock'
  | 'splitLane'
  | 'alcoves'
  | 'arena';

export type RoomSizeId = 'M' | 'L' | 'XL';

export const ROOM_SIZES: Record<RoomSizeId, { width: number; height: number }> =
  {
    M: { width: 1000, height: 640 },
    L: { width: 1200, height: 720 },
    XL: { width: 1400, height: 800 },
  };

export interface RoomNode {
  id: string;
  type: RoomType;
  /** Grid coords for layout / minimap */
  x: number;
  y: number;
  sectionIndex: number;
  sizeId: RoomSizeId;
  width: number;
  height: number;
  layoutId: LayoutId;
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
  sectionCount: number;
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
