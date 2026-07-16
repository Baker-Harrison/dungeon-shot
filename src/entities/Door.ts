import Phaser from 'phaser';
import { DEPTH, DOOR_WIDTH, ROOM_HEIGHT, ROOM_WIDTH, WALL_THICKNESS } from '../util/constants';
import { TEX } from '../util/textures';
import type { Dir } from '../dungeon/types';

export class Door extends Phaser.Physics.Arcade.Image {
  dir: Dir;
  locked = true;

  constructor(scene: Phaser.Scene, dir: Dir, cx: number, cy: number) {
    const horizontal = dir === 'N' || dir === 'S';
    super(scene, 0, 0, TEX.doorLocked);
    scene.add.existing(this);
    scene.physics.add.existing(this, true);
    this.dir = dir;
    this.setDepth(DEPTH.door);

    if (horizontal) {
      this.setDisplaySize(DOOR_WIDTH, WALL_THICKNESS);
      this.x = cx;
      this.y = dir === 'N' ? cy - ROOM_HEIGHT / 2 + WALL_THICKNESS / 2 : cy + ROOM_HEIGHT / 2 - WALL_THICKNESS / 2;
    } else {
      this.setDisplaySize(WALL_THICKNESS, DOOR_WIDTH);
      this.x = dir === 'W' ? cx - ROOM_WIDTH / 2 + WALL_THICKNESS / 2 : cx + ROOM_WIDTH / 2 - WALL_THICKNESS / 2;
      this.y = cy;
    }

    const body = this.body as Phaser.Physics.Arcade.StaticBody;
    body.updateFromGameObject();
  }

  setLocked(locked: boolean): void {
    this.locked = locked;
    this.setTexture(locked ? TEX.doorLocked : TEX.doorOpen);
    const body = this.body as Phaser.Physics.Arcade.StaticBody;
    // Block the doorway only while locked. Spawns sit far enough inside to avoid embedding.
    body.enable = locked;
    if (locked) body.updateFromGameObject();
  }
}

export function buildRoomWalls(
  scene: Phaser.Scene,
  cx: number,
  cy: number,
  openDirs: Dir[],
): { walls: Phaser.Physics.Arcade.StaticGroup; floor: Phaser.GameObjects.Image } {
  const walls = scene.physics.add.staticGroup();
  const left = cx - ROOM_WIDTH / 2;
  const top = cy - ROOM_HEIGHT / 2;

  const addWall = (x: number, y: number, w: number, h: number) => {
    const img = scene.add.image(x, y, TEX.wall);
    img.setDisplaySize(w, h);
    img.setDepth(DEPTH.wall);
    scene.physics.add.existing(img, true);
    walls.add(img);
  };

  // Floor
  const floor = scene.add.image(cx, cy, TEX.floor);
  floor.setDisplaySize(ROOM_WIDTH, ROOM_HEIGHT);
  floor.setDepth(DEPTH.floor);
  floor.setTint(0xffffff);

  const gap = DOOR_WIDTH;
  const t = WALL_THICKNESS;

  // North wall segments
  if (openDirs.includes('N')) {
    const mid = cx;
    const side = (ROOM_WIDTH - gap) / 2;
    addWall(left + side / 2, top + t / 2, side, t);
    addWall(mid + gap / 2 + side / 2, top + t / 2, side, t);
  } else {
    addWall(cx, top + t / 2, ROOM_WIDTH, t);
  }

  // South
  if (openDirs.includes('S')) {
    const side = (ROOM_WIDTH - gap) / 2;
    addWall(left + side / 2, top + ROOM_HEIGHT - t / 2, side, t);
    addWall(cx + gap / 2 + side / 2, top + ROOM_HEIGHT - t / 2, side, t);
  } else {
    addWall(cx, top + ROOM_HEIGHT - t / 2, ROOM_WIDTH, t);
  }

  // West
  if (openDirs.includes('W')) {
    const side = (ROOM_HEIGHT - gap) / 2;
    addWall(left + t / 2, top + side / 2, t, side);
    addWall(left + t / 2, cy + gap / 2 + side / 2, t, side);
  } else {
    addWall(left + t / 2, cy, t, ROOM_HEIGHT);
  }

  // East
  if (openDirs.includes('E')) {
    const side = (ROOM_HEIGHT - gap) / 2;
    addWall(left + ROOM_WIDTH - t / 2, top + side / 2, t, side);
    addWall(left + ROOM_WIDTH - t / 2, cy + gap / 2 + side / 2, t, side);
  } else {
    addWall(left + ROOM_WIDTH - t / 2, cy, t, ROOM_HEIGHT);
  }

  return { walls, floor };
}

export function spawnPointForEntry(
  cx: number,
  cy: number,
  enteredFrom: Dir | null,
): { x: number; y: number } {
  // Far enough inside that door trigger zones don't immediately re-fire.
  const inset = WALL_THICKNESS + 72;
  if (!enteredFrom) return { x: cx, y: cy };
  switch (enteredFrom) {
    case 'N':
      return { x: cx, y: cy - ROOM_HEIGHT / 2 + inset };
    case 'S':
      return { x: cx, y: cy + ROOM_HEIGHT / 2 - inset };
    case 'E':
      return { x: cx + ROOM_WIDTH / 2 - inset, y: cy };
    case 'W':
      return { x: cx - ROOM_WIDTH / 2 + inset, y: cy };
  }
}
