export class Board {
    width: number;
    height: number;
    winCondition: number;
    board: string[][];

    constructor(width = 7, height = 6, winCondition = 4) {
        this.width = width;
        this.height = height;
        this.winCondition = winCondition;
        this.board = Array.from({ length: height }, () => Array(width).fill('_'));
    }

    clone(): Board {
        const b = new Board(this.width, this.height, this.winCondition);
        for (let r = 0; r < this.height; r++) b.board[r] = this.board[r].slice();
        return b;
    }

    isFull() {
        for (let c = 0; c < this.width; c++) if (this.board[0][c] === '_') return false;
        return true;
    }

    getValidMoves() {
        const res: number[] = [];
        for (let c = 0; c < this.width; c++) if (this.board[0][c] === '_') res.push(c);
        return res;
    }

    drop(col: number, piece: string) {
        for (let r = this.height - 1; r >= 0; r--) {
            if (this.board[r][col] === '_') {
                this.board[r][col] = piece;
                break;
            }
        }
    }

    getAt(row: number, col: number) {
        return this.board[row][col];
    }

    // simplified check that returns 'X' or 'O' or 'no winner'
    checkWin(): string {
        const b = this.board;
        const h = this.height;
        const w = this.width;
        const k = this.winCondition;
        for (let r = 0; r < h; r++) {
            for (let c = 0; c < w; c++) {
                const p = b[r][c];
                if (p === '_') continue;
                // horiz
                let ok = true;
                for (let i = 0; i < k; i++) {
                    if (c + i >= w || b[r][c + i] !== p) { ok = false; break; }
                }
                if (ok) return p;
                // vert
                ok = true;
                for (let i = 0; i < k; i++) {
                    if (r + i >= h || b[r + i][c] !== p) { ok = false; break; }
                }
                if (ok) return p;
                // diag down-right
                ok = true;
                for (let i = 0; i < k; i++) {
                    if (r + i >= h || c + i >= w || b[r + i][c + i] !== p) { ok = false; break; }
                }
                if (ok) return p;
                // diag up-right
                ok = true;
                for (let i = 0; i < k; i++) {
                    if (r - i < 0 || c + i >= w || b[r - i][c + i] !== p) { ok = false; break; }
                }
                if (ok) return p;
            }
        }
        return 'no winner';
    }
}

