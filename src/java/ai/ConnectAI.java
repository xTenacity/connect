package ai;

public class ConnectAI {
    public static int getMove(int[][] board) {
        for (int col = 0; col < board[0].length; col++) {
            for (int row = board.length - 1; row >= 0; row--) {
                if (board[row][col] == 0) return col;
            }
        }
        return 0; // fallback
    }
}
