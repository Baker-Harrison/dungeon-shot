import * as THREE from 'three';
import type { Dir } from '../dungeon/types';
import type { ShopOffer } from '../data/shop';
import { getWeaponMod } from '../data/weaponMods';
import { aabbFromCenter, type Aabb } from './colliders';
import { placeNeonShopSign } from './neonSign';
import { WALL_HEIGHT, WALL_THICKNESS_WORLD } from '../util/constants';

export interface ShopStall {
  offer: ShopOffer | null;
  mesh: THREE.Group;
  aabb: Aabb;
  /** Pedestal top emissive for sold/afford feedback. */
  glow: THREE.MeshStandardMaterial;
}

function box(
  parent: THREE.Group,
  colliders: Aabb[],
  cx: number,
  cy: number,
  cz: number,
  w: number,
  h: number,
  d: number,
  color: number,
  solid = true,
  emissive = 0,
  emissiveIntensity = 0,
): THREE.Mesh {
  const mat = new THREE.MeshStandardMaterial({
    color,
    emissive,
    emissiveIntensity,
    roughness: 0.7,
  });
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  mesh.position.set(cx, cy, cz);
  parent.add(mesh);
  if (solid) colliders.push(aabbFromCenter(cx, cz, w, d));
  return mesh;
}

function stallTitle(offer: ShopOffer): string {
  if (offer.kind === 'heal') return `Heal +${offer.amount}`;
  if (offer.kind === 'ammoRefill') return 'Ammo Refill';
  return getWeaponMod(offer.modId).name;
}

function stallColor(offer: ShopOffer): number {
  if (offer.kind === 'heal') return 0x48bb78;
  if (offer.kind === 'ammoRefill') return 0xf6e05e;
  return 0xff4fd8;
}

/**
 * Decorate a Shop Chamber: counter, neon, and purchasable stalls.
 * Stalls face the room center; interact with E when close.
 */
