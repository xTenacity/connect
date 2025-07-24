import Phaser from "phaser";
import GameScene from "./scenes/GameScene";

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 700,
  height: 600,
  backgroundColor: "#222",
  scene: [GameScene],
  parent: "game-container"
};

new Phaser.Game(config);