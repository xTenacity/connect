package com.game.fourfront.controller;

import com.game.fourfront.model.AIPlayer;
import com.game.fourfront.model.Board;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/ai")
public class AIController {
    @PostMapping("/move")
    public Map<String, Integer> getAIMove(@RequestBody Map<String, Object> payload) {
        // Expecting: { "board": [["_",...],...], "aiPiece": "X", "aiDepth": 4, "mistakeRate": 0.1, "aiName": "AI" }
        var boardArr = (java.util.List<java.util.List<String>>) payload.get("board");
        String aiPiece = (String) payload.getOrDefault("aiPiece", "X");
        int aiDepth = ((Number) payload.getOrDefault("aiDepth", 4)).intValue();
        double mistakeRate = ((Number) payload.getOrDefault("mistakeRate", 0.1)).doubleValue();
        String aiName = (String) payload.getOrDefault("aiName", "AI");

        Board board = new Board();
        for (int i = 0; i < boardArr.size(); i++) {
            for (int j = 0; j < boardArr.get(i).size(); j++) {
                board.getBoard()[i][j] = boardArr.get(i).get(j);
            }
        }

        AIPlayer ai = new AIPlayer(aiPiece, aiDepth, mistakeRate, aiName);
        int move = ai.chooseMove(board);
        return Map.of("move", move);
    }
}

