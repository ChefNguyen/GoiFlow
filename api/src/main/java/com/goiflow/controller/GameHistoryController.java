package com.goiflow.controller;

import com.goiflow.service.GameHistoryService;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/game")
@RequiredArgsConstructor
public class GameHistoryController {

    private final GameHistoryService gameHistoryService;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class HistoryQueryRequest {
        private List<String> sessionIds;
        private Integer limit;
    }

    @PostMapping("/history")
    public ResponseEntity<?> getHistory(@RequestBody(required = false) HistoryQueryRequest req, Authentication auth) {
        String userId = auth != null ? auth.getName() : null;
        List<String> sessionIds = req != null ? req.getSessionIds() : null;
        Integer limit = req != null && req.getLimit() != null ? req.getLimit() : 100;
        return ResponseEntity.ok(gameHistoryService.queryHistory(sessionIds, userId, limit));
    }

    @GetMapping("/sessions/{sessionId}/history")
    public ResponseEntity<?> getSessionHistory(@PathVariable String sessionId, Authentication auth) {
        String userId = auth != null ? auth.getName() : null;
        return ResponseEntity.ok(gameHistoryService.queryHistory(List.of(sessionId), userId, 100));
    }
}
