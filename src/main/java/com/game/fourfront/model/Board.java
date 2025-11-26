package com.game.fourfront.model;

public class Board {
    private String[][] board;
    public int lastX = -1;
    public int lastY = -1;
    private int winCondition = 4;
    private int width = 7;
    private int height = 6;

    public Board() {
        board = new String[height][width];
        for (int i = 0; i < height; i++) {
            for (int j = 0; j < width; j++) {
                board[i][j] = "_";
            }
        }
    }

    public Board(Board other) {
        this();
        for (int i = 0; i < height; i++) {
            System.arraycopy(other.board[i], 0, this.board[i], 0, width);
        }
        this.lastX = other.lastX;
        this.lastY = other.lastY;
    }

    public boolean drop(int col, String piece, boolean updateLast) {
        for (int row = height - 1; row >= 0; row--) {
            if (board[row][col].equals("_")) {
                board[row][col] = piece;
                if (updateLast) {
                    lastX = row;
                    lastY = col;
                }
                return true;
            }
        }
        return false;
    }

    public boolean isColumnOpen(int col) {
        return board[0][col].equals("_");
    }

    public int getWidth() {
        return width;
    }

    public int getHeight() {
        return height;
    }

    public String[][] getBoard() {
        return board;
    }

    public boolean isFull() {
        for (int col = 0; col < width; col++) {
            if (isColumnOpen(col)) return false;
        }
        return true;
    }

    public int getWinCondition() {
        return winCondition;
    }

    public String checkWin(int lastRow, int lastCol) {
        if (lastRow == -1 || lastCol == -1) return "no winner";
        String piece = board[lastRow][lastCol];
        if (piece.equals("_")) return "no winner";
        int[][] directions = {
            {1,0}, // vertical
            {0,1}, // horizontal
            {1,1}, // diagonal \
            {1,-1} // diagonal /
        };
        for (int[] d : directions) {
            int count = 1;
            count += countDirection(
                lastRow, // starting row
                lastCol, // starting col
                d[0], // delta row
                d[1], // delta col
                piece
            );
            count += countDirection(
                lastRow, // starting row
                lastCol, // starting col
                -d[0], // delta row
                -d[1], // delta col
                piece
            );
            if (count >= winCondition) return piece;
        }
        return "no winner";
    }

    private int countDirection(int startRow, int startCol, int deltaRow, int deltaCol, String targetPiece) {
        int matchedCount = 0;
        for (int step = 1; step < winCondition; step++) {
            int currentRow = startRow + step * deltaRow;
            int currentCol = startCol + step * deltaCol;
            if ( // Out of bounds
                currentRow < 0 || 
                currentRow >= height || 
                currentCol < 0 || 
                currentCol >= width
            ) break;
            if (board[currentRow][currentCol].equals(targetPiece)) matchedCount++;
            else break;
        }
        return matchedCount;
    }

    @Override
    public String toString() {
        StringBuilder sb = new StringBuilder();
        for (int row = 0; row < height; row++) {
            for (int col = 0; col < width; col++) {
                sb.append("(").append(col).append("/").append(row).append(":").append(board[row][col]).append(")");
                if (col < width - 1) sb.append(" ");
            }
                if (row < height - 1) sb.append("\n");
        }
        return sb.toString();
    }
}

