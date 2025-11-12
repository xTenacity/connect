declare var Phaser: any;

import AssetManager, { AVAILABLE_ACTS, ActName } from './assetManager.js';
import { Board } from './board.js';

const COLS = 7;
const ROWS = 6;
const CELL_SIZE = 80;
const BOARD_OFFSET_X = 80;
const BOARD_OFFSET_Y = 60;

export default class GameScene extends Phaser.Scene {
    board: Board;
    assetManager: AssetManager;
    currentPlayer: 'X' | 'O';
    hoveringPiece: any | null;
    targetX: number;
    targetY: number;
    useSprites: boolean;

    constructor() {
        super({ key: 'GameScene' });
        this.board = new Board(COLS, ROWS);
        this.assetManager = new AssetManager('act1');
        this.currentPlayer = 'X';
        this.hoveringPiece = null;
        this.targetX = 0;
        this.targetY = 0;
        this.useSprites = false;
    }

    preload() {
        (this.load as any);

        // Attach loader event listeners for detailed logging
        this.load.on('fileprogress', (file: any, value: number) => {
            console.log(`Loading progress: key=${file.key} type=${file.type} progress=${Math.round(value * 100)}% url=${file.url}`);
        });
        this.load.on('filecomplete', (key: string, type: string, data: any) => {
            console.log(`File complete: key=${key} type=${type}`);
        });
        this.load.on('loaderror', (file: any) => {
            console.warn(`Load error: key=${file.key} type=${file.type} url=${file.url}`);
        });
        this.load.on('complete', () => {
            console.log('Loader complete. Total files loaded:', this.load.totalToLoad - this.load.totalFailed);
            console.log('Loader summary -> totalToLoad=', this.load.totalToLoad, 'totalLoaded=', this.load.totalLoaded, 'totalFailed=', this.load.totalFailed);
        });

        this.assetManager.loadActAssets(this.load);
        this.load.start();
    }

