import Phaser from 'phaser';
import {
  COLORS,
  GAME_HEIGHT,
  GAME_WIDTH,
  ROOM_HEIGHT,
  ROOM_WIDTH,
  WALL_THICKNESS,
} from '../util/constants';
import { getRun, markPlayerDead, markRoomCleared } from '../state/session';
import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';
import { Bullet, BulletPool } from '../entities/Bullet';
import {
  Door,
  buildRoomWalls,
  spawnPointForEntry,
} from '../entities/Door';
import type { Dir } from '../dungeon/types';
import { OPPOSITE } from '../dungeon/types';

export class RunScene extends Phaser.Scene {
  private player!: Player;
  private walls!: Phaser.Physics.Arcade.StaticGroup;
  private floor?: Phaser.GameObjects.Image;
  private enemies!: Phaser.Physics.Arcade.Group;
  private playerBullets!: BulletPool;
  private enemyBullets!: BulletPool;
  private doors: Door[] = [];
  private doorZones: Phaser.GameObjects.Zone[] = [];
  private keys!: {
    W: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
  };
  private hpText!: Phaser.GameObjects.Text;
  private roomText!: Phaser.GameObjects.Text;
  private awaitingUpgrade = false;
  private travelLockUntil = 0;
  private isTraveling = false;
  private runEnding = false;
  private roomCenter = { x: GAME_WIDTH / 2, y: GAME_HEIGHT / 2 + 20 };
  private roomBounds!: Phaser.Geom.Rectangle;
  private colliders: Phaser.Physics.Arcade.Collider[] = [];
  private nextEnemyId = 1;

  constructor() {
    super('Run');
  }

  create(): void {
    this.cameras.main.setBackgroundColor(COLORS.bg);
    this.awaitingUpgrade = false;
    this.runEnding = false;
    this.isTraveling = false;
    this.travelLockUntil = this.time.now + 400;

    this.keys = this.input.keyboard!.addKeys({
      W: Phaser.Input.Keyboard.KeyCodes.W,
      A: Phaser.Input.Keyboard.KeyCodes.A,
      S: Phaser.Input.Keyboard.KeyCodes.S,
      D: Phaser.Input.Keyboard.KeyCodes.D,
    }) as typeof this.keys;

    this.enemies = this.physics.add.group();
    this.playerBullets = new BulletPool(this, 80);
    this.enemyBullets = new BulletPool(this, 80);

    const spawn = spawnPointForEntry(
      this.roomCenter.x,
      this.roomCenter.y,
      getRun().enteredFrom,
    );
    this.player = new Player(this, spawn.x, spawn.y);

    this.hpText = this.add
      .text(16, 12, '', {
        fontFamily: 'monospace',
        fontSize: '16px',
        color: COLORS.text,
      })
      .setScrollFactor(0)
      .setDepth(100);

    this.roomText = this.add
      .text(GAME_WIDTH - 16, 12, '', {
        fontFamily: 'monospace',
        fontSize: '16px',
        color: '#a0aec0',
      })
      .setOrigin(1, 0)
      .setScrollFactor(0)
      .setDepth(100);

    this.events.off('upgrade-picked');
    this.events.on('upgrade-picked', () => {
      this.awaitingUpgrade = false;
      this.unlockDoors();
    });

    this.loadRoom(getRun().currentRoomId);
    this.refreshHud();
  }

  private clearColliders(): void {
    for (const c of this.colliders) c.destroy();
    this.colliders = [];
  }

  private clearRoomVisuals(): void {
    this.clearColliders();
    this.walls?.clear(true, true);
    this.floor?.destroy();
    this.floor = undefined;
    this.doors.forEach((d) => d.destroy());
    this.doors = [];
    this.doorZones.forEach((z) => z.destroy());
    this.doorZones = [];
    this.enemies.clear(true, true);
    for (const c of this.playerBullets.group.getChildren()) {
      (c as Bullet).deactivate();
    }
    for (const c of this.enemyBullets.group.getChildren()) {
      (c as Bullet).deactivate();
    }
  }

