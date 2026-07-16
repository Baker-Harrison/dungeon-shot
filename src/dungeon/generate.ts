import { createRng, randomInt } from '../util/rng';
import type { EnemyKind } from '../data/enemies';
import { enemyPoolForSection } from '../data/sectionThreat';
import {
  RARITY_WEIGHT,
  type UpgradeDef,
  type UpgradeRarity,
} from '../data/upgrades';
import { pickCombatLayout } from './layouts';
import {
  DIR_DELTA,
  OPPOSITE,
  ROOM_SIZES,
  type Dir,
  type Dungeon,
  type LayoutId,
  type RoomNode,
  type RoomSizeId,
  type RoomType,
} from './types';

const DIRS: Dir[] = ['N', 'E', 'S', 'W'];

function roomId(x: number, y: number): string {
  return `${x},${y}`;
}

/** Roll combat Enemy kinds for a Chamber in the given Section. */
export function combatEnemiesForSection(
  rng: () => number,
  sectionIndex: number,
): EnemyKind[] {
  const pool = enemyPoolForSection(sectionIndex);
  const count = randomInt(rng, 2, 3 + Math.min(2, sectionIndex));
  const enemies: EnemyKind[] = [];
  for (let i = 0; i < count; i++) {
    enemies.push(pool[Math.floor(rng() * pool.length)]!);
  }
  return enemies;
}

function rollSize(
  rng: () => number,
  type: RoomType,
): { sizeId: RoomSizeId; width: number; height: number } {
  let sizeId: RoomSizeId;
  if (type === 'boss' || type === 'miniBoss') {
    sizeId = rng() < 0.5 ? 'L' : 'XL';
  } else if (type === 'start' || type === 'shop') {
    sizeId = 'M';
  } else {
    const roll = rng();
    sizeId = roll < 0.45 ? 'M' : roll < 0.8 ? 'L' : 'XL';
  }
  const sz = ROOM_SIZES[sizeId];
  return { sizeId, width: sz.width, height: sz.height };
}

function rollLayout(rng: () => number, type: RoomType): LayoutId {
  if (type === 'start' || type === 'boss' || type === 'miniBoss') return 'arena';
  if (type === 'shop') return 'open';
  return pickCombatLayout(rng);
}

/** Attach one Shop Chamber to a Section combat room when space allows. */
function tryPlaceShop(
  rng: () => number,
  rooms: Record<string, RoomNode>,
  occupied: Set<string>,
  sectionIndex: number,
): void {
  const hosts = Object.values(rooms).filter(
    (r) => r.type === 'combat' && r.sectionIndex === sectionIndex,
  );
  for (let i = hosts.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [hosts[i], hosts[j]] = [hosts[j]!, hosts[i]!];
  }
  for (const host of hosts) {
    const open = openDirsFor(host, occupied);
    if (open.length === 0) continue;
    const dir = open[Math.floor(rng() * open.length)]!;
    const nx = host.x + DIR_DELTA[dir].x;
    const ny = host.y + DIR_DELTA[dir].y;
    const id = roomId(nx, ny);
    const shop = makeRoom(rng, id, 'shop', nx, ny, sectionIndex, [], true);
    attachRoom(host, shop, dir, rooms, occupied);
    return;
  }
}

function makeRoom(
  rng: () => number,
  id: string,
  type: RoomType,
  x: number,
  y: number,
  sectionIndex: number,
  enemies: EnemyKind[],
  cleared: boolean,
): RoomNode {
  const size = rollSize(rng, type);
  return {
    id,
    type,
    x,
    y,
    sectionIndex,
    sizeId: size.sizeId,
    width: size.width,
    height: size.height,
    layoutId: rollLayout(rng, type),
    connections: {},
    enemies,
    cleared,
  };
}

function openDirsFor(
  from: RoomNode,
  occupied: Set<string>,
): Dir[] {
  return DIRS.filter((d) => {
    const nx = from.x + DIR_DELTA[d].x;
    const ny = from.y + DIR_DELTA[d].y;
    return !occupied.has(roomId(nx, ny)) && !from.connections[d];
  });
}

