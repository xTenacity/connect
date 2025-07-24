import Phaser from "phaser";
import "../teavm-api"; // Pull in the AI function declaration

export default class GameScene extends Phaser.Scene {
  board: number[][] = [];
  currentPlayer: number = 1;
  cellSize = 80;
  columns = 7;
  rows = 6;
  isAITurn = false;

  constructor() {
    super("GameScene");
  }

  create() {
    this.initBoard();
    this.drawBoard();

    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      if (this.currentPlayer === 1 && !this.isAITurn) {
        const col = Math.floor(pointer.x / this.cellSize);
        this.makeMove(col);
      }
    });
  }

  initBoard() {
    this.board = Array.from({ length: this.rows }, () => Array(this.columns).fill(0));
  }

  drawBoard() {
    const g = this.add.graphics();
    g.clear();
    g.fillStyle(0x0000ff);
    g.fillRect(0, 0, this.columns * this.cellSize, this.rows * this.cellSize);

    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.columns; col++) {
        g.fillStyle(0xffffff);
        g.fillCircle(
          col * this.cellSize + this.cellSize / 2,
          row * this.cellSize + this.cellSize / 2,
          this.cellSize / 2.5
        );

        const value = this.board[row][col];
        if (value === 1) g.fillStyle(0xff0000); // red
        else if (value === 2) g.fillStyle(0xffff00); // yellow
        if (value !== 0) {
          g.fillCircle(
            col * this.cellSize + this.cellSize / 2,
            row * this.cellSize + this.cellSize / 2,
            this.cellSize / 2.5
          );
        }
      }
    }
  }

  makeMove(col: number) {
    for (let row = this.rows - 1; row >= 0; row--) {
      if (this.board[row][col] === 0) {
        this.board[row][col] = this.currentPlayer;
        this.drawBoard();

        if (this.currentPlayer === 1) {
          this.currentPlayer = 2;
          this.runAITurn();
        } else {
          this.currentPlayer = 1;
        }

        break;
      }
    }
  }

  runAITurn() {
    this.isAITurn = true;
    this.time.delayedCall(500, () => {
      try {
        const move = ConnectAI.getMove(this.board);
        this.makeMove(move);
      } catch (err) {
        console.error("AI Error:", err);
      }
      this.isAITurn = false;
    });
  }
}
import Phaser from "phaser";
import "../teavm-api"; // Pull in the AI function declaration

export default class GameScene extends Phaser.Scene {
  board: number[][] = [];
  currentPlayer: number = 1;
  cellSize = 80;
  columns = 7;
  rows = 6;
  isAITurn = false;

  constructor() {
    super("GameScene");
  }

  create() {
    this.initBoard();
    this.drawBoard();

    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      if (this.currentPlayer === 1 && !this.isAITurn) {
        const col = Math.floor(pointer.x / this.cellSize);
        this.makeMove(col);
      }
    });
  }

  initBoard() {
    this.board = Array.from({ length: this.rows }, () => Array(this.columns).fill(0));
  }

  drawBoard() {
    const g = this.add.graphics();
    g.clear();
    g.fillStyle(0x0000ff);
    g.fillRect(0, 0, this.columns * this.cellSize, this.rows * this.cellSize);

    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.columns; col++) {
        g.fillStyle(0xffffff);
        g.fillCircle(
          col * this.cellSize + this.cellSize / 2,
          row * this.cellSize + this.cellSize / 2,
          this.cellSize / 2.5
        );

        const value = this.board[row][col];
        if (value === 1) g.fillStyle(0xff0000); // red
        else if (value === 2) g.fillStyle(0xffff00); // yellow
        if (value !== 0) {
          g.fillCircle(
            col * this.cellSize + this.cellSize / 2,
            row * this.cellSize + this.cellSize / 2,
            this.cellSize / 2.5
          );
        }
      }
    }
  }

  makeMove(col: number) {
    for (let row = this.rows - 1; row >= 0; row--) {
      if (this.board[row][col] === 0) {
        this.board[row][col] = this.currentPlayer;
        this.drawBoard();

        if (this.currentPlayer === 1) {
          this.currentPlayer = 2;
          this.runAITurn();
        } else {
          this.currentPlayer = 1;
        }

        break;
      }
    }
  }

  runAITurn() {
    this.isAITurn = true;
    this.time.delayedCall(500, () => {
      try {
        const move = ConnectAI.getMove(this.board);
        this.makeMove(move);
      } catch (err) {
        console.error("AI Error:", err);
      }
      this.isAITurn = false;
    });
  }
}
