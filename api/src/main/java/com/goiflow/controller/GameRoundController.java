package com.goiflow.controller;

import com.goiflow.dto.request.SubmitAnswerRequest;
import com.goiflow.service.ActiveGamePlayService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/game/sessions/{sessionId}")
@RequiredArgsConstructor
public class GameRoundController {

    private final ActiveGamePlayService activeGamePlayService;

    @GetMapping("/rounds")
    public ResponseEntity<?> getActiveRound(@PathVariable String sessionId) {
        return ResponseEntity.ok(activeGamePlayService.getActiveRoundResponse(sessionId));
    }

    @PostMapping("/rounds")
    public ResponseEntity<?> advanceRound(@PathVariable String sessionId, @RequestBody(required = false) Map<String, Object> body) {
        String participantId = body != null && body.get("participantId") != null ? body.get("participantId").toString() : null;
        String action = body != null && body.get("action") != null ? body.get("action").toString() : "skip";
        return ResponseEntity.ok(activeGamePlayService.advanceRoundFast(sessionId, participantId, action));
    }

    @PostMapping("/submit")
    public ResponseEntity<?> submitAnswer(@PathVariable String sessionId, @Valid @RequestBody SubmitAnswerRequest req) {
        return ResponseEntity.ok(activeGamePlayService.submitAnswerFast(sessionId, req));
    }
}
