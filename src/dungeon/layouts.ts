import type { LayoutId } from './types';

/** Axis-aligned obstacle in room-local space (origin = room center). */
export interface LayoutObstacle {
  x: number;
  y: number;
  w: number;
  h: number;
}

export function obstaclesForLayout(
  layoutId: LayoutId,
  roomW: number,
  roomH: number,
): LayoutObstacle[] {
  const hw = roomW / 2;
  const hh = roomH / 2;
  switch (layoutId) {
    case 'open':
    case 'arena':
      return [];
    case 'pillars':
      return [
        { x: -hw * 0.35, y: -hh * 0.25, w: 48, h: 48 },
        { x: hw * 0.35, y: -hh * 0.25, w: 48, h: 48 },
        { x: -hw * 0.35, y: hh * 0.25, w: 48, h: 48 },
        { x: hw * 0.35, y: hh * 0.25, w: 48, h: 48 },
      ];
    case 'centerBlock':
      return [{ x: 0, y: 0, w: Math.min(160, roomW * 0.22), h: Math.min(120, roomH * 0.22) }];
    case 'splitLane':
      return [
        { x: 0, y: -hh * 0.35, w: 56, h: roomH * 0.28 },
        { x: 0, y: hh * 0.35, w: 56, h: roomH * 0.28 },
      ];
    case 'alcoves':
      return [
        { x: -hw * 0.42, y: 0, w: 40, h: roomH * 0.45 },
        { x: hw * 0.42, y: 0, w: 40, h: roomH * 0.45 },
      ];
    default:
      return [];
  }
}

const COMBAT_LAYOUTS: LayoutId[] = [
  'open',
  'pillars',
  'centerBlock',
  'splitLane',
  'alcoves',
];

export function pickCombatLayout(rng: () => number): LayoutId {
  return COMBAT_LAYOUTS[Math.floor(rng() * COMBAT_LAYOUTS.length)]!;
}
