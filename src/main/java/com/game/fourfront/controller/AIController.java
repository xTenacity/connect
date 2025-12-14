package com.game.fourfront.controller;

import com.game.fourfront.model.AIPlayer;
import com.game.fourfront.model.Board;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/api/ai")
public class AIController {
    @PostMapping("/move")
    public Map<String, Object> getAIMove(@RequestBody Map<String, Object> payload) {
        // Expecting: { "board": [["_,...],...], "aiPiece": "X", "aiDepth": 4, "mistakeRate": 0.1, "aiName": "AI" }
        var boardArr = (java.util.List<java.util.List<String>>) payload.get("board");
        String aiPiece = (String) payload.getOrDefault("aiPiece", "X");
        int aiDepth = ((Number) payload.getOrDefault("aiDepth", 4)).intValue();
        double mistakeRate = ((Number) payload.getOrDefault("mistakeRate", 0.1)).doubleValue();
        String aiName = (String) payload.getOrDefault("aiName", "AI");

        Board board = new Board();
        for (int row = 0; row < boardArr.size(); row++) {
            for (int col = 0; col < boardArr.get(row).size(); col++) {
                board.getBoard()[row][col] = boardArr.get(row).get(col);
            }
        }

        AIPlayer ai = new AIPlayer(aiPiece, aiDepth, mistakeRate, aiName);
        int move = ai.chooseMove(board);

        // Get top 3 ranked moves (move+score) for frontend if desired
        List<Map<String, Integer>> ranked = ai.getRankedMoves(board, 3);

        Map<String, Object> resp = new HashMap<>();
        resp.put("move", move);
        resp.put("explanation", ai.getLastExplanation());
        resp.put("rankedMoves", ranked);
        return resp;
    }
}
