import { createRng, pickN, randomInt } from '../util/rng';
import type { EnemyKind } from '../data/enemies';
import {
  DIR_DELTA,
  OPPOSITE,
  type Dir,
  type Dungeon,
  type RoomNode,
} from './types';

const DIRS: Dir[] = ['N', 'E', 'S', 'W'];

function roomId(x: number, y: number): string {
  return `${x},${y}`;
}

function combatEnemies(rng: () => number, depth: number): EnemyKind[] {
  const count = randomInt(rng, 2, 3 + Math.min(2, Math.floor(depth / 2)));
  const pool: EnemyKind[] = depth >= 2 ? ['chaser', 'chaser', 'shooter'] : ['chaser'];
  const enemies: EnemyKind[] = [];
  for (let i = 0; i < count; i++) {
    enemies.push(pool[Math.floor(rng() * pool.length)]!);
  }
  return enemies;
}

/**
 * Grow a linear-ish branched path of combat rooms ending in a boss.
 * Target: 5–7 combat rooms + start + boss.
 */
export function generateDungeon(seed: number): Dungeon {
  const rng = createRng(seed);
  const combatTarget = randomInt(rng, 5, 7);
  const rooms: Record<string, RoomNode> = {};

  const start: RoomNode = {
    id: roomId(0, 0),
    type: 'start',
    x: 0,
    y: 0,
    connections: {},
    enemies: [],
    cleared: true,
  };
  rooms[start.id] = start;

  const occupied = new Set<string>([start.id]);
  const frontier: RoomNode[] = [start];
  let combatCount = 0;

  while (combatCount < combatTarget && frontier.length > 0) {
    const from = frontier[Math.floor(rng() * frontier.length)]!;
    const openDirs = DIRS.filter((d) => {
      const nx = from.x + DIR_DELTA[d].x;
      const ny = from.y + DIR_DELTA[d].y;
      return !occupied.has(roomId(nx, ny)) && !from.connections[d];
    });

    if (openDirs.length === 0) {
      const idx = frontier.indexOf(from);
      if (idx >= 0) frontier.splice(idx, 1);
      continue;
    }

    const dir = openDirs[Math.floor(rng() * openDirs.length)]!;
    const nx = from.x + DIR_DELTA[dir].x;
    const ny = from.y + DIR_DELTA[dir].y;
    const id = roomId(nx, ny);
    combatCount += 1;

    const node: RoomNode = {
      id,
      type: 'combat',
      x: nx,
      y: ny,
      connections: {},
      enemies: combatEnemies(rng, combatCount),
      cleared: false,
    };

    from.connections[dir] = id;
    node.connections[OPPOSITE[dir]] = from.id;
    rooms[id] = node;
    occupied.add(id);
    frontier.push(node);
  }

  // Attach boss to a leaf combat room
  const combatRooms = Object.values(rooms).filter((r) => r.type === 'combat');
  const leaves = combatRooms.filter(
    (r) => Object.keys(r.connections).length === 1,
  );
  const bossParent =
    leaves[Math.floor(rng() * leaves.length)] ??
    combatRooms[combatRooms.length - 1]!;

  const openDirs = DIRS.filter((d) => {
    const nx = bossParent.x + DIR_DELTA[d].x;
    const ny = bossParent.y + DIR_DELTA[d].y;
    return !occupied.has(roomId(nx, ny)) && !bossParent.connections[d];
  });

  let bossDir: Dir = openDirs[0] ?? 'E';
  if (openDirs.length === 0) {
    // Force expand east of parent by finding free cell near parent
    for (const d of DIRS) {
      const nx = bossParent.x + DIR_DELTA[d].x;
      const ny = bossParent.y + DIR_DELTA[d].y;
      if (!occupied.has(roomId(nx, ny))) {
        bossDir = d;
        break;
      }
    }
  } else {
    bossDir = openDirs[Math.floor(rng() * openDirs.length)]!;
  }

  const bx = bossParent.x + DIR_DELTA[bossDir].x;
  const by = bossParent.y + DIR_DELTA[bossDir].y;
  const bossId = roomId(bx, by);
  const boss: RoomNode = {
    id: bossId,
    type: 'boss',
    x: bx,
    y: by,
    connections: {},
    enemies: ['boss'],
    cleared: false,
  };

  bossParent.connections[bossDir] = bossId;
  boss.connections[OPPOSITE[bossDir]] = bossParent.id;
  rooms[bossId] = boss;

  return {
    seed,
    rooms,
    startId: start.id,
    bossId,
    combatCount,
  };
}

export function rollUpgradeChoices(
  seed: number,
  roomsCleared: number,
  pool: { id: string }[],
  count = 3,
): string[] {
  const rng = createRng(seed ^ (roomsCleared * 0x9e3779b9));
  return pickN(rng, pool, count).map((u) => u.id);
}
