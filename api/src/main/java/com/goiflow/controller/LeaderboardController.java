package com.goiflow.controller;

import com.goiflow.service.LeaderboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/leaderboard")
@RequiredArgsConstructor
public class LeaderboardController {

    private final LeaderboardService leaderboardService;

    @GetMapping
    public ResponseEntity<?> getLeaderboard() {
        return ResponseEntity.ok(leaderboardService.getGlobalLeaderboard());
    }
}
