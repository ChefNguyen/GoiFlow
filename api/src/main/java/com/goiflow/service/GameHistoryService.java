package com.goiflow.service;

import com.goiflow.entity.content.VocabularyEntryEntity;
import com.goiflow.entity.game.GameParticipantEntity;
import com.goiflow.entity.game.GameRoundEntity;
import com.goiflow.entity.game.GameSessionEntity;
import com.goiflow.entity.game.GameSubmissionEntity;
import com.goiflow.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class GameHistoryService {

    private final GameSessionRepository gameSessionRepository;
    private final GameRoundRepository gameRoundRepository;
    private final GameSubmissionRepository gameSubmissionRepository;
    private final GameParticipantRepository gameParticipantRepository;
    private final VocabularyEntryRepository vocabularyEntryRepository;
    private final UserRepository userRepository;
    private final ContentSelectionService contentSelectionService;
    private final ShiritoriService shiritoriService;

    @Transactional(readOnly = true)
    public Map<String, Object> queryHistory(List<String> sessionIds, String userId, Integer limit) {
        int maxLimit = (limit != null && limit > 0) ? limit : 50;
        Set<String> effectiveSessionIds = new LinkedHashSet<>();

        if (sessionIds != null) {
            for (String sid : sessionIds) {
                if (sid != null && !sid.isBlank()) {
                    effectiveSessionIds.add(sid.trim());
                }
            }
        }

        if (userId != null && !userId.isBlank()) {
            List<GameParticipantEntity> userParticipants = gameParticipantRepository.findByUserId(userId);
            for (GameParticipantEntity p : userParticipants) {
                if (p.getGameSessionId() != null && !p.getGameSessionId().isBlank()) {
                    effectiveSessionIds.add(p.getGameSessionId());
                }
            }
        }

        if (effectiveSessionIds.isEmpty()) {
            Map<String, Object> emptyRes = new HashMap<>();
            emptyRes.put("history", Collections.emptyList());
            emptyRes.put("limit", maxLimit);
            return emptyRes;
        }

        // 1. Batch fetch sessions
        Map<String, GameSessionEntity> sessionMap = gameSessionRepository.findAllById(effectiveSessionIds).stream()
                .collect(Collectors.toMap(GameSessionEntity::getId, s -> s, (a, b) -> a));

        List<Map<String, Object>> historyList = new ArrayList<>();

        // Process Shiritori sessions history
        for (String sid : effectiveSessionIds) {
            GameSessionEntity session = sessionMap.get(sid);
            List<ShiritoriService.ShiritoriWordItem> shiritoriWords = shiritoriService.getChainHistoryForSession(sid);
            if (shiritoriWords != null && !shiritoriWords.isEmpty()) {
                String roomCode = session != null && session.getRoomCode() != null ? session.getRoomCode() : "—";
                for (int i = 0; i < shiritoriWords.size(); i++) {
                    ShiritoriService.ShiritoriWordItem item = shiritoriWords.get(i);
                    Map<String, Object> hItem = new HashMap<>();
                    hItem.put("id", item.getId());
                    hItem.put("sessionId", sid);
                    hItem.put("roomCode", roomCode);
                    hItem.put("roundId", "shiritori_" + item.getId());
                    hItem.put("roundNumber", i + 1);
                    hItem.put("promptText", item.getWord());
                    hItem.put("promptType", "SHIRITORI");
                    hItem.put("rawAnswer", item.getWord());
                    hItem.put("isCorrect", true);
                    hItem.put("attemptCount", 1);
                    hItem.put("participantId", item.getParticipantId());
                    hItem.put("participantName", item.getParticipantName());
                    hItem.put("participantAvatarUrl", item.getParticipantAvatarUrl());
                    hItem.put("submittedAt", item.getSubmittedAt() != null ? item.getSubmittedAt().toString() : LocalDateTime.now().toString());
                    hItem.put("vocabularyEntryId", null);

                    Map<String, Object> details = new HashMap<>();
                    details.put("term", item.getWord());
                    details.put("reading", item.getReading());
                    details.put("meaningsVi", item.getMeaning() != null && !item.getMeaning().isBlank() ? List.of(item.getMeaning()) : Collections.emptyList());
                    hItem.put("details", details);

                    historyList.add(hItem);
                }
            }
        }

        // 2. Batch fetch rounds for all sessions
        List<GameRoundEntity> allRounds = gameRoundRepository.findByGameSessionIdIn(sessionMap.keySet());
        if (!allRounds.isEmpty()) {
            List<String> roundIds = allRounds.stream().map(GameRoundEntity::getId).toList();

            // 3. Batch fetch submissions for all rounds
            List<GameSubmissionEntity> allSubs = gameSubmissionRepository.findByGameRoundIdIn(roundIds);
            Map<String, List<GameSubmissionEntity>> subsByRoundId = allSubs.stream()
                    .collect(Collectors.groupingBy(GameSubmissionEntity::getGameRoundId));

            // 4. Collect & Batch fetch vocabularies
            Set<String> vocabIds = allRounds.stream()
                    .map(GameRoundEntity::getVocabularyEntryId)
                    .filter(Objects::nonNull)
                    .collect(Collectors.toSet());
            Map<String, VocabularyEntryEntity> vocabMap = vocabIds.isEmpty() ? Collections.emptyMap() :
                    vocabularyEntryRepository.findAllById(vocabIds).stream()
                            .collect(Collectors.toMap(VocabularyEntryEntity::getId, v -> v, (a, b) -> a));

            // 5. Collect & Batch fetch participants & their user avatars
            Set<String> participantIds = allSubs.stream()
                    .map(GameSubmissionEntity::getParticipantId)
                    .filter(Objects::nonNull)
                    .collect(Collectors.toSet());
            Map<String, GameParticipantEntity> participantMap = participantIds.isEmpty() ? Collections.emptyMap() :
                    gameParticipantRepository.findAllById(participantIds).stream()
                            .collect(Collectors.toMap(GameParticipantEntity::getId, p -> p, (a, b) -> a));

            Set<String> userIds = participantMap.values().stream()
                    .map(GameParticipantEntity::getUserId)
                    .filter(Objects::nonNull)
                    .collect(Collectors.toSet());
            Map<String, com.goiflow.entity.auth.UserEntity> userMap = userIds.isEmpty() ? Collections.emptyMap() :
                    userRepository.findAllById(userIds).stream()
                            .collect(Collectors.toMap(com.goiflow.entity.auth.UserEntity::getId, u -> u, (a, b) -> a));

            // 6. In-memory assembly
            for (GameRoundEntity r : allRounds) {
                GameSessionEntity session = sessionMap.get(r.getGameSessionId());
                if (session == null) continue;

                List<GameSubmissionEntity> subs = subsByRoundId.getOrDefault(r.getId(), Collections.emptyList());
                VocabularyEntryEntity vocab = r.getVocabularyEntryId() != null ? vocabMap.get(r.getVocabularyEntryId()) : null;

                if (!subs.isEmpty()) {
                    for (GameSubmissionEntity sub : subs) {
                        boolean isCorrect = Boolean.TRUE.equals(sub.getIsCorrect());
                        int attemptCount = sub.getAttemptCount() != null ? sub.getAttemptCount() : 1;

                        Map<String, Object> item = new HashMap<>();
                        item.put("id", sub.getId());
                        item.put("sessionId", session.getId());
                        item.put("roomCode", session.getRoomCode() != null ? session.getRoomCode() : "—");
                        item.put("roundId", r.getId());
                        item.put("roundNumber", r.getRoundNumber() != null ? r.getRoundNumber() : 1);
                        item.put("promptText", r.getPromptText() != null ? r.getPromptText() : "");
                        item.put("promptType", r.getPromptType() != null ? r.getPromptType().name() : "KANJI_TO_READING");
                        item.put("rawAnswer", sub.getRawAnswer() != null ? sub.getRawAnswer() : "—");
                        item.put("isCorrect", isCorrect);
                        item.put("attemptCount", attemptCount);

                        String participantName = "Player";
                        String participantAvatarUrl = null;
                        GameParticipantEntity p = participantMap.get(sub.getParticipantId());
                        if (p != null) {
                            if (p.getDisplayName() != null && !p.getDisplayName().isBlank()) {
                                participantName = p.getDisplayName();
                            }
                            if (p.getUserId() != null) {
                                com.goiflow.entity.auth.UserEntity u = userMap.get(p.getUserId());
                                if (u != null) {
                                    participantAvatarUrl = u.getImage();
                                }
                            }
                        }
                        item.put("participantId", sub.getParticipantId());
                        item.put("participantName", participantName);
                        item.put("participantAvatarUrl", participantAvatarUrl);

                        String submittedAt = LocalDateTime.now().toString();
                        if (sub.getSubmittedAt() != null) {
                            submittedAt = sub.getSubmittedAt().toString();
                        } else if (r.getCreatedAt() != null) {
                            submittedAt = r.getCreatedAt().toString();
                        } else if (r.getStartedAt() != null) {
                            submittedAt = r.getStartedAt().toString();
                        }
                        item.put("submittedAt", submittedAt);
                        item.put("vocabularyEntryId", r.getVocabularyEntryId());

                        // Attach details ONLY on correct answer or final attempt (attempt >= 3) to prevent duplicate details
                        if (vocab != null && (isCorrect || attemptCount >= 3)) {
                            item.put("details", contentSelectionService.toVocabularyHistoryDetails(vocab));
                        }

                        historyList.add(item);
                    }
                } else if (r.getResolvedAt() != null) {
                    // Exactly when all participants have attempt = 0 (no submissions recorded for this resolved round)
                    Map<String, Object> item = new HashMap<>();
                    item.put("id", "round_" + r.getId());
                    item.put("sessionId", session.getId());
                    item.put("roomCode", session.getRoomCode() != null ? session.getRoomCode() : "—");
                    item.put("roundId", r.getId());
                    item.put("roundNumber", r.getRoundNumber() != null ? r.getRoundNumber() : 1);
                    item.put("promptText", r.getPromptText() != null ? r.getPromptText() : "");
                    item.put("promptType", r.getPromptType() != null ? r.getPromptType().name() : "KANJI_TO_READING");
                    item.put("rawAnswer", "—");
                    item.put("isCorrect", false);
                    item.put("attemptCount", 0);
                    item.put("participantId", null);
                    item.put("participantName", "—");
                    item.put("participantAvatarUrl", null);
                    item.put("submittedAt", r.getResolvedAt().toString());
                    item.put("vocabularyEntryId", r.getVocabularyEntryId());

                    if (vocab != null) {
                        item.put("details", contentSelectionService.toVocabularyHistoryDetails(vocab));
                    }

                    historyList.add(item);
                }
            }
        }

        // Sort descending by submittedAt, then by attemptCount DESC, then by id DESC as final tiebreaker.
        // All three levels ensure fully deterministic ordering identical across all clients:
        // - Level 1: submittedAt DESC (most recent first)
        // - Level 2: attemptCount DESC (same-round: attempt 3 before attempt 2 before attempt 1)
        // - Level 3: id DESC (cross-participant same-timestamp: stable, reproducible on all clients)
        historyList.sort((a, b) -> {
            String timeA = Objects.toString(a.get("submittedAt"), "");
            String timeB = Objects.toString(b.get("submittedAt"), "");
            int cmp = timeB.compareTo(timeA);
            if (cmp != 0) return cmp;
            int attA = a.get("attemptCount") instanceof Number n ? n.intValue() : 0;
            int attB = b.get("attemptCount") instanceof Number n ? n.intValue() : 0;
            cmp = Integer.compare(attB, attA);
            if (cmp != 0) return cmp;
            // Final tiebreak: id DESC for fully deterministic order across all clients
            String idA = Objects.toString(a.get("id"), "");
            String idB = Objects.toString(b.get("id"), "");
            return idB.compareTo(idA);
        });

        if (historyList.size() > maxLimit) {
            historyList = new ArrayList<>(historyList.subList(0, maxLimit));
        }

        Map<String, Object> result = new HashMap<>();
        result.put("history", historyList);
        result.put("limit", maxLimit);
        return result;
    }
}
