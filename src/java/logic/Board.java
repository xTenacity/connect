package logic;

import java.util.ArrayList;
import java.util.Arrays;

public class Board {

    //round 43 is max

    //two rules for creating a board: width must not exceed 9, winCondition must not exceed width AND height

    private String[][] board; //height, width
    private String currentTurn;
    private int winCondition;
    private int turn;
    public int lastX;
    public int lastY;
    private static final int MAX_WIDTH = 9;
    public boolean playing = true;

    public Board(int width, int height, int winCondition) {
        this.board = new String[height][width];
        for (int i = 0; i < height; i++) {
            for (int u = 0; u < width; u++) {
                board[i][u] = "_";
            }
        }
    
        this.turn = 1;
        this.currentTurn = "X";
        this.winCondition = winCondition;
    }

    public Board(Board newBoard) { //alternate constructor for the ai player
        int width = newBoard.getWidth();
        int height = newBoard.getHeight();
        this.board = new String[height][width];

        for (int i = 0; i < height; i++) {
            this.board[i] = Arrays.copyOf(newBoard.board[i], width);
        }

        this.currentTurn = newBoard.currentTurn;
        this.winCondition = newBoard.winCondition;
        this.turn = newBoard.turn;
        this.lastX = newBoard.lastX;
        this.lastY = newBoard.lastY;
    }

    public void drop(int col, String piece, boolean isSimulated) {
        if (col < getWidth() && col >= 0) {
            for (int i = getHeight() - 1; i >= 0; i--) {
                if (board[i][col].equals("_")) {
                    board[i][col] = piece;
                    lastX = col;
                    lastY = i;

                    if (!checkWin(lastX, lastY).equals("no winner") && !isSimulated) {
                        endGame();
                    }

                    if (!isSimulated) {
                        changeTurn();
                        turn++;
                    }
                    break;
                }
            }
        }
    }

    public void endGame() {
        if (currentTurn == "X") console.log("You win!");
        if (currentTurn == "O") console.log("You lose!");
        playing = false;
    }

    public String checkWin(int x, int y) {
        //horizontal
        for (int i = (Math.max(0, x-winCondition+1)); i <= (Math.min(getWidth()-winCondition, x)); i++) {
            String currentVal = board[y][i];
            boolean matches = true;
            for (int u = 1; u < winCondition; u++) {
                String checkedVal = board[y][i+u];
                if (!currentVal.equals(checkedVal)) {
                    matches = false;
                    break;
                }
            }
            if (matches == true && !currentVal.equals("_")) {
                return currentVal;
            }
        }

        //vertical
        for (int i = Math.max(0, y-winCondition+1); i <= Math.min(getHeight()-winCondition, y); i++) {
            String currentVal = board[i][x];
            boolean matches = true;
            for (int u = 1; u < winCondition; u++) {
                String checkedVal = board[i+u][x];
                if (!currentVal.equals(checkedVal)) {
                    matches = false;
                    break;
                }
            }
            if (matches == true && !currentVal.equals("_")) {
                return currentVal;
            }
        }

        //diagonal, up to down left to right
        for (int i = -winCondition + 1; i <= 0; i++) {
            //start at wincondition spaces diagonal to space we're checking
            int startX = x + i; 
            int startY = y + i;
            //check outer bounds (top left, bottom right bounds)
            if (startX < 0 || 
                startY < 0 || 
                startX + winCondition > getWidth() || 
                startY + winCondition > getHeight()) {
                continue; //skip checking it, as it's out of bounds
            }
            
            String currentVal = board[startY][startX];
            boolean matches = true;
            for (int u = 1; u < winCondition; u++) {
                String checkedVal = board[startY + u][startX + u];
                if (!currentVal.equals(checkedVal)) {
                    matches = false;
                    break;
                }
            }
            if (matches == true && !currentVal.equals("_")) {
                return currentVal;
            }
        }

        //anti-diagonal, down to up left to right
        for (int i = -winCondition + 1; i <= 0; i++) {
            //start at wincondition spaces diagonal to space we're checking
            int startX = x + i;
            int startY = y - i;
            //check if within outer bounds
            if (startX < 0 || 
                startY >= getHeight() || 
                startX + winCondition > getWidth() || 
                startY - winCondition + 1 < 0) {
                continue; //out of bounds
            }

            String currentVal = board[startY][startX];
            boolean matches = true;
            for (int u = 1; u < winCondition; u++) {
                String checkedVal = board[startY - u][startX + u];
                if (!currentVal.equals(checkedVal)) {
                    matches = false;
                    break;
                }
            }
            if (matches && !currentVal.equals("_")) {
                return currentVal;
            }
        }

        return "no winner";
    }

    public void changeTurn() {
        currentTurn = (currentTurn.equals("X")) ? "O" : "X";
    }

    public int getWidth() {
        return board[0].length;
    }

    public int getHeight() {
        return board.length;
    }

    public String[][] getBoard() {
        return board;
    }
    
    public String getCurrentTurn() {
        return currentTurn;
    }

    public int getWinCondition() {
        return winCondition;
    }

    public int getTurn() {
        return turn;
    }
    
    public boolean isFull() {
        return turn > getHeight() * getWidth();
    }
    
    public boolean isColumnOpen(int col) {
        return board[0][col].equals("_");
    }

    public String toString() {
        console.cls();
        String result = "VS. " + ConnectFour.opponent + "\n\n";
        for (String[] i : board) {
            result += "| ";
            for (String u : i) {
                result += u + " | ";
            }
            result += "\n";
        }
        result += "\n";
        for (int i = 1; i < getWidth() + 1; i++) {
            result += "  " + i + " ";
        }
        console.log("Turn: " + turn + ", Winner: " + checkWin(lastX, lastY));
        return result;
    }
}