  private addCollider(
    a: Phaser.Types.Physics.Arcade.ArcadeColliderType,
    b: Phaser.Types.Physics.Arcade.ArcadeColliderType,
    callback?: Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
  ): void {
    this.colliders.push(this.physics.add.collider(a, b, callback));
  }

  private addOverlap(
    a: Phaser.Types.Physics.Arcade.ArcadeColliderType,
    b: Phaser.Types.Physics.Arcade.ArcadeColliderType,
    callback: Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
  ): void {
    this.colliders.push(this.physics.add.overlap(a, b, callback));
  }

  private loadRoom(roomId: string): void {
    this.clearRoomVisuals();
    const run = getRun();
    const room = run.dungeon.rooms[roomId];
    if (!room) throw new Error(`Missing room ${roomId}`);
    run.currentRoomId = roomId;

    const openDirs = Object.keys(room.connections) as Dir[];
    const built = buildRoomWalls(
      this,
      this.roomCenter.x,
      this.roomCenter.y,
      openDirs,
    );
    this.walls = built.walls;
    this.floor = built.floor;

    this.roomBounds = new Phaser.Geom.Rectangle(
      this.roomCenter.x - ROOM_WIDTH / 2 + WALL_THICKNESS,
      this.roomCenter.y - ROOM_HEIGHT / 2 + WALL_THICKNESS,
      ROOM_WIDTH - WALL_THICKNESS * 2,
      ROOM_HEIGHT - WALL_THICKNESS * 2,
    );

    for (const dir of openDirs) {
      const door = new Door(this, dir, this.roomCenter.x, this.roomCenter.y);
      this.doors.push(door);

      const zone = this.add.zone(door.x, door.y, 80, 80);
      this.physics.add.existing(zone, true);
      this.doorZones.push(zone);
      this.addOverlap(this.player, zone, () => {
        if (this.isTraveling || door.locked || this.awaitingUpgrade) return;
        if (this.time.now < this.travelLockUntil) return;
        // Defer out of the physics step to avoid re-entrant loadRoom freezes.
        this.isTraveling = true;
        const travelDir = dir;
        this.time.delayedCall(0, () => this.travel(travelDir));
      });
    }

    this.addCollider(this.player, this.walls);
    this.addCollider(this.enemies, this.walls);
    this.addCollider(this.playerBullets.group, this.walls, (bullet) =>
      (bullet as Bullet).deactivate(),
    );
    this.addCollider(this.enemyBullets.group, this.walls, (bullet) =>
      (bullet as Bullet).deactivate(),
    );

    this.addOverlap(this.playerBullets.group, this.enemies, (bulletObj, enemyObj) => {
      if (this.runEnding) return;
      const bullet = bulletObj as Bullet;
      const enemy = enemyObj as Enemy;
      if (!bullet.active || !enemy.active || !bullet.fromPlayer) return;
      const eid = enemy.getData('eid') as number;
      if (!bullet.canHit(eid)) return;
      bullet.markHit(eid);
      const dead = enemy.hurt(bullet.damage);
      if (bullet.pierceLeft <= 0) {
        bullet.deactivate();
      } else {
        bullet.pierceLeft -= 1;
      }
      if (dead) {
        enemy.destroy();
        this.checkRoomClear();
      }
    });

    this.addOverlap(this.player, this.enemies, (_p, enemyObj) => {
      if (this.runEnding) return;
      const enemy = enemyObj as Enemy;
      if (!enemy.active) return;
      const killed = this.player.takeHit(this.time.now, enemy.contactDamage);
      this.refreshHud();
      if (killed) this.requestEndRun(false);
    });

    this.addOverlap(this.enemyBullets.group, this.player, (bulletObj) => {
      if (this.runEnding) return;
      const bullet = bulletObj as Bullet;
      if (!bullet.active || bullet.fromPlayer) return;
      bullet.deactivate();
      const killed = this.player.takeHit(this.time.now, bullet.damage);
      this.refreshHud();
      if (killed) this.requestEndRun(false);
    });

    if (!room.cleared && room.enemies.length > 0) {
      this.lockDoors();
      room.enemies.forEach((kind, i) => {
        const angle = (i / Math.max(1, room.enemies.length)) * Math.PI * 2;
        const dist = kind === 'boss' ? 0 : 120;
        const ex = this.roomCenter.x + Math.cos(angle) * dist;
        const ey = this.roomCenter.y + Math.sin(angle) * dist;
        const enemy = new Enemy(this, ex, ey, kind);
        enemy.setData('eid', this.nextEnemyId++);
        this.enemies.add(enemy);
      });
    } else {
      this.unlockDoors();
    }

    const spawn = spawnPointForEntry(
      this.roomCenter.x,
      this.roomCenter.y,
      run.enteredFrom,
    );
    this.player.setPosition(spawn.x, spawn.y);
    this.player.setVelocity(0, 0);
    // Refresh body position after teleport so arcade doesn't keep stale embeds.
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.updateFromGameObject();
    this.travelLockUntil = this.time.now + 600;
    this.isTraveling = false;

    this.refreshHud();
  }

