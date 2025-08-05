package ai;

import org.teavm.interop.*;
import logic.Board;
import logic.AIPlayer;

public class ConnectAI {
    @JSBody(params = { "board", "aiPiece", "depth", "mistake" }, script = "return ConnectAI_getMove(board, aiPiece, depth, mistake);")
    public static native int getMove(String[][] board, String aiPiece, int depth, double mistake);

    @JSExport
    public static int ConnectAI_getMove(String[][] boardData, String aiPiece, int depth, double mistakeRate) {
        Board board = new Board(boardData);
        AIPlayer ai = new AIPlayer(aiPiece, depth, mistakeRate, "Phantom");
        return ai.chooseMove(board);
    }
}