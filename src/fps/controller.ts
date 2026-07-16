import * as THREE from 'three';
import { EYE_HEIGHT, PLAYER_RADIUS } from '../util/constants';
import type { Aabb } from '../world/colliders';
import { moveWithColliders } from '../world/colliders';
import type { Input } from './input';

const LOOK_SENS = 0.0022;
const PITCH_LIMIT = 1.4;

export class FpsController {
  readonly camera: THREE.PerspectiveCamera;
  yaw = 0;
  pitch = 0;
  x = 0;
  z = 0;
  private colliders: Aabb[] = [];
  private readonly lookEuler = new THREE.Euler(0, 0, 0, 'YXZ');

  constructor(aspect: number) {
    this.camera = new THREE.PerspectiveCamera(95, aspect, 0.05, 200);
    this.camera.rotation.order = 'YXZ';
    this.camera.position.set(0, EYE_HEIGHT, 0);
  }

  setColliders(colliders: Aabb[]): void {
    this.colliders = colliders;
  }

  setPose(x: number, z: number, yaw: number): void {
    this.x = x;
    this.z = z;
    this.yaw = yaw;
    this.pitch = 0;
    this.syncCamera();
  }

  update(dt: number, input: Input, moveSpeed: number, locked: boolean): void {
    if (!locked) {
      this.syncCamera();
      return;
    }

    this.yaw -= input.mouseDX * LOOK_SENS;
    this.pitch -= input.mouseDY * LOOK_SENS;
    this.pitch = Math.max(-PITCH_LIMIT, Math.min(PITCH_LIMIT, this.pitch));

    let mx = 0;
    let mz = 0;
    if (input.keys.has('KeyW')) mz -= 1;
    if (input.keys.has('KeyS')) mz += 1;
    if (input.keys.has('KeyA')) mx -= 1;
    if (input.keys.has('KeyD')) mx += 1;
    if (mx !== 0 || mz !== 0) {
      const len = Math.hypot(mx, mz);
      mx /= len;
      mz /= len;
      const sin = Math.sin(this.yaw);
      const cos = Math.cos(this.yaw);
      const dx = (mx * cos + mz * sin) * moveSpeed * dt;
      const dz = (-mx * sin + mz * cos) * moveSpeed * dt;
      const next = moveWithColliders(
        this.x,
        this.z,
        dx,
        dz,
        PLAYER_RADIUS,
        this.colliders,
      );
      this.x = next.x;
      this.z = next.z;
    }

    this.syncCamera();
  }

  forward(): THREE.Vector3 {
    const v = new THREE.Vector3(0, 0, -1);
    v.applyEuler(this.lookEuler.set(this.pitch, this.yaw, 0, 'YXZ'));
    return v.normalize();
  }

  private syncCamera(): void {
    this.camera.position.set(this.x, EYE_HEIGHT, this.z);
    this.lookEuler.set(this.pitch, this.yaw, 0, 'YXZ');
    this.camera.quaternion.setFromEuler(this.lookEuler);
  }
}
