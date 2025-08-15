package com.game.fourfront.service;

import org.springframework.stereotype.Service;

import com.game.fourfront.model.BoardState;
import com.game.fourfront.model.Move;
import com.game.fourfront.model.MoveResult;

@Service
public class GameService {

    private BoardState board = new BoardState(); // 6x7 grid initialized

    public BoardState getBoard() {
        return board;
    }

    public MoveResult placePiece(Move move, int playerId) {
        MoveResult result = new MoveResult();
        int col = move.column;

        // Find lowest empty row in column
        int row = -1;
        for (int r = board.grid.length - 1; r >= 0; r--) {
            if (board.grid[r][col] == 0) {
                row = r;
                break;
            }
        }

        if (row == -1) {
            result.valid = false; // column full
            return result;
        }

        board.grid[row][col] = playerId;

        if (checkWin(row, col, playerId)) {
            result.win = true;
        }

        return result;
    }

    private boolean checkWin(int row, int col, int playerId) {
        // Check horizontal, vertical, diagonal
        return checkDirection(row, col, 0, 1, playerId)   // horizontal
            || checkDirection(row, col, 1, 0, playerId)   // vertical
            || checkDirection(row, col, 1, 1, playerId)   // diagonal \
            || checkDirection(row, col, 1, -1, playerId); // diagonal /
    }

    private boolean checkDirection(int row, int col, int dr, int dc, int playerId) {
        int count = 1;
        count += countDirection(row, col, dr, dc, playerId);
        count += countDirection(row, col, -dr, -dc, playerId);
        return count >= 4;
    }

    private int countDirection(int row, int col, int dr, int dc, int playerId) {
        int r = row + dr, c = col + dc, count = 0;
        while (r >= 0 && r < 6 && c >= 0 && c < 7 && board.grid[r][c] == playerId) {
            count++;
            r += dr;
            c += dc;
        }
        return count;
    }

    public void resetBoard() {
        board = new BoardState();
    }
}