// Minimal JS/TS port of the AIPlayer logic you posted. Uses alpha-beta pruning.
export default class AIPlayer {
    constructor(aiPiece = 'O', depth = 4, mistakeRate = 0) {
        this.aiPiece = aiPiece;
        this.playerPiece = aiPiece === 'X' ? 'O' : 'X';
        this.depth = depth;
        this.mistakeRate = mistakeRate;
        this.rand = Math.random;
        this.cache = new Map();
    }
    chooseMove(board) {
        const valid = board.getValidMoves();
        if (!valid || valid.length === 0)
            return -1;
        if (this.rand() < this.mistakeRate) {
            return valid[Math.floor(this.rand() * valid.length)];
        }
        let best = valid[0];
        let bestScore = -Infinity;
        for (const mv of valid) {
            const copy = board.clone();
            copy.drop(mv, this.aiPiece);
            const score = this.minimax(copy, this.depth - 1, -Infinity, Infinity, false);
            if (score > bestScore) {
                bestScore = score;
                best = mv;
            }
        }
        return best;
    }
    boardKey(board, depth, maximizing) {
        // flatten board to a compact string key
        const flat = board.board.map(row => row.join('')).join('|');
        return `${flat}|d${depth}|m${maximizing}`;
    }
    minimax(board, depth, alpha, beta, maximizing) {
        const key = this.boardKey(board, depth, maximizing);
        if (this.cache.has(key))
            return this.cache.get(key);
        const winner = board.checkWin();
        if (winner !== 'no winner' || depth === 0 || board.isFull()) {
            const val = this.evaluate(board, winner, depth);
            this.cache.set(key, val);
            return val;
        }
        if (maximizing) {
            let value = -Infinity;
            for (const mv of board.getValidMoves()) {
                const copy = board.clone();
                copy.drop(mv, this.aiPiece);
                value = Math.max(value, this.minimax(copy, depth - 1, alpha, beta, false));
                alpha = Math.max(alpha, value);
                if (alpha >= beta)
                    break; // beta cut-off
            }
            this.cache.set(key, value);
            return value;
        }
        else {
            let value = Infinity;
            for (const mv of board.getValidMoves()) {
                const copy = board.clone();
                copy.drop(mv, this.playerPiece);
                value = Math.min(value, this.minimax(copy, depth - 1, alpha, beta, true));
                beta = Math.min(beta, value);
                if (beta <= alpha)
                    break; // alpha cut-off
            }
            this.cache.set(key, value);
            return value;
        }
    }
    evaluate(board, winner, depthLeft) {
        if (winner === this.aiPiece)
            return 1000 + depthLeft;
        if (winner === this.playerPiece)
            return -1000 - depthLeft;
        let score = 0;
        // simple heuristic: prefer center columns
        const center = Math.floor(board.width / 2);
        for (let r = 0; r < board.height; r++) {
            if (board.getAt(r, center) === this.aiPiece)
                score += 5;
            if (board.getAt(r, center) === this.playerPiece)
                score -= 5;
        }
        return score;
    }
}
