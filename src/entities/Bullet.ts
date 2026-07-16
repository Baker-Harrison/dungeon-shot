import Phaser from 'phaser';
import { DEPTH } from '../util/constants';
import { TEX } from '../util/textures';

export class Bullet extends Phaser.Physics.Arcade.Image {
  damage = 1;
  pierceLeft = 0;
  fromPlayer = true;
  private hitIds = new Set<number>();

  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0, TEX.bullet);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setDepth(DEPTH.bullet);
    this.setActive(false);
    this.setVisible(false);
  }

  fire(
    x: number,
    y: number,
    vx: number,
    vy: number,
    damage: number,
    pierce: number,
    fromPlayer: boolean,
  ): void {
    this.setTexture(fromPlayer ? TEX.bullet : TEX.enemyBullet);
    this.setPosition(x, y);
    this.setActive(true);
    this.setVisible(true);
    this.damage = damage;
    this.pierceLeft = pierce;
    this.fromPlayer = fromPlayer;
    this.hitIds.clear();
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.enable = true;
    body.setAllowGravity(false);
    this.setVelocity(vx, vy);
  }

  canHit(id: number): boolean {
    return !this.hitIds.has(id);
  }

  markHit(id: number): void {
    this.hitIds.add(id);
  }

  deactivate(): void {
    this.setActive(false);
    this.setVisible(false);
    this.setVelocity(0, 0);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.enable = false;
  }
}

export class BulletPool {
  group: Phaser.Physics.Arcade.Group;

  constructor(scene: Phaser.Scene, size = 64) {
    this.group = scene.physics.add.group({
      classType: Bullet,
      maxSize: size,
      runChildUpdate: false,
    });
    for (let i = 0; i < size; i++) {
      const b = new Bullet(scene);
      this.group.add(b, true);
      b.deactivate();
    }
  }

  spawn(
    x: number,
    y: number,
    vx: number,
    vy: number,
    damage: number,
    pierce: number,
    fromPlayer: boolean,
  ): Bullet | null {
    const bullet = this.group.getFirstDead(false) as Bullet | null;
    if (!bullet) return null;
    bullet.fire(x, y, vx, vy, damage, pierce, fromPlayer);
    return bullet;
  }

  cullOutOfBounds(bounds: Phaser.Geom.Rectangle): void {
    for (const child of this.group.getChildren()) {
      const b = child as Bullet;
      if (!b.active) continue;
      if (!bounds.contains(b.x, b.y)) b.deactivate();
    }
  }
}
