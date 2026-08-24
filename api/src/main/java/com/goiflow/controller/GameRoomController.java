package com.goiflow.controller;

import com.goiflow.dto.request.CreateRoomRequest;
import com.goiflow.dto.request.JoinRoomRequest;
import com.goiflow.entity.game.GameParticipantEntity;
import com.goiflow.entity.game.GameSessionEntity;
import com.goiflow.repository.GameSessionRepository;
import com.goiflow.service.GameSessionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/game/rooms")
@RequiredArgsConstructor
public class GameRoomController {

    private final GameSessionService gameSessionService;
    private final GameSessionRepository gameSessionRepository;

    @PostMapping
    public ResponseEntity<?> createRoom(@RequestBody(required = false) CreateRoomRequest req, Authentication auth) {
        if (req == null) req = new CreateRoomRequest();
        String userId = auth != null ? auth.getName() : req.getUserId();
        String hostName = req.getHostDisplayName() != null && !req.getHostDisplayName().isBlank()
                ? req.getHostDisplayName()
                : (req.getDisplayName() != null && !req.getDisplayName().isBlank() ? req.getDisplayName() : "Host");

        GameSessionEntity session = gameSessionService.createRoom(
                userId, hostName, req.getAvatarUrl(), req.getJlptLevel(), req.getTimePerPromptSeconds(), req.getMaxRounds(), req.getIsPrivate()
        );
        return ResponseEntity.ok(session);
    }

    @PostMapping("/join")
    public ResponseEntity<?> joinRoom(@Valid @RequestBody JoinRoomRequest req, Authentication auth) {
        String userId = auth != null ? auth.getName() : req.getUserId();
        String playerName = req.getDisplayName() != null && !req.getDisplayName().isBlank()
                ? req.getDisplayName()
                : "Player";

        GameParticipantEntity participant = gameSessionService.joinRoom(req.getRoomCode(), userId, playerName, req.getAvatarUrl());
        return ResponseEntity.ok(participant);
    }

    @GetMapping("/{roomCode}")
    public ResponseEntity<?> getRoomByCode(@PathVariable String roomCode) {
        GameSessionEntity session = gameSessionRepository.findByRoomCode(roomCode)
                .orElseThrow(() -> new IllegalArgumentException("Room not found"));
        return ResponseEntity.ok(session);
    }
}
