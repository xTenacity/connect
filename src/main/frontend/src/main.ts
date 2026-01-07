import GameScene from './gameScene.js';

// Prefer 'game-container' (used by templates). Create it if missing.
const CONTAINER_ID = 'game-container';
let container = document.getElementById(CONTAINER_ID);
if (!container) {
    const div = document.createElement('div');
    div.id = CONTAINER_ID;
    div.style.width = '800px';
    div.style.height = '600px';
    document.body.appendChild(div);
    container = div;
}

if (container instanceof HTMLElement) {
    (async () => {
        const gs = new GameScene(container);
        try {
            await gs.init();
        } catch (err) {
            console.error('GameScene init failed', err);
        }
    })();
} else {
    console.error('No container for game scene');
}
