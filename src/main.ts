import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from './util/constants';
import { BootScene } from './scenes/BootScene';
import { MenuScene } from './scenes/MenuScene';
import { RunScene } from './scenes/RunScene';
import { UpgradePickScene } from './scenes/UpgradePickScene';
import { ResultsScene } from './scenes/ResultsScene';
import { MetaHubScene } from './scenes/MetaHubScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: '#0d1117',
  // Keep simulating if the tab/canvas briefly loses focus (devtools, IDE, etc.)
  disableContextMenu: true,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [
    BootScene,
    MenuScene,
    RunScene,
    UpgradePickScene,
    ResultsScene,
    MetaHubScene,
  ],
};

const game = new Phaser.Game(config);

// Prevent blur/visibility from sleeping the sim (common when IDE/devtools steal focus).
game.events.on('blur', () => {
  game.loop.wake(true);
});
game.events.on('hidden', () => {
  game.loop.wake(true);
});
document.addEventListener('pointerdown', () => game.loop.wake(true));
document.addEventListener('keydown', () => game.loop.wake(true));