function attachRoom(
  parent: RoomNode,
  child: RoomNode,
  dir: Dir,
  rooms: Record<string, RoomNode>,
  occupied: Set<string>,
): void {
  parent.connections[dir] = child.id;
  child.connections[OPPOSITE[dir]] = parent.id;
  rooms[child.id] = child;
  occupied.add(child.id);
}

/** Find parent+dir for a gate that still has a free outward cell for the next-section entry. */
function findGateWithEntrySpace(
  rng: () => number,
  candidates: RoomNode[],
  occupied: Set<string>,
  needEntry: boolean,
): { parent: RoomNode; dir: Dir; entryDir: Dir | null } | null {
  const shuffled = [...candidates];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j]!, shuffled[i]!];
  }
  for (const parent of shuffled) {
    for (const dir of openDirsFor(parent, occupied)) {
      const mx = parent.x + DIR_DELTA[dir].x;
      const my = parent.y + DIR_DELTA[dir].y;
      const mid = roomId(mx, my);
      if (occupied.has(mid)) continue;
      if (!needEntry) {
        return { parent, dir, entryDir: null };
      }
      const entryDirs = DIRS.filter((d) => d !== OPPOSITE[dir]);
      for (let i = entryDirs.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [entryDirs[i], entryDirs[j]] = [entryDirs[j]!, entryDirs[i]!];
      }
      for (const entryDir of entryDirs) {
        const ex = mx + DIR_DELTA[entryDir].x;
        const ey = my + DIR_DELTA[entryDir].y;
        if (!occupied.has(roomId(ex, ey))) {
          return { parent, dir, entryDir };
        }
      }
    }
  }
  return null;
}

function tryAddLoops(
  rng: () => number,
  rooms: Record<string, RoomNode>,
  sectionIndex: number,
): void {
  const sectionRooms = Object.values(rooms).filter(
    (r) => r.sectionIndex === sectionIndex,
  );
  for (const room of sectionRooms) {
    if (rng() > 0.22) continue;
    for (const d of DIRS) {
      if (room.connections[d]) continue;
      const nx = room.x + DIR_DELTA[d].x;
      const ny = room.y + DIR_DELTA[d].y;
      const other = rooms[roomId(nx, ny)];
      if (!other || other.sectionIndex !== sectionIndex) continue;
      if (other.connections[OPPOSITE[d]]) continue;
      room.connections[d] = other.id;
      other.connections[OPPOSITE[d]] = room.id;
      break;
    }
  }
}

/**
 * Seeded multi-section dungeon: start → sections of combat → mini-boss gates → final boss.
 */
