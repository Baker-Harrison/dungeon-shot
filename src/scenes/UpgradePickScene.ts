import Phaser from 'phaser';
import { COLORS, GAME_HEIGHT, GAME_WIDTH } from '../util/constants';
import { RUN_UPGRADES, type UpgradeId } from '../data/upgrades';
import { applyRunUpgrade, getRun } from '../state/session';
import { rollUpgradeChoices } from '../dungeon/generate';

export class UpgradePickScene extends Phaser.Scene {
  constructor() {
    super('UpgradePick');
  }

  create(): void {
    const run = getRun();
    const ids = rollUpgradeChoices(
      run.seed,
      run.roomsCleared,
      RUN_UPGRADES,
      3,
    ) as UpgradeId[];

    this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.72)
      .setScrollFactor(0);

    this.add
      .text(GAME_WIDTH / 2, 120, 'CHOOSE AN UPGRADE', {
        fontFamily: 'Georgia, serif',
        fontSize: '32px',
        color: COLORS.text,
      })
      .setOrigin(0.5)
      .setScrollFactor(0);

    ids.forEach((id, i) => {
      const def = RUN_UPGRADES.find((u) => u.id === id)!;
      const y = 220 + i * 100;
      const card = this.add
        .rectangle(GAME_WIDTH / 2, y, 420, 80, 0x2d3748, 1)
        .setStrokeStyle(2, 0x63b3ed)
        .setInteractive({ useHandCursor: true })
        .setScrollFactor(0);

      const title = this.add
        .text(GAME_WIDTH / 2, y - 14, def.name, {
          fontFamily: 'monospace',
          fontSize: '20px',
          color: '#63b3ed',
        })
        .setOrigin(0.5)
        .setScrollFactor(0);

      const desc = this.add
        .text(GAME_WIDTH / 2, y + 16, def.description, {
          fontFamily: 'monospace',
          fontSize: '14px',
          color: '#a0aec0',
        })
        .setOrigin(0.5)
        .setScrollFactor(0);

      const pick = () => {
        applyRunUpgrade(id);
        this.scene.stop();
        this.scene.resume('Run');
        this.scene.get('Run').events.emit('upgrade-picked');
      };

      card.on('pointerover', () => card.setFillStyle(0x4a5568));
      card.on('pointerout', () => card.setFillStyle(0x2d3748));
      card.on('pointerup', pick);
      title.setInteractive({ useHandCursor: true }).on('pointerup', pick);
      desc.setInteractive({ useHandCursor: true }).on('pointerup', pick);

      this.input.keyboard?.once(`keydown-${i + 1}`, pick);
    });

    this.add
      .text(GAME_WIDTH / 2, 540, 'Press 1 / 2 / 3 or click', {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#718096',
      })
      .setOrigin(0.5)
      .setScrollFactor(0);
  }
}
