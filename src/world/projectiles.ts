import * as THREE from 'three';
import { COLORS } from '../util/constants';
import type { Aabb } from './colliders';
import { circleHitsAabb } from './colliders';

export interface Projectile {
  mesh: THREE.Mesh;
  vx: number;
  vy: number;
  vz: number;
  damage: number;
  pierceLeft: number;
  ricochetLeft: number;
  fromPlayer: boolean;
  alive: boolean;
  hitIds: Set<number>;
}

export class ProjectileSystem {
  readonly list: Projectile[] = [];
  private scene: THREE.Scene;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  spawn(
    origin: THREE.Vector3,
    dir: THREE.Vector3,
    speed: number,
    damage: number,
    pierce: number,
    fromPlayer: boolean,
    ricochet = false,
  ): void {
    const color = fromPlayer ? COLORS.bullet : COLORS.enemyBullet;
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.08, 8, 8),
      new THREE.MeshBasicMaterial({ color }),
    );
    mesh.position.copy(origin);
    this.scene.add(mesh);
    const d = dir.clone().normalize();
    this.list.push({
      mesh,
      vx: d.x * speed,
      vy: d.y * speed,
      vz: d.z * speed,
      damage,
      pierceLeft: pierce,
      ricochetLeft: fromPlayer && ricochet ? 1 : 0,
      fromPlayer,
      alive: true,
      hitIds: new Set(),
    });
  }

  update(
    dt: number,
    colliders: Aabb[],
    roomHalfW: number,
    roomHalfD: number,
  ): void {
    for (const p of this.list) {
      if (!p.alive) continue;
      p.mesh.position.x += p.vx * dt;
      p.mesh.position.y += p.vy * dt;
      p.mesh.position.z += p.vz * dt;

      const { x, y, z } = p.mesh.position;
      if (y < 0.05 || y > 4) {
        this.kill(p);
        continue;
      }

      if (Math.abs(x) > roomHalfW) {
        if (!this.tryRicochet(p, 'x')) continue;
      }
      if (Math.abs(z) > roomHalfD) {
        if (!this.tryRicochet(p, 'z')) continue;
      }

      for (const c of colliders) {
        if (circleHitsAabb(x, z, 0.1, c)) {
          const axis =
            Math.abs(p.vx) >= Math.abs(p.vz) ? 'x' : 'z';
          if (!this.tryRicochet(p, axis)) break;
        }
      }
    }
    this.gc();
  }

  /** Returns false if the projectile was killed. */
  private tryRicochet(p: Projectile, axis: 'x' | 'z'): boolean {
    if (p.ricochetLeft <= 0) {
      this.kill(p);
      return false;
    }
    p.ricochetLeft -= 1;
    if (axis === 'x') p.vx *= -1;
    else p.vz *= -1;
    // Nudge off the surface so we don't immediately re-hit.
    p.mesh.position.x += Math.sign(p.vx) * 0.15;
    p.mesh.position.z += Math.sign(p.vz) * 0.15;
    return true;
  }

  kill(p: Projectile): void {
    p.alive = false;
    this.scene.remove(p.mesh);
    p.mesh.geometry.dispose();
    (p.mesh.material as THREE.Material).dispose();
  }

  clear(): void {
    for (const p of this.list) {
      if (p.alive) this.kill(p);
    }
    this.list.length = 0;
  }

  private gc(): void {
    for (let i = this.list.length - 1; i >= 0; i--) {
      if (!this.list[i]!.alive) this.list.splice(i, 1);
    }
  }
}
