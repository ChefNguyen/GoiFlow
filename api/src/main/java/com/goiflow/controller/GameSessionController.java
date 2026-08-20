package com.goiflow.controller;

import com.goiflow.entity.game.GameSessionEntity;
import com.goiflow.repository.GameSessionRepository;
import com.goiflow.service.GameSessionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/game/sessions")
@RequiredArgsConstructor
public class GameSessionController {

    private final GameSessionRepository gameSessionRepository;
    private final GameSessionService gameSessionService;

    @GetMapping("/{id}")
    public ResponseEntity<?> getSession(@PathVariable String id) {
        GameSessionEntity session = gameSessionRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Session not found"));
        return ResponseEntity.ok(session);
    }

    @PostMapping("/{id}/start")
    public ResponseEntity<?> startSession(@PathVariable String id) {
        GameSessionEntity session = gameSessionService.startSession(id);
        return ResponseEntity.ok(session);
    }

    @PostMapping("/{id}/restart")
    public ResponseEntity<?> restartSession(@PathVariable String id) {
        GameSessionEntity session = gameSessionService.restartSession(id);
        return ResponseEntity.ok(session);
    }
}