  private lockDoors(): void {
    this.doors.forEach((d) => d.setLocked(true));
  }

  private unlockDoors(): void {
    this.doors.forEach((d) => d.setLocked(false));
  }

  private checkRoomClear(): void {
    if (this.runEnding) return;
    if (this.enemies.countActive(true) > 0) return;
    const run = getRun();
    const room = run.dungeon.rooms[run.currentRoomId]!;
    if (room.cleared) return;

    markRoomCleared(room.id);
    this.refreshHud();

    if (room.type === 'boss') {
      this.requestEndRun(true, 600);
      return;
    }

    if (room.type === 'combat') {
      // Defer scene pause/launch out of the physics overlap callback.
      this.awaitingUpgrade = true;
      this.time.delayedCall(0, () => {
        if (this.runEnding) return;
        this.scene.pause();
        this.scene.launch('UpgradePick');
      });
    } else {
      this.unlockDoors();
    }
  }

  private travel(dir: Dir): void {
    const run = getRun();
    const room = run.dungeon.rooms[run.currentRoomId]!;
    const nextId = room.connections[dir];
    if (!nextId) {
      this.isTraveling = false;
      return;
    }
    run.enteredFrom = OPPOSITE[dir];
    this.loadRoom(nextId);
    this.isTraveling = false;
  }

  /** Never call scene transitions directly from physics callbacks. */
  private requestEndRun(won: boolean, delayMs = 0): void {
    if (this.runEnding) return;
    this.runEnding = true;
    this.player.setVelocity(0, 0);
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.enable = false;

    this.time.delayedCall(delayMs, () => {
      if (!won) markPlayerDead();
      this.scene.stop('UpgradePick');
      this.scene.start('Results');
    });
  }

  private refreshHud(): void {
    const run = getRun();
    const room = run.dungeon.rooms[run.currentRoomId]!;
    this.hpText.setText(
      `HP ${run.hp}/${run.maxHp}  DMG ${run.damage}  Pierce ${run.pierce}`,
    );
    this.roomText.setText(
      `${room.type.toUpperCase()} · Cleared ${run.roomsCleared}/${run.dungeon.combatCount} · $${run.currencyEarned}`,
    );
  }

  update(): void {
    if (this.runEnding || this.awaitingUpgrade || !this.player?.active) return;

    this.player.updateMovement({
      left: this.keys.A.isDown,
      right: this.keys.D.isDown,
      up: this.keys.W.isDown,
      down: this.keys.S.isDown,
    });

    this.player.tryFire(this.input.activePointer, (x, y, vx, vy) => {
      this.playerBullets.spawn(
        x,
        y,
        vx,
        vy,
        this.player.damage,
        this.player.pierce,
        true,
      );
    });

    this.enemies.getChildren().forEach((obj) => {
      const enemy = obj as Enemy;
      if (!enemy.active) return;
      enemy.aiUpdate(this.time.now, this.player, (x, y, vx, vy) => {
        this.enemyBullets.spawn(x, y, vx, vy, enemy.bulletDamage, 0, false);
      });
    });

    this.playerBullets.cullOutOfBounds(this.roomBounds);
    this.enemyBullets.cullOutOfBounds(this.roomBounds);
  }
}