export function buildShopInterior(
  group: THREE.Group,
  colliders: Aabb[],
  neonMaterials: THREE.MeshStandardMaterial[],
  roomW: number,
  roomD: number,
  offers: ShopOffer[],
  enteredFrom: Dir | null,
): ShopStall[] {
  const hw = roomW / 2;
  const hd = roomD / 2;
  const t = WALL_THICKNESS_WORLD;

  // Counter against the wall opposite the entry (fallback: north wall).
  const back: Dir =
    enteredFrom === 'N'
      ? 'S'
      : enteredFrom === 'S'
        ? 'N'
        : enteredFrom === 'E'
          ? 'W'
          : enteredFrom === 'W'
            ? 'E'
            : 'N';

  let counterCx = 0;
  let counterCz = 0;
  let counterW = roomW * 0.72;
  let counterD = 0.7;
  let faceInto = new THREE.Vector3(0, 0, 1);
  let stallAxis = new THREE.Vector3(1, 0, 0);

  if (back === 'N') {
    counterCz = -hd + t + 1.1;
    faceInto.set(0, 0, 1);
    stallAxis.set(1, 0, 0);
  } else if (back === 'S') {
    counterCz = hd - t - 1.1;
    faceInto.set(0, 0, -1);
    stallAxis.set(1, 0, 0);
  } else if (back === 'W') {
    counterCx = -hw + t + 1.1;
    counterW = 0.7;
    counterD = roomD * 0.72;
    faceInto.set(1, 0, 0);
    stallAxis.set(0, 0, 1);
  } else {
    counterCx = hw - t - 1.1;
    counterW = 0.7;
    counterD = roomD * 0.72;
    faceInto.set(-1, 0, 0);
    stallAxis.set(0, 0, 1);
  }

  // Counter body + top
  box(
    group,
    colliders,
    counterCx,
    0.55,
    counterCz,
    counterW,
    1.1,
    counterD,
    0x3d2c29,
    true,
  );
  box(
    group,
    colliders,
    counterCx,
    1.12,
    counterCz,
    counterW + 0.08,
    0.08,
    counterD + 0.08,
    0x1a202c,
    false,
    0xd69e2e,
    0.15,
  );

  // Big neon on the back wall above the counter
  const signOrigin = new THREE.Vector3(
    counterCx - faceInto.x * 0.55,
    2.15,
    counterCz - faceInto.z * 0.55,
  );
  placeNeonShopSign(
    group,
    neonMaterials,
    signOrigin,
    faceInto,
    0.7,
    0xff4fd8,
  );

  // Accent lights
  const lamp = new THREE.PointLight(0xff66aa, 2.2, Math.max(roomW, roomD) * 1.4);
  lamp.position.set(
    counterCx + faceInto.x * 0.8,
    WALL_HEIGHT - 0.6,
    counterCz + faceInto.z * 0.8,
  );
  group.add(lamp);

  const n = Math.max(1, offers.length);
  const span = back === 'N' || back === 'S' ? counterW * 0.82 : counterD * 0.82;
  const step = n <= 1 ? 0 : span / (n - 1);
  const stalls: ShopStall[] = [];

  for (let i = 0; i < n; i++) {
    const offer = offers[i]!;
    const tOff = n === 1 ? 0 : -span / 2 + i * step;
    const sx = counterCx + stallAxis.x * tOff + faceInto.x * 0.15;
    const sz = counterCz + stallAxis.z * tOff + faceInto.z * 0.15;

    const stall = new THREE.Group();
    stall.position.set(sx, 0, sz);

    const color = stallColor(offer);
    const glow = new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 1.2,
      roughness: 0.4,
    });
    const pedestal = new THREE.Mesh(
      new THREE.BoxGeometry(0.55, 0.35, 0.55),
      glow,
    );
    pedestal.position.y = 1.35;
    stall.add(pedestal);

    const item = new THREE.Mesh(
      new THREE.BoxGeometry(0.28, 0.28, 0.28),
      new THREE.MeshStandardMaterial({
        color: 0xf7fafc,
        emissive: color,
        emissiveIntensity: 0.8,
      }),
    );
    item.position.y = 1.65;
    stall.add(item);

    // Price tag plate facing into the room
    const tag = makePriceTag(stallTitle(offer), offer.cost, color);
    tag.position.set(faceInto.x * 0.02, 1.95, faceInto.z * 0.02);
    tag.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 0, 1),
      faceInto.clone(),
    );
    stall.add(tag);

    group.add(stall);

    // Interact zone in front of the stall (toward room center)
    const ix = sx + faceInto.x * 0.9;
    const iz = sz + faceInto.z * 0.9;
    stalls.push({
      offer,
      mesh: stall,
      aabb: aabbFromCenter(ix, iz, 1.4, 1.4),
      glow,
    });
  }

  return stalls;
}

function makePriceTag(
  title: string,
  cost: number,
  accent: number,
): THREE.Mesh {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#0b0a10';
  ctx.fillRect(0, 0, 256, 128);
  ctx.strokeStyle = `#${accent.toString(16).padStart(6, '0')}`;
  ctx.lineWidth = 6;
  ctx.strokeRect(4, 4, 248, 120);
  ctx.fillStyle = '#f6e05e';
  ctx.font = 'bold 28px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`${cost} RELICS`, 128, 42);
  ctx.fillStyle = '#e2e8f0';
  ctx.font = 'bold 22px monospace';
  const label = title.length > 16 ? `${title.slice(0, 15)}…` : title;
  ctx.fillText(label, 128, 84);
  ctx.fillStyle = '#a0aec0';
  ctx.font = '16px monospace';
  ctx.fillText('[E] BUY', 128, 112);

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  const mat = new THREE.MeshBasicMaterial({
    map: tex,
    transparent: true,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.35), mat);
  return mesh;
}

export function setStallSoldOut(stall: ShopStall): void {
  stall.offer = null;
  stall.glow.color.setHex(0x4a5568);
  stall.glow.emissive.setHex(0x2d3748);
  stall.glow.emissiveIntensity = 0.2;
  stall.mesh.traverse((obj) => {
    const m = obj as THREE.Mesh;
    if (!m.isMesh) return;
    if (m.material && (m.material as THREE.MeshBasicMaterial).map) {
      // Hide price tag
      m.visible = false;
    }
  });
}

export function pointInAabb(x: number, z: number, box: Aabb): boolean {
  return x >= box.minX && x <= box.maxX && z >= box.minZ && z <= box.maxZ;
}
