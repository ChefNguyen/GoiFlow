package com.goiflow.controller;

import com.goiflow.entity.auth.UserEntity;
import com.goiflow.entity.game.GameParticipantEntity;
import com.goiflow.entity.game.GameRoundEntity;
import com.goiflow.entity.game.GameSessionEntity;
import com.goiflow.entity.game.GameSubmissionEntity;
import com.goiflow.repository.*;
import com.goiflow.service.GameHistoryService;
import com.goiflow.service.GameSessionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/game/sessions")
@RequiredArgsConstructor
public class GameSessionController {

    private final GameSessionRepository gameSessionRepository;
    private final GameSessionService gameSessionService;
    private final GameParticipantRepository gameParticipantRepository;
    private final GameRoundRepository gameRoundRepository;
    private final GameSubmissionRepository gameSubmissionRepository;
    private final UserRepository userRepository;
    private final GameHistoryService gameHistoryService;

    @GetMapping("/{id}")
    public ResponseEntity<?> getSession(
            @PathVariable String id,
            @RequestParam(required = false) String participantId,
            @RequestParam(required = false) String userId,
            Authentication auth
    ) {
        GameSessionEntity session = gameSessionRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Session not found"));

        List<GameParticipantEntity> participants = gameParticipantRepository.findByGameSessionId(id);
        List<GameRoundEntity> rounds = gameRoundRepository.findByGameSessionIdOrderByRoundNumberAsc(id);

        // Batch fetch user avatars
        Set<String> userIds = participants.stream()
                .map(GameParticipantEntity::getUserId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        Map<String, UserEntity> userMap = userIds.isEmpty() ? Collections.emptyMap() :
                userRepository.findAllById(userIds).stream()
                        .collect(Collectors.toMap(UserEntity::getId, u -> u, (a, b) -> a));

        // Compute live standings per participant
        Map<String, Integer> scoreMap = new HashMap<>();
        Map<String, Integer> correctMap = new HashMap<>();
        for (GameParticipantEntity p : participants) {
            scoreMap.put(p.getId(), 0);
            correctMap.put(p.getId(), 0);
        }

        if (!rounds.isEmpty()) {
            List<String> roundIds = rounds.stream().map(GameRoundEntity::getId).toList();
            List<GameSubmissionEntity> allSubs = gameSubmissionRepository.findByGameRoundIdIn(roundIds);
            for (GameSubmissionEntity sub : allSubs) {
                if (Boolean.TRUE.equals(sub.getIsCorrect()) && sub.getParticipantId() != null) {
                    scoreMap.merge(sub.getParticipantId(), sub.getScoreAwarded() != null ? sub.getScoreAwarded() : 1, Integer::sum);
                    correctMap.merge(sub.getParticipantId(), 1, Integer::sum);
                }
            }
        }

        // Resolve currentParticipantId for the requesting user
        String requestingUserId = auth != null ? auth.getName() : (userId != null && !userId.isBlank() ? userId : null);
        String currentParticipantId = participantId != null && !participantId.isBlank() ? participantId : null;
        if (currentParticipantId == null && requestingUserId != null) {
            currentParticipantId = participants.stream()
                    .filter(p -> requestingUserId.equals(p.getUserId()))
                    .map(GameParticipantEntity::getId)
                    .findFirst()
                    .orElse(null);
        }

        // Build standings sorted by score desc
        List<Map<String, Object>> standings = new ArrayList<>();
        participants.stream()
                .sorted((a, b) -> Integer.compare(
                        scoreMap.getOrDefault(b.getId(), 0),
                        scoreMap.getOrDefault(a.getId(), 0)))
                .forEach(p -> {
                    Map<String, Object> entry = new LinkedHashMap<>();
                    entry.put("participantId", p.getId());
                    entry.put("displayName", p.getDisplayName());
                    entry.put("userId", p.getUserId());
                    String avatarUrl = null;
                    if (p.getUserId() != null) {
                        UserEntity u = userMap.get(p.getUserId());
                        if (u != null) avatarUrl = u.getImage();
                    }
                    entry.put("avatarUrl", avatarUrl);
                    entry.put("totalScore", scoreMap.getOrDefault(p.getId(), 0));
                    entry.put("correctCount", correctMap.getOrDefault(p.getId(), 0));
                    standings.add(entry);
                });

        for (int i = 0; i < standings.size(); i++) {
            standings.get(i).put("rank", i + 1);
        }

        // Build participants list
        List<Map<String, Object>> participantList = participants.stream().map(p -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", p.getId());
            m.put("displayName", p.getDisplayName());
            m.put("role", p.getRole());
            m.put("userId", p.getUserId());
            String avatarUrl = null;
            if (p.getUserId() != null) {
                UserEntity u = userMap.get(p.getUserId());
                if (u != null) avatarUrl = u.getImage();
            }
            m.put("avatarUrl", avatarUrl);
            return m;
        }).toList();

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("id", session.getId());
        response.put("roomCode", session.getRoomCode());
        response.put("status", session.getStatus().name());
        response.put("gameMode", session.getGameMode().name());
        response.put("jlptLevel", session.getJlptLevel().name());
        response.put("maxRounds", session.getMaxRounds());
        response.put("currentRoundNumber", session.getCurrentRoundNumber());
        response.put("timePerPromptSeconds", session.getTimePerPromptSeconds());
        response.put("isPrivate", session.getIsPrivate());
        response.put("hostParticipantId", session.getHostParticipantId());
        response.put("currentParticipantId", currentParticipantId);
        response.put("isHost", currentParticipantId != null && currentParticipantId.equals(session.getHostParticipantId()));
        response.put("participants", participantList);
        response.put("standings", standings);

        // Include global synchronized room history (up to 50 items for multiplayer scalability)
        Map<String, Object> historyQuery = gameHistoryService.queryHistory(List.of(id), null, 50);
        response.put("history", historyQuery.get("history"));

        response.put("startedAt", session.getStartedAt());
        response.put("finishedAt", session.getFinishedAt());

        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/start")
    public ResponseEntity<?> startSession(@PathVariable String id) {
        GameSessionEntity session = gameSessionService.startSession(id);
        return ResponseEntity.ok(session);
    }

    @PostMapping("/{id}/leave")
    public ResponseEntity<?> leaveSession(
            @PathVariable String id,
            @RequestBody(required = false) Map<String, Object> body,
            @RequestParam(required = false) String participantId
    ) {
        String effectivePid = participantId;
        if (effectivePid == null && body != null && body.get("participantId") != null) {
            effectivePid = body.get("participantId").toString();
        }
        if (effectivePid != null && !effectivePid.isBlank()) {
            gameSessionService.leaveSession(id, effectivePid);
        }
        return ResponseEntity.ok(Map.of("message", "Left session successfully"));
    }

    @PostMapping("/{id}/restart")
    public ResponseEntity<?> restartSession(@PathVariable String id) {
        GameSessionEntity session = gameSessionService.restartSession(id);
        return ResponseEntity.ok(session);
    }
}
