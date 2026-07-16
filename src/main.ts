import { GameApp } from './app/GameApp';

const container = document.getElementById('game-container');
if (!container) throw new Error('Missing #game-container');

new GameApp(container);
