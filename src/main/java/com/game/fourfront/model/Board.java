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
        int[][] directions = {{1,0},{0,1},{1,1},{1,-1}};
        for (int[] d : directions) {
            int count = 1;
            count += countDirection(lastRow, lastCol, d[0], d[1], piece);
            count += countDirection(lastRow, lastCol, -d[0], -d[1], piece);
            if (count >= winCondition) return piece;
        }
        return "no winner";
    }

    private int countDirection(int row, int col, int dRow, int dCol, String piece) {
        int count = 0;
        for (int i = 1; i < winCondition; i++) {
            int r = row + i * dRow;
            int c = col + i * dCol;
            if (r < 0 || r >= height || c < 0 || c >= width) break;
            if (board[r][c].equals(piece)) count++;
            else break;
        }
        return count;
    }

    @Override
    public String toString() {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < height; i++) {
            for (int j = 0; j < width; j++) {
                sb.append(board[i][j]);
            }
        }
        return sb.toString();
    }
}

