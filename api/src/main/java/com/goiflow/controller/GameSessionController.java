package com.goiflow.controller;

import com.goiflow.entity.auth.UserEntity;
import com.goiflow.entity.game.GameParticipantEntity;
import com.goiflow.entity.game.GameResultEntity;
import com.goiflow.entity.game.GameRoundEntity;
import com.goiflow.entity.game.GameSessionEntity;
import com.goiflow.entity.game.GameSubmissionEntity;
import com.goiflow.repository.*;
import com.goiflow.service.ActiveGamePlayService;
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
    private final GameResultRepository gameResultRepository;
    private final UserRepository userRepository;
    private final GameHistoryService gameHistoryService;
    private final ActiveGamePlayService activeGamePlayService;

    @GetMapping("/{id}")
    public ResponseEntity<?> getSession(
            @PathVariable String id,
            @RequestParam(required = false) String participantId,
            @RequestParam(required = false) String userId,
            Authentication auth
    ) {
        GameSessionEntity session = gameSessionRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Session not found"));

        List<GameParticipantEntity> allParticipants = gameParticipantRepository.findByGameSessionId(id);
        List<GameRoundEntity> rounds = gameRoundRepository.findByGameSessionIdOrderByRoundNumberAsc(id);

        // Resolve currentParticipantId for the requesting user
        String requestingUserId = auth != null ? auth.getName() : (userId != null && !userId.isBlank() ? userId : null);
        String currentParticipantId = participantId != null && !participantId.isBlank() ? participantId : null;
        if (currentParticipantId == null && requestingUserId != null) {
            currentParticipantId = allParticipants.stream()
                    .filter(p -> requestingUserId.equals(p.getUserId()))
                    .map(GameParticipantEntity::getId)
                    .findFirst()
                    .orElse(null);
        }

        // When a participant enters/polls the live match, re-admit them into the active panel
        if (currentParticipantId != null && session.getStatus() == com.goiflow.enums.GameSessionStatus.IN_PROGRESS) {
            for (GameParticipantEntity p : allParticipants) {
                if (p.getId().equals(currentParticipantId) && p.getLeftAt() != null) {
                    p.setLeftAt(null);
                    gameParticipantRepository.save(p);
                    // Ensure submissions/results from their previous play in this session are cleared so their score starts at 0
                    List<GameSubmissionEntity> oldSubs = gameSubmissionRepository.findByParticipantId(p.getId());
                    if (!oldSubs.isEmpty()) {
                        gameSubmissionRepository.deleteAll(oldSubs);
                    }
                    Optional<GameResultEntity> oldRes = gameResultRepository.findByGameSessionIdAndParticipantId(id, p.getId());
                    oldRes.ifPresent(gameResultRepository::delete);
                    break;
                }
            }
        }

        // Filter active participants for the live match (strictly participants who are currently in the room)
        List<GameParticipantEntity> activeParticipants = (session.getStatus() == com.goiflow.enums.GameSessionStatus.IN_PROGRESS)
                ? allParticipants.stream()
                        .filter(p -> p.getLeftAt() == null)
                        .toList()
                : allParticipants;

        // Batch fetch user avatars
        Set<String> userIds = allParticipants.stream()
                .map(GameParticipantEntity::getUserId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        Map<String, UserEntity> userMap = userIds.isEmpty() ? Collections.emptyMap() :
                userRepository.findAllById(userIds).stream()
                        .collect(Collectors.toMap(UserEntity::getId, u -> u, (a, b) -> a));

        // Compute live cumulative standings per participant across all submissions
        Map<String, Integer> scoreMap = new HashMap<>();
        Map<String, Integer> correctMap = new HashMap<>();
        for (GameParticipantEntity p : allParticipants) {
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

        ActiveGamePlayService.ActiveGameState activeState = activeGamePlayService.getActiveGameState(id);
        if (activeState != null) {
            activeState.getParticipantScores().forEach((pid, s) -> scoreMap.merge(pid, s, Math::max));
            activeState.getParticipantCorrectCounts().forEach((pid, c) -> correctMap.merge(pid, c, Math::max));
        }

        // Build standings sorted by score desc for active participants
        List<Map<String, Object>> standings = new ArrayList<>();
        activeParticipants.stream()
                .sorted((a, b) -> {
                    int scoreCmp = Integer.compare(scoreMap.getOrDefault(b.getId(), 0), scoreMap.getOrDefault(a.getId(), 0));
                    if (scoreCmp != 0) return scoreCmp;
                    return Integer.compare(correctMap.getOrDefault(b.getId(), 0), correctMap.getOrDefault(a.getId(), 0));
                })
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

        int currentRank = 1;
        for (int i = 0; i < standings.size(); i++) {
            if (i > 0) {
                int prevScore = (int) standings.get(i - 1).get("totalScore");
                int currScore = (int) standings.get(i).get("totalScore");
                int prevCorrect = (int) standings.get(i - 1).get("correctCount");
                int currCorrect = (int) standings.get(i).get("correctCount");
                if (prevScore != currScore || prevCorrect != currCorrect) {
                    currentRank = i + 1;
                }
            }
            standings.get(i).put("rank", currentRank);
        }

        // Build active participants list
        List<Map<String, Object>> participantList = activeParticipants.stream().map(p -> {
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

        int effectiveRoundNumber = activeState != null && activeState.getCurrentRoundNumber() != null
                ? activeState.getCurrentRoundNumber()
                : (session.getCurrentRoundNumber() != null ? session.getCurrentRoundNumber() : 1);
        String effectiveStatus = activeState != null && activeState.getStatus() != null
                ? activeState.getStatus().name()
                : session.getStatus().name();

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("id", session.getId());
        response.put("roomCode", session.getRoomCode());
        response.put("status", effectiveStatus);
        response.put("gameMode", session.getGameMode().name());
        response.put("jlptLevel", session.getJlptLevel().name());
        response.put("maxRounds", session.getMaxRounds());
        response.put("currentRoundNumber", effectiveRoundNumber);
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
    public ResponseEntity<?> restartSession(
            @PathVariable String id,
            @RequestBody(required = false) Map<String, Object> body,
            @RequestParam(required = false) String participantId
    ) {
        String effectivePid = participantId;
        if (effectivePid == null && body != null && body.get("participantId") != null) {
            effectivePid = body.get("participantId").toString();
        }
        activeGamePlayService.resetSessionState(id);
        GameSessionEntity session = gameSessionService.restartSession(id, effectivePid);
        return ResponseEntity.ok(session);
    }
}
