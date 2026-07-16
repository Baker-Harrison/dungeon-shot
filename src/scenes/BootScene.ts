import Phaser from 'phaser';
import { generateTextures } from '../util/textures';
import { loadMeta } from '../state/save';
import { setMeta } from '../state/session';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create(): void {
    generateTextures(this);
    setMeta(loadMeta());
    this.scene.start('Menu');
  }
}
