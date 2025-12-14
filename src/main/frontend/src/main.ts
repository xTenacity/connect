import GameScene from './gameScene.js';

// Prefer 'game-container' (used by templates). Create it if missing.
const CONTAINER_ID = 'game-container';
let container = document.getElementById(CONTAINER_ID) as HTMLElement | null;
if (!container) {
    const div = document.createElement('div');
    div.id = CONTAINER_ID;
    div.style.width = '800px';
    div.style.height = '600px';
    document.body.appendChild(div);
    container = div;
}

if (container) {
    new GameScene(container);
} else {
    console.error('No container for game scene');
}
