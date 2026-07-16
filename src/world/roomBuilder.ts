import * as THREE from 'three';
import type { Dir, RoomNode } from '../dungeon/types';
import { obstaclesForLayout } from '../dungeon/layouts';
import {
  COLORS,
  DOOR_WIDTH_WORLD,
  WALL_HEIGHT,
  WALL_THICKNESS_WORLD,
  px,
} from '../util/constants';
import { aabbFromCenter, type Aabb } from './colliders';

export interface DoorTrigger {
  dir: Dir;
  aabb: Aabb;
  mesh: THREE.Mesh;
}

export interface BuiltRoom {
  group: THREE.Group;
  colliders: Aabb[];
  doors: DoorTrigger[];
  width: number;
  depth: number;
}

function mat(color: number): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color });
}

function addBox(
  group: THREE.Group,
  colliders: Aabb[],
  cx: number,
  cy: number,
  cz: number,
  w: number,
  h: number,
  d: number,
  color: number,
  solid = true,
): THREE.Mesh {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    mat(color),
  );
  mesh.position.set(cx, cy, cz);
  group.add(mesh);
  if (solid) colliders.push(aabbFromCenter(cx, cz, w, d));
  return mesh;
}

export function buildRoom(room: RoomNode): BuiltRoom {
  const group = new THREE.Group();
  const colliders: Aabb[] = [];
  const doors: DoorTrigger[] = [];

  const w = px(room.width);
  const depth = px(room.height);
  const t = WALL_THICKNESS_WORLD;
  const gap = DOOR_WIDTH_WORLD;
  const open = Object.keys(room.connections) as Dir[];

  // Floor + ceiling
  addBox(group, colliders, 0, -0.05, 0, w, 0.1, depth, COLORS.floor, false);
  addBox(
    group,
    colliders,
    0,
    WALL_HEIGHT + 0.05,
    0,
    w,
    0.1,
    depth,
    COLORS.ceiling,
    false,
  );

  const left = -w / 2;
  const right = w / 2;
  const north = -depth / 2;
  const south = depth / 2;

  // Outer walls with door gaps
  const buildEdge = (
    hasDoor: boolean,
    alongX: boolean,
    full: number,
    wallPos: number,
  ) => {
    if (!hasDoor) {
      if (alongX) {
        addBox(
          group,
          colliders,
          0,
          WALL_HEIGHT / 2,
          wallPos,
          full,
          WALL_HEIGHT,
          t,
          COLORS.wall,
        );
      } else {
        addBox(
          group,
          colliders,
          wallPos,
          WALL_HEIGHT / 2,
          0,
          t,
          WALL_HEIGHT,
          full,
          COLORS.wall,
        );
      }
      return;
    }
    const side = (full - gap) / 2;
    if (alongX) {
      addBox(
        group,
        colliders,
        left + side / 2,
        WALL_HEIGHT / 2,
        wallPos,
        side,
        WALL_HEIGHT,
        t,
        COLORS.wall,
      );
      addBox(
        group,
        colliders,
        right - side / 2,
        WALL_HEIGHT / 2,
        wallPos,
        side,
        WALL_HEIGHT,
        t,
        COLORS.wall,
      );
    } else {
      addBox(
        group,
        colliders,
        wallPos,
        WALL_HEIGHT / 2,
        north + side / 2,
        t,
        WALL_HEIGHT,
        side,
        COLORS.wall,
      );
      addBox(
        group,
        colliders,
        wallPos,
        WALL_HEIGHT / 2,
        south - side / 2,
        t,
        WALL_HEIGHT,
        side,
        COLORS.wall,
      );
    }
  };

  buildEdge(open.includes('N'), true, w, north + t / 2);
  buildEdge(open.includes('S'), true, w, south - t / 2);
  buildEdge(open.includes('W'), false, depth, left + t / 2);
  buildEdge(open.includes('E'), false, depth, right - t / 2);

  // Interior obstacles (layout coords are pixel-space around room center)
  for (const o of obstaclesForLayout(room.layoutId, room.width, room.height)) {
    addBox(
      group,
      colliders,
      px(o.x),
      WALL_HEIGHT / 2,
      px(o.y),
      px(o.w),
      WALL_HEIGHT,
      px(o.h),
      COLORS.wall,
    );
  }

  // Door meshes + triggers
  for (const dir of open) {
    let dx = 0;
    let dz = 0;
    let dw = gap;
    let dd = t;
    if (dir === 'N') {
      dz = north + t / 2;
      dw = gap;
      dd = t;
    } else if (dir === 'S') {
      dz = south - t / 2;
      dw = gap;
      dd = t;
    } else if (dir === 'W') {
      dx = left + t / 2;
      dw = t;
      dd = gap;
    } else {
      dx = right - t / 2;
      dw = t;
      dd = gap;
    }
    const mesh = addBox(
      group,
      colliders,
      dx,
      1.2,
      dz,
      dw,
      2.4,
      dd,
      COLORS.doorLocked,
      false,
    );
    const trigger = aabbFromCenter(dx, dz, Math.max(dw, 1.2), Math.max(dd, 1.2));
    // Expand trigger inward so player can walk into it
    if (dir === 'N') trigger.maxZ += 0.8;
    if (dir === 'S') trigger.minZ -= 0.8;
    if (dir === 'W') trigger.maxX += 0.8;
    if (dir === 'E') trigger.minX -= 0.8;
    doors.push({ dir, aabb: trigger, mesh });
  }

  // Light
  const light = new THREE.PointLight(0xfff8f0, 2.8, Math.max(w, depth) * 2.2);
  light.position.set(0, WALL_HEIGHT - 0.4, 0);
  group.add(light);
  const fill = new THREE.PointLight(0xb8d4ff, 1.2, Math.max(w, depth) * 1.8);
  fill.position.set(0, 1.4, 0);
  group.add(fill);
  group.add(new THREE.HemisphereLight(0xddeeff, 0x445566, 0.85));
  group.add(new THREE.AmbientLight(0xffffff, 0.55));

  return { group, colliders, doors, width: w, depth };
}

export function setDoorsLocked(doors: DoorTrigger[], locked: boolean): void {
  for (const d of doors) {
    (d.mesh.material as THREE.MeshStandardMaterial).color.setHex(
      locked ? COLORS.doorLocked : COLORS.doorOpen,
    );
  }
}

export function spawnPoint(
  enteredFrom: Dir | null,
  roomW: number,
  roomD: number,
): { x: number; z: number; yaw: number } {
  const inset = 2.2;
  const hw = roomW / 2;
  const hd = roomD / 2;
  // Face into the room (away from the door you just came through).
  if (!enteredFrom) return { x: 0, z: 0, yaw: 0 };
  switch (enteredFrom) {
    case 'N':
      // Entered via north door → stand just inside, face south (into room)
      return { x: 0, z: -hd + inset, yaw: Math.PI };
    case 'S':
      return { x: 0, z: hd - inset, yaw: 0 };
    case 'E':
      return { x: hw - inset, z: 0, yaw: Math.PI / 2 };
    case 'W':
      return { x: -hw + inset, z: 0, yaw: -Math.PI / 2 };
  }
}
