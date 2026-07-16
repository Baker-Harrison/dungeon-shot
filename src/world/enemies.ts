import * as THREE from 'three';
import { ENEMY_DEFS, type EnemyKind } from '../data/enemies';
import { COLORS } from '../util/constants';
import type { Aabb } from './colliders';
import { moveWithColliders } from './colliders';
import type { ProjectileSystem } from './projectiles';

let nextId = 1;

const HP_BAR_W = 0.9;
const HP_BAR_H = 0.1;

export interface EnemyActor {
  id: number;
  kind: EnemyKind;
  /** Root group: body + health bar */
  mesh: THREE.Object3D;
  body: THREE.Mesh;
  hpBarFill: THREE.Mesh;
  hpBarRoot: THREE.Object3D;
  hp: number;
  maxHp: number;
  height: number;
  speed: number;
  contactDamage: number;
  shootCooldownMs: number;
  bulletDamage: number;
  nextShot: number;
  burstLeft: number;
  burstTimer: number;
  alive: boolean;
}

function makeHealthBar(): {
  root: THREE.Group;
  fill: THREE.Mesh;
} {
  const root = new THREE.Group();
  const bg = new THREE.Mesh(
    new THREE.PlaneGeometry(HP_BAR_W, HP_BAR_H),
    new THREE.MeshBasicMaterial({
      color: 0x1a1a1a,
      depthTest: true,
      transparent: true,
      opacity: 0.85,
    }),
  );
  const fill = new THREE.Mesh(
    new THREE.PlaneGeometry(HP_BAR_W, HP_BAR_H),
    new THREE.MeshBasicMaterial({
      color: 0xe53e3e,
      depthTest: true,
    }),
  );
  // Anchor fill from the left so scale.x shrinks toward the left edge
  fill.geometry.translate(HP_BAR_W / 2, 0, 0);
  fill.position.x = -HP_BAR_W / 2;
  fill.position.z = 0.01;
  root.add(bg);
  root.add(fill);
  return { root, fill };
}

function disposeObject(obj: THREE.Object3D): void {
  obj.traverse((child) => {
    const m = child as THREE.Mesh;
    if (m.geometry) m.geometry.dispose();
    if (m.material) {
      const mat = m.material as THREE.Material | THREE.Material[];
      if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
      else mat.dispose();
    }
  });
}

export class EnemySystem {
  readonly list: EnemyActor[] = [];
  private scene: THREE.Scene;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  spawn(kind: EnemyKind, x: number, z: number, now: number): void {
    const def = ENEMY_DEFS[kind];
    const color =
      kind === 'boss'
        ? COLORS.boss
        : kind === 'miniBoss'
          ? COLORS.miniBoss
          : kind === 'shooter'
            ? COLORS.shooter
            : COLORS.chaser;
    const r = kind === 'boss' ? 0.7 : kind === 'miniBoss' ? 0.55 : 0.4;
    const h = kind === 'boss' ? 2.2 : kind === 'miniBoss' ? 1.9 : 1.6;

    const root = new THREE.Group();
    root.position.set(x, 0, z);

    const body = new THREE.Mesh(
      new THREE.CapsuleGeometry(r, h - r * 2, 4, 8),
      new THREE.MeshStandardMaterial({ color }),
    );
    body.position.y = h / 2;
    root.add(body);

    const { root: hpBarRoot, fill: hpBarFill } = makeHealthBar();
    hpBarRoot.position.y = h + 0.35;
    root.add(hpBarRoot);

    this.scene.add(root);
    this.list.push({
      id: nextId++,
      kind,
      mesh: root,
      body,
      hpBarFill,
      hpBarRoot,
      hp: def.hp,
      maxHp: def.hp,
      height: h,
      speed: def.speed / 40,
      contactDamage: def.contactDamage,
      shootCooldownMs: def.shootCooldownMs ?? 0,
      bulletDamage: def.bulletDamage ?? 0,
      nextShot: now + 500 + Math.random() * 600,
      burstLeft: 0,
      burstTimer: 0,
      alive: true,
    });
  }

  clear(): void {
    for (const e of this.list) {
      this.scene.remove(e.mesh);
      disposeObject(e.mesh);
    }
    this.list.length = 0;
  }

  update(
    dt: number,
    now: number,
    playerX: number,
    playerZ: number,
    colliders: Aabb[],
    projectiles: ProjectileSystem,
    camera?: THREE.Camera,
  ): void {
    for (const e of this.list) {
      if (!e.alive) continue;
      const ex = e.mesh.position.x;
      const ez = e.mesh.position.z;
      const dx = playerX - ex;
      const dz = playerZ - ez;
      const dist = Math.hypot(dx, dz) || 1;

      if (e.kind === 'chaser') {
        const nx = (dx / dist) * e.speed * dt;
        const nz = (dz / dist) * e.speed * dt;
        const next = moveWithColliders(ex, ez, nx, nz, 0.4, colliders);
        e.mesh.position.x = next.x;
        e.mesh.position.z = next.z;
      } else if (e.kind === 'shooter') {
        const prefer = 4.5;
        let mx = 0;
        let mz = 0;
        if (dist < prefer - 1) {
          mx = (-dx / dist) * e.speed * dt;
          mz = (-dz / dist) * e.speed * dt;
        } else if (dist > prefer + 1) {
          mx = (dx / dist) * e.speed * dt;
          mz = (dz / dist) * e.speed * dt;
        }
        const next = moveWithColliders(ex, ez, mx, mz, 0.4, colliders);
        e.mesh.position.x = next.x;
        e.mesh.position.z = next.z;
        if (now >= e.nextShot) {
          e.nextShot = now + e.shootCooldownMs;
          const origin = new THREE.Vector3(ex, 1.2, ez);
          const dir = new THREE.Vector3(dx, 0, dz).normalize();
          projectiles.spawn(origin, dir, 14, e.bulletDamage, 0, false);
        }
      } else {
        const nx = (dx / dist) * e.speed * dt;
        const nz = (dz / dist) * e.speed * dt;
        const next = moveWithColliders(ex, ez, nx, nz, 0.55, colliders);
        e.mesh.position.x = next.x;
        e.mesh.position.z = next.z;
        if (e.burstLeft > 0 && now >= e.burstTimer) {
          e.burstLeft -= 1;
          e.burstTimer = now + 120;
          const origin = new THREE.Vector3(
            e.mesh.position.x,
            1.3,
            e.mesh.position.z,
          );
          const base = Math.atan2(dx, dz);
          const offsets =
            e.kind === 'boss' ? [-0.25, 0, 0.25] : [-0.18, 0.18];
          for (const off of offsets) {
            const a = base + off;
            const dir = new THREE.Vector3(Math.sin(a), 0, Math.cos(a));
            projectiles.spawn(origin, dir, 16, e.bulletDamage, 0, false);
          }
        } else if (now >= e.nextShot) {
          e.nextShot = now + e.shootCooldownMs;
          e.burstLeft = e.kind === 'boss' ? 3 : 2;
          e.burstTimer = now;
        }
      }

      if (camera) {
        e.hpBarRoot.quaternion.copy(camera.quaternion);
      }
    }
  }

  hurt(e: EnemyActor, amount: number): boolean {
    e.hp -= amount;
    const ratio = Math.max(0, e.hp / e.maxHp);
    e.hpBarFill.scale.x = Math.max(0.001, ratio);
    if (e.hp <= 0) {
      e.alive = false;
      this.scene.remove(e.mesh);
      disposeObject(e.mesh);
      return true;
    }
    return false;
  }

  aliveCount(): number {
    return this.list.filter((e) => e.alive).length;
  }
}
