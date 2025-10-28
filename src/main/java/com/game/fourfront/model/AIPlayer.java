package com.game.fourfront.model;

import java.util.*;

public class AIPlayer {
    private String aiName;
    private String aiPiece;
    private String playerPiece;
    private int aiDepth;
    private double mistakeRate;
    private Random randNum;
    private Map<String, Integer> cache = new HashMap<>();

    public AIPlayer(String aiPiece, int aiDepth, double mistakeRate, String aiName) {
        this.aiPiece = aiPiece;
        this.playerPiece = aiPiece.equals("X") ? "O" : "X";
        this.aiDepth = aiDepth;
        this.mistakeRate = mistakeRate;
        this.aiName = aiName;
        this.randNum = new Random();
    }

    public int chooseMove(Board board) {
        List<Integer> validMoves = getValidMoves(board);
        if (randNum.nextDouble() < mistakeRate) {
            return validMoves.get(randNum.nextInt(validMoves.size()));
        }
        int bestMove = -1;
        int bestScore = Integer.MIN_VALUE;
        int alpha = Integer.MIN_VALUE;
        int beta = Integer.MAX_VALUE;
        for (int move : validMoves) {
            Board copy = new Board(board);
            copy.drop(move, aiPiece, true);
            int score = minimaxAlphaBeta(copy, aiDepth - 1, false, alpha, beta);
            if (score > bestScore) {
                bestScore = score;
                bestMove = move;
            }
            alpha = Math.max(alpha, bestScore);
        }
        return bestMove;
    }

    private int minimaxAlphaBeta(Board board, int aiDepth, boolean maximizing, int alpha, int beta) {
        String boardKey = board.toString() + aiDepth + maximizing;
        if (cache.containsKey(boardKey)) {
            return cache.get(boardKey);
        }
        String winner = board.checkWin(board.lastX, board.lastY);
        if (!winner.equals("no winner") || aiDepth == 0 || board.isFull()) {
            int eval = evaluatePoints(board, winner, aiDepth);
            cache.put(boardKey, eval);
            return eval;
        }
        int bestScore = maximizing ? Integer.MIN_VALUE : Integer.MAX_VALUE;
        for (int move : getValidMoves(board)) {
            Board copy = new Board(board);
            String pieceToDrop = maximizing ? aiPiece : playerPiece;
            copy.drop(move, pieceToDrop, true);
            int score = minimaxAlphaBeta(copy, aiDepth - 1, !maximizing, alpha, beta);
            if (maximizing) {
                bestScore = Math.max(score, bestScore);
                alpha = Math.max(alpha, bestScore);
            } else {
                bestScore = Math.min(score, bestScore);
                beta = Math.min(beta, bestScore);
            }
            if (beta <= alpha) {
                break; // Alpha-beta pruning
            }
        }
        cache.put(boardKey, bestScore);
        return bestScore;
    }

    private int evaluatePoints(Board board, String winner, int depthLeft) {
        if (winner.equals(aiPiece)) return 1000 + depthLeft;
        if (winner.equals(playerPiece)) return -1000 - depthLeft;
        int score = 0;
        int centerCol = board.getWidth() / 2;
        for (int y = 0; y < board.getHeight(); y++) {
            String[][] currentBoard = board.getBoard();
            if (currentBoard[y][centerCol].equals(aiPiece)) score += 5;
            else if (currentBoard[y][centerCol].equals(playerPiece)) score -= 5;
        }
        for (int row = 0; row < board.getHeight(); row++) {
            for (int col = 0; col < board.getWidth(); col++) {
                if (board.getBoard()[row][col].equals("_")) continue;
                String current = board.getBoard()[row][col];
                int value = current.equals(aiPiece) ? 1 : -1;
                score += value * countStreak(board, row, col, 1, 0);
                score += value * countStreak(board, row, col, 0, 1);
                score += value * countStreak(board, row, col, 1, 1);
                score += value * countStreak(board, row, col, 1, -1);
            }
        }
        return score;
    }

    private int countStreak(Board board, int row, int col, int dRow, int dCol) {
        String piece = board.getBoard()[row][col];
        int streak = 1;
        int openEnds = 0;
        for (int i = 1; i < board.getWinCondition(); i++) {
            int r = row + i * dRow;
            int c = col + i * dCol;
            if (r < 0 || r >= board.getHeight() || c < 0 || c >= board.getWidth()) break;
            if (board.getBoard()[r][c].equals(piece)) {
                streak++;
            } else if (board.getBoard()[r][c].equals("_")) {
                openEnds++;
                break;
            } else break;
        }
        for (int i = 1; i < board.getWinCondition(); i++) {
            int r = row - i * dRow;
            int c = col - i * dCol;
            if (r < 0 || r >= board.getHeight() || c < 0 || c >= board.getWidth()) break;
            if (board.getBoard()[r][c].equals(piece)) {
                streak++;
            } else if (board.getBoard()[r][c].equals("_")) {
                openEnds++;
                break;
            } else break;
        }
        if (streak >= board.getWinCondition()) return 100;
        if (streak == 3 && openEnds > 0) return 50;
        if (streak == 2 && openEnds > 0) return 10;
        if (streak == 1 && openEnds > 0) return 1;
        return 0;
    }

    private List<Integer> getValidMoves(Board board) {
        List<Integer> validMoves = new ArrayList<>();
        for (int i = 0; i < board.getWidth(); i++) {
            if (board.isColumnOpen(i)) {
                validMoves.add(i);
            }
        }
        return validMoves;
    }

    public String getName() {
        return aiName;
    }
}
