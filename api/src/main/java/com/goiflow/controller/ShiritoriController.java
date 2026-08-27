package com.goiflow.controller;

import com.goiflow.dto.request.CreateShiritoriRequest;
import com.goiflow.dto.request.JoinShiritoriRequest;
import com.goiflow.dto.request.SubmitShiritoriWordRequest;
import com.goiflow.service.ShiritoriService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/game/shiritori")
@RequiredArgsConstructor
public class ShiritoriController {

    private final ShiritoriService shiritoriService;

    @PostMapping("/create")
    public ResponseEntity<?> createSession(@RequestBody CreateShiritoriRequest request, Authentication auth) {
        if (auth != null && (request.getUserId() == null || request.getUserId().isBlank())) {
            request.setUserId(auth.getName());
        }
        return ResponseEntity.ok(shiritoriService.createSession(request));
    }

    @PostMapping("/join")
    public ResponseEntity<?> joinSession(@RequestBody JoinShiritoriRequest request, Authentication auth) {
        if (auth != null && (request.getUserId() == null || request.getUserId().isBlank())) {
            request.setUserId(auth.getName());
        }
        return ResponseEntity.ok(shiritoriService.joinSession(request));
    }

    @GetMapping("/{sessionId}")
    public ResponseEntity<?> getSessionState(
            @PathVariable String sessionId,
            @RequestParam(required = false) String participantId
    ) {
        return ResponseEntity.ok(shiritoriService.getSessionState(sessionId, participantId));
    }

    @PostMapping("/{sessionId}/submit")
    public ResponseEntity<?> submitWord(
            @PathVariable String sessionId,
            @RequestBody SubmitShiritoriWordRequest request
    ) {
        return ResponseEntity.ok(shiritoriService.submitWord(sessionId, request));
    }

    @PostMapping("/{sessionId}/restart")
    public ResponseEntity<?> restartSession(
            @PathVariable String sessionId,
            @RequestBody(required = false) Map<String, String> body
    ) {
        String participantId = body != null ? body.get("participantId") : null;
        return ResponseEntity.ok(shiritoriService.restartSession(sessionId, participantId));
    }
}
