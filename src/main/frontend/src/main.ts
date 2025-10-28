declare var Phaser: any;

const COLS = 7;
const ROWS = 6;
const CELL_SIZE = 80;
const BOARD_OFFSET_X = 80;
const BOARD_OFFSET_Y = 60;

// 2D array for board state
let board: string[][] = Array.from({ length: ROWS }, () => Array(COLS).fill('_'));
let currentPlayer: 'X' | 'O' = 'X';

const config: any = {
    type: Phaser.AUTO,
    width: COLS * CELL_SIZE + BOARD_OFFSET_X * 2,
    height: ROWS * CELL_SIZE + BOARD_OFFSET_Y * 2,
    backgroundColor: '#222',
    parent: 'phaser-game',
    scene: {
        preload,
        create,
        update
    }
};

function drawBoard(scene: any) {
    // Draw board background
    const g = scene.add.graphics();
    g.fillStyle(0x1976d2, 1);
    g.fillRect(BOARD_OFFSET_X, BOARD_OFFSET_Y, COLS * CELL_SIZE, ROWS * CELL_SIZE);
    // Draw cells
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            const cx = BOARD_OFFSET_X + col * CELL_SIZE + CELL_SIZE / 2;
            const cy = BOARD_OFFSET_Y + row * CELL_SIZE + CELL_SIZE / 2;
            g.fillStyle(0xe0e0e0, 1);
            g.fillCircle(cx, cy, CELL_SIZE * 0.4);
        }
    }
}

function drawPieces(scene: any) {
    // Remove old pieces
    (scene.children.list as any[]).filter((obj: any) => obj.name === 'piece').forEach((obj: any) => obj.destroy());
    // Draw pieces
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            if (board[row][col] === '_') continue;
            const cx = BOARD_OFFSET_X + col * CELL_SIZE + CELL_SIZE / 2;
            const cy = BOARD_OFFSET_Y + row * CELL_SIZE + CELL_SIZE / 2;
            const color = board[row][col] === 'X' ? 0xfdd835 : 0xd32f2f; // yellow X, red O
            const piece = scene.add.circle(cx, cy, CELL_SIZE * 0.35, color).setName('piece');
            piece.setStrokeStyle(4, 0x333333);
        }
    }
}

function getRowForCol(col: number): number | null {
    for (let row = ROWS - 1; row >= 0; row--) {
        if (board[row][col] === '_') return row;
    }
    return null;
}

function getRowForColOn(boardState: string[][], col: number): number | null {
    for (let row = ROWS - 1; row >= 0; row--) {
        if (boardState[row][col] === '_') return row;
    }
    return null;
}

function checkWinOn(boardState: string[][], player: string): boolean {
    const directions = [
        { dr: 0, dc: 1 }, // horizontal
        { dr: 1, dc: 0 }, // vertical
        { dr: 1, dc: 1 }, // diag down-right
        { dr: 1, dc: -1 } // diag down-left
    ];
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            if (boardState[r][c] !== player) continue;
            for (const d of directions) {
                let count = 1;
                let rr = r + d.dr;
                let cc = c + d.dc;
                while (rr >= 0 && rr < ROWS && cc >= 0 && cc < COLS && boardState[rr][cc] === player) {
                    count++;
                    if (count >= 4) return true;
                    rr += d.dr;
                    cc += d.dc;
                }
            }
        }
    }
    return false;
}

function isBoardFull(): boolean {
    for (let c = 0; c < COLS; c++) {
        if (board[0][c] === '_') return false;
    }
    return true;
}

function aiChooseCol(): number | null {
    // 1) winning move for O
    for (let c = 0; c < COLS; c++) {
        const temp = board.map(r => r.slice());
        const row = getRowForColOn(temp, c);
        if (row === null) continue;
        temp[row][c] = 'O';
        if (checkWinOn(temp, 'O')) return c;
    }
    // 2) block X winning move
    for (let c = 0; c < COLS; c++) {
        const temp = board.map(r => r.slice());
        const row = getRowForColOn(temp, c);
        if (row === null) continue;
        temp[row][c] = 'X';
        if (checkWinOn(temp, 'X')) return c;
    }
    // 3) prefer center columns
    const preferred = [3, 2, 4, 1, 5, 0, 6];
    for (const c of preferred) {
        if (getRowForCol(c) !== null) return c;
    }
    return null;
}

function aiPlay(scene: any) {
    if (currentPlayer !== 'O') return;
    const col = aiChooseCol();
    if (col === null) return;
    const row = getRowForCol(col);
    if (row === null) return;
    board[row][col] = 'O';
    drawPieces(scene);
    if (checkWinOn(board, 'O')) {
        console.log('AI (O) wins');
        return;
    }
    if (isBoardFull()) {
        console.log('Draw');
        return;
    }
    currentPlayer = 'X';
}

function preload(this: any) {}

function create(this: any) {
    drawBoard(this);
    drawPieces(this);
    // Add input for dropping pieces
    this.input.on('pointerdown', (pointer: any) => {
        if (currentPlayer !== 'X') return; // only allow human when X
        const x = pointer.x - BOARD_OFFSET_X;
        const y = pointer.y - BOARD_OFFSET_Y;
        if (x < 0 || y < 0) return;
        const col = Math.floor(x / CELL_SIZE);
        if (col < 0 || col >= COLS) return;
        const row = getRowForCol(col);
        if (row === null) return;
        board[row][col] = currentPlayer;
        drawPieces(this);
        if (checkWinOn(board, 'X')) {
            console.log('Player (X) wins');
            return;
        }
        if (isBoardFull()) {
            console.log('Draw');
            return;
        }
        currentPlayer = 'O';
        // Small delay so player sees the drop before AI moves
        setTimeout(() => aiPlay(this), 300);
    });
}

function update(this: any, time: number, delta: number) {}

new Phaser.Game(config);
