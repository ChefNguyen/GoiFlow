package com.goiflow.controller;

import com.goiflow.service.GameResultsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/game/sessions/{sessionId}/results")
@RequiredArgsConstructor
public class GameResultController {

    private final GameResultsService gameResultsService;

    @GetMapping
    public ResponseEntity<?> getResults(@PathVariable String sessionId) {
        return ResponseEntity.ok(gameResultsService.getResultsForSession(sessionId));
    }

    @PostMapping
    public ResponseEntity<?> computeResults(@PathVariable String sessionId) {
        return ResponseEntity.ok(gameResultsService.computeAndPersistResults(sessionId));
    }
}
