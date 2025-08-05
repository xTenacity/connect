package logic;

import java.util.*;

public class AIPlayer {
    private String aiName;
    private String aiPiece;
    private String playerPiece; 
    private int aiDepth; //how many recursive calls it makes
    private double mistakeRate; // a number from 0 to 1 (x% * 0.1)
    private Random randNum; //random number object

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


        //make a mistake if a random number is less than the mistake rate
        if (randNum.nextDouble() < mistakeRate) {
            return validMoves.get(randNum.nextInt(validMoves.size()));
        }

        int bestMove = -1;
        int bestScore = Integer.MIN_VALUE;

        for (int move : validMoves) {
            Board copy = new Board(board);
            copy.drop(move, aiPiece, true);

            //get the best score possible for the ai
            int score = minimax(copy, aiDepth - 1, false);

            //if a move has a better score, set move to best move
            if (score > bestScore) {
                bestScore = score;
                bestMove = move;
            }
        }
        return bestMove;
    }

    private int minimax(Board board, int aiDepth, boolean maximizing) {
        //check if the last move was a win/loss/tie
        String winner = board.checkWin(board.lastX, board.lastY);

        //evaluate the points if there is a winner, the ai depth hits zero, or tie
        if (!winner.equals("no winner") || aiDepth == 0 || board.isFull()) {
            return evaluatePoints(board, winner, aiDepth);
        }

        //save a "best score" for the ai to only choose the most optimal move
        int bestScore = maximizing ? Integer.MIN_VALUE : Integer.MAX_VALUE;

        //iterate through every valid move
        for (int move : getValidMoves(board)) {
            Board copy = new Board(board);

            //maximizing ai score, minimizing player score
            String pieceToDrop = "";
            if (maximizing) {
                pieceToDrop = aiPiece;
            } else {
                pieceToDrop = playerPiece;
            }

            //make a recursive call to check the score using the copy's boardstate
            copy.drop(move, pieceToDrop, true);
            int score = minimax(copy, aiDepth - 1, !maximizing);

            //chooses most ideal score for ai based on ai or player turn
            if (maximizing) {
                bestScore = Math.max(score, bestScore);
            } else {
                bestScore = Math.min(score, bestScore);
            }
        }

        return bestScore;
    }
    private int evaluatePoints(Board board, String winner, int depthLeft) {
        //check if win; large positive/negative score depending on winner
        if (winner.equals(aiPiece)) return 1000 + depthLeft;
        if (winner.equals(playerPiece)) return -1000 - depthLeft;

        int score = 0;

        // more likely to choose the center (more control)
        int centerCol = board.getWidth() / 2;
        for (int y = 0; y < board.getHeight(); y++) {
            String[][] currentBoard = board.getBoard();
            //if the centermost piece at the y is ai, +5, otherwise -5
            if (currentBoard[y][centerCol].equals(aiPiece)) score += 5;
            else if (currentBoard[y][centerCol].equals(playerPiece)) score -= 5;
        }

        // check all board positions for streaks
        for (int row = 0; row < board.getHeight(); row++) {
            for (int col = 0; col < board.getWidth(); col++) {
                if (board.getBoard()[row][col].equals("_")) continue;

                String current = board.getBoard()[row][col];

                int value;
                if (current.equals(aiPiece)) {
                    value = 1;
                } else {
                    value = -1;
                }

                score += value * countStreak(board, row, col, 1, 0); // Horizontal
                score += value * countStreak(board, row, col, 0, 1); // Vertical
                score += value * countStreak(board, row, col, 1, 1); // Diagonal down-right
                score += value * countStreak(board, row, col, 1, -1); // Diagonal up-right
            }
        }

        return score;
    }

    private int countStreak(Board board, int row, int col, int dRow, int dCol) {
        String piece = board.getBoard()[row][col];
        int streak = 1;
        int openEnds = 0;

        // Forward direction
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

        // Backward direction
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

        if (streak >= board.getWinCondition()) return 100; // already handled earlier, but redundancy ok

        // Heuristic weights
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