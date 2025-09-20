// Phaser is loaded globally from CDN
import PreloaderScene from './preloaderScene.js';
import GameScene from './gameScene.js';

const config = {
    type: Phaser.AUTO,
    width: 480,
    height: 854,
    parent: 'phaser-game-container',
    backgroundColor: 'transparent',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 800 },
            debug: false
        }
    },
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: 480,
        height: 854,
        // Handle mobile viewport changes
        resizeInterval: 500
    },
    scene: [PreloaderScene, GameScene]
};

new Phaser.Game(config);

