package com.game.fourfront.controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.game.fourfront.model.BoardState;
import com.game.fourfront.model.Move;
import com.game.fourfront.model.MoveResult;

@RestController
@RequestMapping("/api/game")
public class GameController {

    @GetMapping("/state")
    public BoardState getGameState() {
        // return current board
        return new BoardState();
    }

    @PostMapping("/move")
    public MoveResult makeMove(@RequestBody Move move) {
        // process move
        return new MoveResult();
    }
}
