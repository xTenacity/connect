import java.util.Scanner;
import logic.Board;
import logic.AIPlayer;
import logic.console;

public class ConnectFour {
    public static String opponent;

    public static void main(String[] args) {
        startGame();
    }

    public static void startGame() {
        Scanner scan = new Scanner(System.in);

        int width = 7;
        int height = 6;
        int winCondition = 4;

        Board board = new Board(width, height, winCondition);
        AIPlayer bob = new AIPlayer("O", 7, 0.05, "Big Johninator");

        opponent = bob.getName();

        System.out.println(board);

        while (board.playing) {
            // Prompt player
            int playerMove = scan.nextInt() - 1;

            // Validate move
            if (playerMove < 0 || playerMove >= board.getWidth() || !board.isColumnOpen(playerMove)) {
                System.out.println("Invalid move. Try again.");
                continue;
            }

            board.drop(playerMove, "X", false);
            System.out.println(board);

            if (!board.playing) {
                console.log("You win!");
                break;
            }

            // AI move
            int aiMove = bob.chooseMove(board);
            board.drop(aiMove, "O", false);
            System.out.println(board);

            if (!board.playing) {
                console.log("You lose!");
                break;
            }
            SwingUtilities.invokeLater(GUI::new);
        }
    }
}