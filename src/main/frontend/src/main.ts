import GameScene from './gameScene.js';

declare var Phaser: any;

const config: any = {
    type: Phaser.AUTO,
    width: 7 * 80 + 80 * 2,
    height: 6 * 80 + 60 * 2,
    backgroundColor: '#222',
    parent: 'phaser-game',
    scene: [GameScene]
};

new Phaser.Game(config);