export function generateDungeon(seed: number): Dungeon {
  const rng = createRng(seed);
  const sectionCount = randomInt(rng, 2, 4);
  const rooms: Record<string, RoomNode> = {};
  const occupied = new Set<string>();

  const start = makeRoom(rng, roomId(0, 0), 'start', 0, 0, 0, [], true);
  rooms[start.id] = start;
  occupied.add(start.id);

  let frontier: RoomNode[] = [start];
  let combatCount = 0;
  let bossId = '';

  for (let sectionIndex = 0; sectionIndex < sectionCount; sectionIndex++) {
    const isLast = sectionIndex === sectionCount - 1;
    const targetCombat = randomInt(rng, 3, 5);
    let sectionCombat = 0;

    while (sectionCombat < targetCombat && frontier.length > 0) {
      const from = frontier[Math.floor(rng() * frontier.length)]!;
      const open = openDirsFor(from, occupied);
      if (open.length === 0) {
        const idx = frontier.indexOf(from);
        if (idx >= 0) frontier.splice(idx, 1);
        continue;
      }
      const dir = open[Math.floor(rng() * open.length)]!;
      const nx = from.x + DIR_DELTA[dir].x;
      const ny = from.y + DIR_DELTA[dir].y;
      const id = roomId(nx, ny);
      combatCount += 1;
      sectionCombat += 1;
      const node = makeRoom(
        rng,
        id,
        'combat',
        nx,
        ny,
        sectionIndex,
        combatEnemiesForSection(rng, sectionIndex),
        false,
      );
      attachRoom(from, node, dir, rooms, occupied);
      frontier.push(node);
    }

    tryPlaceShop(rng, rooms, occupied, sectionIndex);

    // Loops after the section gate so we don't seal the mini-boss/boss cell.
    // (Loops applied once per section after gate placement below.)

    const sectionCombatRooms = Object.values(rooms).filter(
      (r) => r.type === 'combat' && r.sectionIndex === sectionIndex,
    );
    const leaves = sectionCombatRooms.filter(
      (r) => Object.keys(r.connections).length === 1,
    );
    const gateCandidates = [
      ...leaves,
      ...sectionCombatRooms,
      ...frontier.filter((r) => r.sectionIndex === sectionIndex),
      ...Object.values(rooms).filter((r) => r.sectionIndex === sectionIndex),
    ];
    const uniqueParents = [...new Map(gateCandidates.map((r) => [r.id, r])).values()];
    const allRooms = Object.values(rooms);
    const gateSpot =
      findGateWithEntrySpace(
        rng,
        uniqueParents,
        occupied,
        !isLast,
      ) ?? findGateWithEntrySpace(rng, allRooms, occupied, !isLast);
    if (!gateSpot) {
      throw new Error(`No space for gate in section ${sectionIndex}`);
    }
    const { parent: gateParent, dir: gateDir, entryDir } = gateSpot;
    const gx = gateParent.x + DIR_DELTA[gateDir].x;
    const gy = gateParent.y + DIR_DELTA[gateDir].y;
    const gateId = roomId(gx, gy);

    if (isLast) {
      const boss = makeRoom(rng, gateId, 'boss', gx, gy, sectionIndex, ['boss'], false);
      attachRoom(gateParent, boss, gateDir, rooms, occupied);
      bossId = boss.id;
    } else {
      if (!entryDir) {
        throw new Error(`No entry dir for section ${sectionIndex + 1}`);
      }
      const mini = makeRoom(
        rng,
        gateId,
        'miniBoss',
        gx,
        gy,
        sectionIndex,
        ['miniBoss'],
        false,
      );
      attachRoom(gateParent, mini, gateDir, rooms, occupied);

      const ex = mini.x + DIR_DELTA[entryDir].x;
      const ey = mini.y + DIR_DELTA[entryDir].y;
      const entryId = roomId(ex, ey);
      combatCount += 1;
      const entry = makeRoom(
        rng,
        entryId,
        'combat',
        ex,
        ey,
        sectionIndex + 1,
        combatEnemiesForSection(rng, sectionIndex + 1),
        false,
      );
      attachRoom(mini, entry, entryDir, rooms, occupied);
      frontier = [entry];
    }

    tryAddLoops(rng, rooms, sectionIndex);
  }

  return {
    seed,
    rooms,
    startId: start.id,
    bossId,
    combatCount,
    sectionCount,
  };
}

function rarityWeight(u: { rarity?: UpgradeRarity }): number {
  return u.rarity ? RARITY_WEIGHT[u.rarity] : 1;
}

/** Weighted unique draft: commons offered more often than rares. */
export function rollUpgradeChoices(
  seed: number,
  roomsCleared: number,
  pool: UpgradeDef[] | { id: string; rarity?: UpgradeRarity }[],
  count = 3,
): string[] {
  const rng = createRng(seed ^ (roomsCleared * 0x9e3779b9));
  const remaining = [...pool];
  const result: string[] = [];
  while (result.length < count && remaining.length > 0) {
    const total = remaining.reduce((sum, u) => sum + rarityWeight(u), 0);
    let roll = rng() * total;
    let idx = 0;
    for (; idx < remaining.length; idx++) {
      roll -= rarityWeight(remaining[idx]!);
      if (roll <= 0) break;
    }
    if (idx >= remaining.length) idx = remaining.length - 1;
    const picked = remaining.splice(idx, 1)[0]!;
    result.push(picked.id);
  }
  return result;
}

/** Seeded chance to offer an Upgrade draft after a Chamber clear. */
export function rollUpgradeOffer(
  seed: number,
  roomsCleared: number,
  chance: number,
): boolean {
  const rng = createRng(seed ^ (roomsCleared * 0x85ebca6b) ^ 0xc2b2ae35);
  return rng() < chance;
}
