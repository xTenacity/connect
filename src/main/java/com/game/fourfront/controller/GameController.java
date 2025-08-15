package com.game.fourfront.controller;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;


@RestController
@RequestMapping("/api/game")
public class GameController {

    @GetMapping("/state")
    public BoardState getGameState() {
        // return current board
    }

    @PostMapping("/move")
    public MoveResult makeMove(@RequestBody Move move) {
        // process move
    }
}
