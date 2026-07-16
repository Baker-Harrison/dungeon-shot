import Phaser from 'phaser';
import { COLORS, GAME_HEIGHT, GAME_WIDTH } from '../util/constants';
import {
  META_UPGRADES,
  metaUpgradeCost,
  type MetaUpgradeId,
} from '../data/metaUpgrades';
import { getMeta, setMeta } from '../state/session';
import { saveMeta } from '../state/save';

export class MetaHubScene extends Phaser.Scene {
  private currencyText!: Phaser.GameObjects.Text;
  private rows: Phaser.GameObjects.GameObject[] = [];

  constructor() {
    super('MetaHub');
  }

  create(): void {
    this.add.rectangle(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      GAME_WIDTH,
      GAME_HEIGHT,
      COLORS.bg,
    );

    this.add
      .text(GAME_WIDTH / 2, 80, 'META HUB', {
        fontFamily: 'Georgia, serif',
        fontSize: '40px',
        color: COLORS.text,
      })
      .setOrigin(0.5);

    this.currencyText = this.add
      .text(GAME_WIDTH / 2, 130, '', {
        fontFamily: 'monospace',
        fontSize: '18px',
        color: '#f6e05e',
      })
      .setOrigin(0.5);

    this.refresh();

    const back = this.add
      .text(GAME_WIDTH / 2, 560, '[ BACK TO MENU ]', {
        fontFamily: 'monospace',
        fontSize: '20px',
        color: '#68d391',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    back.on('pointerup', () => this.scene.start('Menu'));
  }

  private refresh(): void {
    for (const obj of this.rows) obj.destroy();
    this.rows = [];

    const meta = getMeta();
    this.currencyText.setText(`Currency: ${meta.currency}`);

    META_UPGRADES.forEach((def, i) => {
      const level = meta.upgrades[def.id];
      const y = 200 + i * 90;
      const maxed = level >= def.maxLevel;
      const cost = metaUpgradeCost(def, level);
      const canBuy = !maxed && meta.currency >= cost;

      const label = this.add
        .text(
          GAME_WIDTH / 2,
          y - 12,
          `${def.name}  Lv ${level}/${def.maxLevel}`,
          {
            fontFamily: 'monospace',
            fontSize: '18px',
            color: COLORS.text,
          },
        )
        .setOrigin(0.5);

      const detail = this.add
        .text(
          GAME_WIDTH / 2,
          y + 14,
          maxed ? def.description + ' (MAX)' : `${def.description} — cost ${cost}`,
          {
            fontFamily: 'monospace',
            fontSize: '13px',
            color: canBuy ? '#9ae6b4' : '#718096',
          },
        )
        .setOrigin(0.5);

      this.rows.push(label, detail);

      if (!maxed) {
        detail.setInteractive({ useHandCursor: true });
        detail.on('pointerup', () => this.buy(def.id));
        label.setInteractive({ useHandCursor: true });
        label.on('pointerup', () => this.buy(def.id));
      }
    });
  }

  private buy(id: MetaUpgradeId): void {
    let meta = getMeta();
    const def = META_UPGRADES.find((u) => u.id === id)!;
    const level = meta.upgrades[id];
    if (level >= def.maxLevel) return;
    const cost = metaUpgradeCost(def, level);
    if (meta.currency < cost) return;

    meta = {
      ...meta,
      currency: meta.currency - cost,
      upgrades: { ...meta.upgrades, [id]: level + 1 },
    };
    setMeta(meta);
    saveMeta(meta);
    this.refresh();
  }
}
