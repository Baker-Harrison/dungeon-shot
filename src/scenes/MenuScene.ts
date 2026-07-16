import Phaser from 'phaser';
import { COLORS, GAME_HEIGHT, GAME_WIDTH } from '../util/constants';
import { getMeta, startNewRun } from '../state/session';
import { makeSeed } from '../util/rng';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super('Menu');
  }

  create(): void {
    const meta = getMeta();
    this.add.rectangle(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      GAME_WIDTH,
      GAME_HEIGHT,
      COLORS.bg,
    );

    this.add
      .text(GAME_WIDTH / 2, 160, 'DUNGEON SHOT', {
        fontFamily: 'Georgia, serif',
        fontSize: '48px',
        color: COLORS.text,
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, 230, 'Twin-stick dungeon roguelite', {
        fontFamily: 'monospace',
        fontSize: '16px',
        color: '#a0aec0',
      })
      .setOrigin(0.5);

    this.add
      .text(
        GAME_WIDTH / 2,
        300,
        `Meta currency: ${meta.currency}\nWASD move · Mouse aim/fire`,
        {
          fontFamily: 'monospace',
          fontSize: '14px',
          color: '#cbd5e0',
          align: 'center',
        },
      )
      .setOrigin(0.5);

    const startBtn = this.add
      .text(GAME_WIDTH / 2, 400, '[ START RUN ]', {
        fontFamily: 'monospace',
        fontSize: '28px',
        color: '#68d391',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    startBtn.on('pointerover', () => startBtn.setColor('#9ae6b4'));
    startBtn.on('pointerout', () => startBtn.setColor('#68d391'));
    startBtn.on('pointerup', () => this.beginRun());

    const hubBtn = this.add
      .text(GAME_WIDTH / 2, 460, '[ META HUB ]', {
        fontFamily: 'monospace',
        fontSize: '20px',
        color: '#63b3ed',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    hubBtn.on('pointerover', () => hubBtn.setColor('#90cdf4'));
    hubBtn.on('pointerout', () => hubBtn.setColor('#63b3ed'));
    hubBtn.on('pointerup', () => this.scene.start('MetaHub'));

    this.input.keyboard?.once('keydown-ENTER', () => this.beginRun());
    this.input.keyboard?.once('keydown-SPACE', () => this.beginRun());
  }

  private beginRun(): void {
    startNewRun(getMeta(), makeSeed());
    this.scene.start('Run');
  }
}
