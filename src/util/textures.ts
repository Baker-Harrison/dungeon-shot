import Phaser from 'phaser';
import { COLORS } from './constants';

export const TEX = {
  player: 'tex-player',
  bullet: 'tex-bullet',
  enemyBullet: 'tex-enemy-bullet',
  chaser: 'tex-chaser',
  shooter: 'tex-shooter',
  boss: 'tex-boss',
  wall: 'tex-wall',
  floor: 'tex-floor',
  doorLocked: 'tex-door-locked',
  doorOpen: 'tex-door-open',
  pixel: 'tex-pixel',
} as const;

function rect(
  scene: Phaser.Scene,
  key: string,
  w: number,
  h: number,
  color: number,
): void {
  if (scene.textures.exists(key)) return;
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  g.fillStyle(color, 1);
  g.fillRect(0, 0, w, h);
  g.generateTexture(key, w, h);
  g.destroy();
}

/** Generate prototype colored-rectangle textures. */
export function generateTextures(scene: Phaser.Scene): void {
  rect(scene, TEX.player, 28, 28, COLORS.player);
  rect(scene, TEX.bullet, 8, 8, COLORS.bullet);
  rect(scene, TEX.enemyBullet, 8, 8, COLORS.enemyBullet);
  rect(scene, TEX.chaser, 26, 26, COLORS.chaser);
  rect(scene, TEX.shooter, 26, 26, COLORS.shooter);
  rect(scene, TEX.boss, 56, 56, COLORS.boss);
  rect(scene, TEX.wall, 32, 32, COLORS.wall);
  rect(scene, TEX.floor, 32, 32, COLORS.floor);
  rect(scene, TEX.doorLocked, 64, 24, COLORS.doorLocked);
  rect(scene, TEX.doorOpen, 64, 24, COLORS.doorOpen);
  rect(scene, TEX.pixel, 2, 2, 0xffffff);
}
