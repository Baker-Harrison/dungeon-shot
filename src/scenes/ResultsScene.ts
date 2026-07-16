import Phaser from 'phaser';
import { COLORS, GAME_HEIGHT, GAME_WIDTH } from '../util/constants';
import { getMeta, getRun, setMeta } from '../state/session';
import { addCurrency, saveMeta } from '../state/save';

export class ResultsScene extends Phaser.Scene {
  constructor() {
    super('Results');
  }

  create(): void {
    const run = getRun();
    let meta = getMeta();
    meta = addCurrency(meta, run.currencyEarned);
    setMeta(meta);
    saveMeta(meta);

    const title = run.won ? 'VICTORY' : 'DEFEATED';
    const titleColor = run.won ? '#68d391' : '#fc8181';

    this.add.rectangle(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      GAME_WIDTH,
      GAME_HEIGHT,
      COLORS.bg,
    );

    this.add
      .text(GAME_WIDTH / 2, 140, title, {
        fontFamily: 'Georgia, serif',
        fontSize: '48px',
        color: titleColor,
      })
      .setOrigin(0.5);

    this.add
      .text(
        GAME_WIDTH / 2,
        260,
        [
          `Rooms cleared: ${run.roomsCleared}`,
          `Currency earned: +${run.currencyEarned}`,
          `Total currency: ${meta.currency}`,
          `Upgrades taken: ${run.pickedUpgrades.length}`,
        ].join('\n'),
        {
          fontFamily: 'monospace',
          fontSize: '18px',
          color: COLORS.text,
          align: 'center',
          lineSpacing: 8,
        },
      )
      .setOrigin(0.5);

    const hub = this.add
      .text(GAME_WIDTH / 2, 420, '[ CONTINUE TO META HUB ]', {
        fontFamily: 'monospace',
        fontSize: '22px',
        color: '#63b3ed',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    hub.on('pointerup', () => this.scene.start('MetaHub'));
    this.input.keyboard?.once('keydown-ENTER', () => this.scene.start('MetaHub'));
    this.input.keyboard?.once('keydown-SPACE', () => this.scene.start('MetaHub'));
  }
}