    create() {
        // If the textures aren't available (no real assets), generate placeholder textures programmatically
        this.createPlaceholdersIfNeeded();
        console.log('Placeholders created (if needed). Checking textures...');

        // check if sprite assets loaded
        this.useSprites = !!this.textures.exists('piece-x') && !!this.textures.exists('piece-o');
        console.log('useSprites =', this.useSprites);

        this.drawBoard();
        this.drawPieces();

        // Add simple DOM act selector
        this.createActSelector();

        this.input.on('pointermove', (pointer: any) => {
            const x = pointer.x - BOARD_OFFSET_X;
            const col = Math.floor(x / CELL_SIZE);
            const cx = BOARD_OFFSET_X + (col + 0.5) * CELL_SIZE;
            this.targetX = Phaser.Math.Clamp(cx, BOARD_OFFSET_X + CELL_SIZE / 2, BOARD_OFFSET_X + (COLS - 0.5) * CELL_SIZE);
            this.targetY = BOARD_OFFSET_Y - CELL_SIZE * 0.45; // above board

            if (!this.hoveringPiece) {
                if (this.useSprites) {
                    this.hoveringPiece = this.add.image(this.targetX, this.targetY, 'piece-x').setScale((CELL_SIZE * 0.7) / 64).setDepth(10);
                } else {
                    this.hoveringPiece = this.add.circle(this.targetX, this.targetY, CELL_SIZE * 0.35, 0xfdd835).setDepth(10);
                }
                this.hoveringPiece.setAlpha(0.95);
            }
            // lerp towards target handled in update
        });

        this.input.on('pointerdown', (pointer: any) => {
            const x = pointer.x - BOARD_OFFSET_X;
            const col = Math.floor(x / CELL_SIZE);
            if (col < 0 || col >= COLS) return;
            const row = this.getRowForCol(col);
            if (row === null) return;

            // animate falling piece
            this.dropPieceAnimated(col, this.currentPlayer);

            const winner = this.board.checkWin();
            if (winner !== 'no winner') {
                console.log('Winner', winner);
                return;
            }

            // switch to AI
            this.currentPlayer = this.currentPlayer === 'X' ? 'O' : 'X';
            if (this.currentPlayer === 'O') {
                this.time.delayedCall(300, () => {
                    // ask the Java backend for a move
                    const payload = {
                        board: this.board.board,
                        aiPiece: 'O',
                        aiDepth: 4,
                        mistakeRate: 0.0,
                        aiName: 'ServerAI'
                    };
                    console.log('Requesting AI move from server', payload);
                    fetch('/api/ai/move', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    })
                        .then((resp) => {
                            if (!resp.ok) throw new Error('Bad status ' + resp.status);
                            return resp.json();
                        })
                        .then((data) => {
                            console.log('AI response', data);
                            const aiMove = (data && typeof data.move === 'number') ? data.move : -1;
                            if (aiMove >= 0) {
                                this.dropPieceAnimated(aiMove, 'O');
                            } else {
                                console.warn('Invalid move from AI', data);
                            }
                        })
                        .catch((err) => console.error('AI fetch error', err))
                        .finally(() => { this.currentPlayer = 'X'; });
                });
            }
        });
    }

    update() {
        // animate hovering piece lerp if present
        if (this.hoveringPiece) {
            this.hoveringPiece.x += (this.targetX - this.hoveringPiece.x) * 0.15;
            this.hoveringPiece.y += (this.targetY - this.hoveringPiece.y) * 0.15;
        }
    }

    drawBoard() {
        const g = this.add.graphics();
        g.fillStyle(0x1976d2, 1);
        g.fillRect(BOARD_OFFSET_X, BOARD_OFFSET_Y, COLS * CELL_SIZE, ROWS * CELL_SIZE);
        for (let row = 0; row < ROWS; row++) {
            for (let col = 0; col < COLS; col++) {
                const cx = BOARD_OFFSET_X + col * CELL_SIZE + CELL_SIZE / 2;
                const cy = BOARD_OFFSET_Y + row * CELL_SIZE + CELL_SIZE / 2;
                g.fillStyle(0xe0e0e0, 1);
                g.fillCircle(cx, cy, CELL_SIZE * 0.35);
            }
        }
    }

    drawPieces() {
        // destroy previous pieces (keep hovering piece)
        (this.children as any).list.filter((obj: any) => obj.name === 'piece').forEach((obj: any) => obj.destroy());
        for (let row = 0; row < ROWS; row++) {
            for (let col = 0; col < COLS; col++) {
                if (this.board.board[row][col] === '_') continue;
                const cx = BOARD_OFFSET_X + col * CELL_SIZE + CELL_SIZE / 2;
                const cy = BOARD_OFFSET_Y + row * CELL_SIZE + CELL_SIZE / 2;
                if (this.useSprites && this.textures.exists(this.board.board[row][col] === 'X' ? 'piece-x' : 'piece-o')) {
                    const key = this.board.board[row][col] === 'X' ? 'piece-x' : 'piece-o';
                    const spr = this.add.image(cx, cy, key).setName('piece');
                    spr.setScale((CELL_SIZE * 0.7) / 64);
                } else {
                    const color = this.board.board[row][col] === 'X' ? 0xfdd835 : 0xd32f2f;
                    const piece = this.add.circle(cx, cy, CELL_SIZE * 0.35, color).setName('piece');
                    piece.setStrokeStyle(4, 0x333333);
                }
            }
        }
    }

    dropPieceAnimated(col: number, pieceChar: 'X' | 'O') {
        // compute target row
        const row = this.getRowForCol(col);
        if (row === null) return;

        // create a top piece at hovering position and tween to the target cell
        const cx = BOARD_OFFSET_X + col * CELL_SIZE + CELL_SIZE / 2;
        const targetY = BOARD_OFFSET_Y + row * CELL_SIZE + CELL_SIZE / 2;

        let top: any;
        if (this.useSprites && this.textures.exists(pieceChar === 'X' ? 'piece-x' : 'piece-o')) {
            const key = pieceChar === 'X' ? 'piece-x' : 'piece-o';
            top = this.add.image(this.targetX || cx, BOARD_OFFSET_Y - CELL_SIZE * 0.45, key).setDepth(20);
            top.setScale((CELL_SIZE * 0.7) / 64);
        } else {
            const color = pieceChar === 'X' ? 0xfdd835 : 0xd32f2f;
            top = this.add.circle(this.targetX || cx, BOARD_OFFSET_Y - CELL_SIZE * 0.45, CELL_SIZE * 0.35, color).setDepth(20);
            top.setStrokeStyle(4, 0x333333);
        }

        // tween to drop
        this.tweens.add({
            targets: top,
            x: cx,
            y: targetY,
            duration: 220,
            ease: 'Cubic',
            onComplete: () => {
                // commit to board, destroy top and redraw
                top.destroy();
                this.board.drop(col, pieceChar);
                this.drawPieces();
            }
        });
    }

    getRowForCol(col: number): number | null {
        for (let row = ROWS - 1; row >= 0; row--) {
            if (this.board.board[row][col] === '_') return row;
        }
        return null;
    }

    createActSelector() {
        // create a simple DOM select that sits on the page
        const existing = document.getElementById('act-select');
        if (existing) return;
        const sel = document.createElement('select');
        sel.id = 'act-select';
        sel.style.position = 'absolute';
        sel.style.left = '12px';
        sel.style.top = '12px';
        sel.style.zIndex = '1000';
        for (const act of AVAILABLE_ACTS) {
            const opt = document.createElement('option');
            opt.value = act;
            opt.text = act;
            sel.appendChild(opt);
        }
        sel.addEventListener('change', (e: any) => {
            const val = e.target.value as ActName;
            this.assetManager.setAct(val);
            // reload assets for new act (simple approach: restart scene)
            this.scene.restart();
        });
        document.body.appendChild(sel);
    }

    createPlaceholdersIfNeeded() {
        // create simple circle textures for X and O and a UI tile if they don't exist
        if (!this.textures.exists('piece-x')) {
            console.log('Generating placeholder texture: piece-x');
            const gfx = this.add.graphics();
            gfx.fillStyle(0xfdd835, 1);
            gfx.fillCircle(8, 8, 8);
            gfx.lineStyle(2, 0x333333, 1);
            gfx.strokeCircle(8, 8, 8);
            gfx.generateTexture('piece-x', 16, 16);
            gfx.destroy();
        }
        if (!this.textures.exists('piece-o')) {
            console.log('Generating placeholder texture: piece-o');
            const gfx = this.add.graphics();
            gfx.fillStyle(0xd32f2f, 1);
            gfx.fillCircle(8, 8, 8);
            gfx.lineStyle(2, 0x333333, 1);
            gfx.strokeCircle(8, 8, 8);
            gfx.generateTexture('piece-o', 16, 16);
            gfx.destroy();
        }
        if (!this.textures.exists('ui-sprite')) {
            console.log('Generating placeholder texture: ui-sprite');
            const gfx = this.add.graphics();
            gfx.fillStyle(0x333333, 1);
            gfx.fillRect(0, 0, 16, 16);
            gfx.generateTexture('ui-sprite', 16, 16);
            gfx.destroy();
        }
    }
}
