export class Board {
    width: number;
    height: number;
    winCondition: number;
    board: string[][];

    constructor(width: number = 7, height: number = 6, winCondition: number = 4) {
        this.width = width;
        this.height = height;
        this.winCondition = winCondition;
        this.board = Array.from({ length: height }, () =>
            new Array(width).fill('_')
        );
    }

    clone(): Board {
        const newBoard = new Board(this.width, this.height, this.winCondition);
        for (let r = 0; r < this.height; r++) newBoard.board[r] = this.board[r].slice();
        return newBoard;
    }

    isFull(): boolean {
        for (let col = 0; col < this.width; col++) {
            if (this.board[0][col] === '_') {
                return false;
            }
        }
        return true;
    }

    getValidMoves(): number[] {
        const res: number[] = [];
        for (let col = 0; col < this.width; col++) {
            if (this.board[0][col] === '_') {
                res.push(col);
            }
        }
        return res;
    }

    drop(col: number, piece: string): void {
        for (let row = this.height - 1; row >= 0; row--) {
            if (this.board[row][col] === '_') {
                this.board[row][col] = piece;
                break;
            }
        }
    }

    getAt(row: number, col: number): string {
        return this.board[row][col];
    }

    // Returns 'X' or 'O' or 'no winner'
    checkWin(): string {
        // Local aliases for readability
        const board = this.board;
        const rows = this.height;
        const cols = this.width;
        const winCon = this.winCondition;

        // check if piece is in bounds
        const inBounds = (row: number, col: number) => {
            return (
                row >= 0 && //above bottom
                row < rows && //below top
                col >= 0 && //left of right
                col < cols //right of left
            );
        };

        // check for streak in a direction starting at (row, col)
        function checkDirection(row: number, col: number, deltaRow: number, deltaCol: number): boolean {
            const startPiece = board[row][col];
            
            if (startPiece === '_') return false; // empty cell can't form a win
            for (let step = 1; step < winCon; step++) {
                const newRow = row + deltaRow * step;
                const newCol = col + deltaCol * step;
                if (
                    !inBounds(newRow, newCol) || //check if it's out of bounds
                    board[newRow][newCol] !== startPiece //or if it's not the same as the starting piece
                ) {
                    return false;
                }
            }
            return true;
        }

        // check for win
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                if (board[row][col] === '_') continue;
                if (
                    checkDirection(row, col, 0, 1) ||   // horizontal
                    checkDirection(row, col, 1, 0) ||   // vertical
                    checkDirection(row, col, 1, 1) ||   // diagonal down
                    checkDirection(row, col, -1, 1)     // diagonal up
                ) {
                    return board[row][col];
                }
            }
        }

        // no winner
        return 'no winner';
    }
}

