package com.game.fourfront.model;

import java.util.*;
import java.util.stream.Collectors;

public class AIPlayer {
    private String aiName;
    private String aiPiece;
    private String playerPiece;
    private int aiDepth;
    private double mistakeRate;
    private Random randNum;
    private Map<String, Integer> cache = new HashMap<>();

    // new: last explanation and debug flag
    private String lastExplanation = "";
    private boolean debug = false;

    public AIPlayer(String aiPiece, int aiDepth, double mistakeRate, String aiName) {
        this.aiPiece = aiPiece;
        this.playerPiece = aiPiece.equals("X") ? "O" : "X";
        this.aiDepth = aiDepth;
        this.mistakeRate = mistakeRate;
        this.aiName = aiName;
        this.randNum = new Random();
    }

    // Backwards-compatible chooseMove: returns int but also records explanation in lastExplanation
    public int chooseMove(Board board) {
        MoveDecision dec = chooseMoveDecision(board);
        this.lastExplanation = dec.explanation;
        if (debug && lastExplanation != null) System.out.println("AI explanation: " + lastExplanation);
        return dec.move;
    }

    // New: allow retrieval of last explanation
    public String getLastExplanation() {
        return lastExplanation;
    }

    public void setDebug(boolean debug) {
        this.debug = debug;
    }

    // MoveDecision is an internal helper to carry explanation
    private static class MoveDecision {
        int move;
        String explanation;
        MoveDecision(int move, String explanation) { this.move = move; this.explanation = explanation; }
    }

    // New: core decision method using softmax sampling when making a mistake
    private MoveDecision chooseMoveDecision(Board board) {
        List<Integer> validMoves = getValidMoves(board);

        if (validMoves.isEmpty()) return new MoveDecision(-1, "No valid moves available");

        class MoveScore { int move; int score; MoveScore(int m, int s) { move = m; score = s; } }
        List<MoveScore> scoredMoves = new ArrayList<>();

        int alpha = Integer.MIN_VALUE;
        int beta = Integer.MAX_VALUE;

        for (int move : validMoves) {
            Board copy = new Board(board);
            copy.drop(move, aiPiece, true);
            int score = minimaxAlphaBeta(copy, aiDepth - 1, false, alpha, beta);
            scoredMoves.add(new MoveScore(move, score));
            alpha = Math.max(alpha, score);
        }

        // Sort descending (best first)
        scoredMoves.sort((a, b) -> Integer.compare(b.score, a.score));

        double accuracy = 1.0 - Math.max(0.0, Math.min(1.0, mistakeRate));
        double roll = randNum.nextDouble();

        // If roll within accuracy, choose the best deterministically
        if (roll < accuracy || scoredMoves.size() == 1) {
            String expl = buildExplanation(scoredMoves, roll, accuracy, 0.0, 0.0, 0, 0.0, "chose best (within accuracy)");
            return new MoveDecision(scoredMoves.get(0).move, expl);
        }

        // Compute severity in (0..1]
        double severity = (roll - accuracy) / (1.0 - accuracy);
        if (severity < 0) severity = 0.0;
        if (severity > 1) severity = 1.0;

        int availableBadCount = scoredMoves.size() - 1;
        if (availableBadCount <= 0) {
            String expl = buildExplanation(scoredMoves, roll, accuracy, severity, 1.0, 0, 0.0, "no alternatives");
            return new MoveDecision(scoredMoves.get(0).move, expl);
        }

        // Softmax weighted sampling: temperature T increases with severity -> more random
        double maxTemperature = 12.0; // tunable: higher = more uniform
        double temperature = 1.0 + severity * (maxTemperature - 1.0); // T in [1, maxTemperature]

        // Build weights using stable softmax: weight_i = exp((score - maxScore) / T)
        double maxScore = scoredMoves.stream().mapToDouble(ms -> ms.score).max().orElse(0.0);
        double[] weights = new double[scoredMoves.size()];
        double weightSum = 0.0;
        for (int i = 0; i < scoredMoves.size(); i++) {
            double z = (scoredMoves.get(i).score - maxScore) / temperature;
            double w = Math.exp(z);
            weights[i] = w;
            weightSum += w;
        }

        // Sample index by weights
        double pick = randNum.nextDouble() * weightSum;
        double acc = 0.0;
        int pickedIndex = 0;
        for (int i = 0; i < weights.length; i++) {
            acc += weights[i];
            if (pick <= acc) { pickedIndex = i; break; }
        }

        int chosenMove = scoredMoves.get(pickedIndex).move;

        // Build explanation detailing top scores, roll, severity, temperature, and why
        String expl = buildExplanation(scoredMoves, roll, accuracy, severity, temperature, pickedIndex, weightSum,
                String.format("softmax sampling (T=%.2f) => picked rank %d", temperature, pickedIndex + 1));

        return new MoveDecision(chosenMove, expl);
    }

    // Helper to build human-readable explanation
    private String buildExplanation(List<?> scoredMovesRaw, double roll, double accuracy, double severity, double temperature, int pickedIndex, double weightSum, String reason) {
        // Convert scoredMovesRaw (MoveScore) to readable string
        @SuppressWarnings("unchecked")
        List<Object> tmp = (List<Object>) scoredMovesRaw;
        String movesStr = tmp.stream().map(o -> {
            try {
                java.lang.reflect.Field mv = o.getClass().getDeclaredField("move");
                java.lang.reflect.Field sc = o.getClass().getDeclaredField("score");
                mv.setAccessible(true);
                sc.setAccessible(true);
                int m = mv.getInt(o);
                int s = sc.getInt(o);
                return String.format("%d(%d)", m, s);
            } catch (Exception e) {
                return o.toString();
            }
        }).collect(Collectors.joining(", "));

        String pickRankText = (pickedIndex >= 0) ? String.format("%d", pickedIndex + 1) : "?";

        StringBuilder sb = new StringBuilder();
        sb.append("roll=").append(String.format("%.4f", roll));
        sb.append(" accuracy=").append(String.format("%.4f", accuracy));
        sb.append(" severity=").append(String.format("%.4f", severity));
        if (temperature > 0) sb.append(" temperature=").append(String.format("%.4f", temperature));
        sb.append(" chosenRank=").append(pickRankText);
        sb.append(" weightsSum=").append(String.format("%.4f", weightSum));
        sb.append(" moves=[").append(movesStr).append("]");
        sb.append(" reason=").append(reason);
        return sb.toString();
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

    // New public helper: returns ranked moves (move + score) sorted desc, up to 'count' entries
    public List<Map<String, Integer>> getRankedMoves(Board board, int count) {
        List<Integer> validMoves = getValidMoves(board);
        class MS { int m; int s; MS(int m, int s){ this.m = m; this.s = s; } }
        List<MS> list = new ArrayList<>();
        int alpha = Integer.MIN_VALUE;
        int beta = Integer.MAX_VALUE;
        for (int move : validMoves) {
            Board copy = new Board(board);
            copy.drop(move, aiPiece, true);
            int score = minimaxAlphaBeta(copy, aiDepth - 1, false, alpha, beta);
            list.add(new MS(move, score));
            alpha = Math.max(alpha, score);
        }
        list.sort((a,b) -> Integer.compare(b.s, a.s));
        List<Map<String,Integer>> out = new ArrayList<>();
        int limit = Math.max(0, Math.min(count, list.size()));
        for (int i = 0; i < limit; i++) {
            Map<String,Integer> m = new HashMap<>();
            m.put("move", list.get(i).m);
            m.put("score", list.get(i).s);
            out.add(m);
        }
        return out;
    }

    public String getName() {
        return aiName;
    }
}
