import Phaser from 'phaser';
import { DEPTH } from '../util/constants';
import { TEX } from '../util/textures';
import { ENEMY_DEFS, type EnemyKind } from '../data/enemies';

export class Enemy extends Phaser.Physics.Arcade.Sprite {
  kind: EnemyKind;
  hp: number;
  maxHp: number;
  speed: number;
  contactDamage: number;
  shootCooldownMs: number;
  bulletDamage: number;
  private nextShot = 0;
  private burstLeft = 0;
  private burstTimer = 0;

  constructor(scene: Phaser.Scene, x: number, y: number, kind: EnemyKind) {
    const tex =
      kind === 'boss' ? TEX.boss : kind === 'shooter' ? TEX.shooter : TEX.chaser;
    super(scene, x, y, tex);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setDepth(DEPTH.enemy);

    const def = ENEMY_DEFS[kind];
    this.kind = kind;
    this.hp = def.hp;
    this.maxHp = def.hp;
    this.speed = def.speed;
    this.contactDamage = def.contactDamage;
    this.shootCooldownMs = def.shootCooldownMs ?? 0;
    this.bulletDamage = def.bulletDamage ?? 0;
    // Don't volley the player on the first frame of a room load.
    this.nextShot = scene.time.now + 400 + Math.random() * 600;

    const body = this.body as Phaser.Physics.Arcade.Body;
    if (kind === 'boss') {
      body.setSize(48, 48);
      body.setOffset(4, 4);
    } else {
      body.setSize(22, 22);
      body.setOffset(2, 2);
    }
  }

  hurt(amount: number): boolean {
    this.hp -= amount;
    this.setTintFill(0xffffff);
    this.scene.time.delayedCall(60, () => {
      if (this.active) this.clearTint();
    });
    return this.hp <= 0;
  }

  aiUpdate(
    time: number,
    player: Phaser.GameObjects.Sprite,
    fireEnemyBullet: (x: number, y: number, vx: number, vy: number) => void,
  ): void {
    if (!this.active || !player.active) return;

    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.hypot(dx, dy) || 1;

    if (this.kind === 'chaser') {
      this.setVelocity((dx / dist) * this.speed, (dy / dist) * this.speed);
    } else if (this.kind === 'shooter') {
      const prefer = 180;
      if (dist < prefer - 40) {
        this.setVelocity((-dx / dist) * this.speed, (-dy / dist) * this.speed);
      } else if (dist > prefer + 40) {
        this.setVelocity((dx / dist) * this.speed, (dy / dist) * this.speed);
      } else {
        this.setVelocity(0, 0);
      }
      if (time >= this.nextShot) {
        this.nextShot = time + this.shootCooldownMs;
        const angle = Math.atan2(dy, dx);
        const spd = 260;
        fireEnemyBullet(
          this.x,
          this.y,
          Math.cos(angle) * spd,
          Math.sin(angle) * spd,
        );
      }
    } else if (this.kind === 'boss') {
      this.setVelocity((dx / dist) * this.speed, (dy / dist) * this.speed);
      if (this.burstLeft > 0 && time >= this.burstTimer) {
        this.burstLeft -= 1;
        this.burstTimer = time + 120;
        const angle = Math.atan2(dy, dx);
        const spd = 300;
        for (const offset of [-0.25, 0, 0.25]) {
          const a = angle + offset;
          fireEnemyBullet(
            this.x,
            this.y,
            Math.cos(a) * spd,
            Math.sin(a) * spd,
          );
        }
      } else if (time >= this.nextShot) {
        this.nextShot = time + this.shootCooldownMs;
        this.burstLeft = 3;
        this.burstTimer = time;
      }
    }
  }
}
