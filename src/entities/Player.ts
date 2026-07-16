import Phaser from 'phaser';
import { DEPTH } from '../util/constants';
import { TEX } from '../util/textures';
import { getRun } from '../state/session';

export class Player extends Phaser.Physics.Arcade.Sprite {
  private fireTimer = 0;
  iFrameUntil = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, TEX.player);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setDepth(DEPTH.player);
    this.setCollideWorldBounds(true);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(24, 24);
    body.setOffset(2, 2);
  }

  get moveSpeed(): number {
    return getRun().moveSpeed;
  }

  get fireCooldownMs(): number {
    return getRun().fireCooldownMs;
  }

  get damage(): number {
    return getRun().damage;
  }

  get pierce(): number {
    return getRun().pierce;
  }

  isInvulnerable(time: number): boolean {
    return time < this.iFrameUntil;
  }

  takeHit(time: number, amount: number): boolean {
    if (this.isInvulnerable(time)) return false;
    const run = getRun();
    run.hp = Math.max(0, run.hp - amount);
    this.iFrameUntil = time + 800;
    this.setTint(0xffffff);
    sceneFlash(this.scene);
    return run.hp <= 0;
  }

  updateMovement(
    cursors: { left: boolean; right: boolean; up: boolean; down: boolean },
  ): void {
    let vx = 0;
    let vy = 0;
    if (cursors.left) vx -= 1;
    if (cursors.right) vx += 1;
    if (cursors.up) vy -= 1;
    if (cursors.down) vy += 1;
    if (vx !== 0 || vy !== 0) {
      const len = Math.hypot(vx, vy);
      vx = (vx / len) * this.moveSpeed;
      vy = (vy / len) * this.moveSpeed;
    }
    this.setVelocity(vx, vy);

    const time = this.scene.time.now;
    if (this.isInvulnerable(time)) {
      this.setAlpha(0.5 + 0.5 * Math.sin(time / 40));
    } else {
      this.setAlpha(1);
      this.clearTint();
    }
  }

  tryFire(
    pointer: Phaser.Input.Pointer,
    spawnBullet: (x: number, y: number, vx: number, vy: number) => void,
  ): void {
    if (!pointer.isDown) return;
    const now = this.scene.time.now;
    if (now < this.fireTimer) return;
    this.fireTimer = now + this.fireCooldownMs;

    const angle = Phaser.Math.Angle.Between(
      this.x,
      this.y,
      pointer.worldX,
      pointer.worldY,
    );
    const speed = 420;
    spawnBullet(this.x, this.y, Math.cos(angle) * speed, Math.sin(angle) * speed);
  }
}

function sceneFlash(scene: Phaser.Scene): void {
  scene.cameras.main.shake(80, 0.004);
}
