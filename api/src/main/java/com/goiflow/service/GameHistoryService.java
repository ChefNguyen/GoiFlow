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

        if (sessionMap.isEmpty()) {
            Map<String, Object> emptyRes = new HashMap<>();
            emptyRes.put("history", Collections.emptyList());
            emptyRes.put("limit", maxLimit);
            return emptyRes;
        }

        // 2. Batch fetch rounds for all sessions
        List<GameRoundEntity> allRounds = gameRoundRepository.findByGameSessionIdIn(sessionMap.keySet());
        if (allRounds.isEmpty()) {
            Map<String, Object> emptyRes = new HashMap<>();
            emptyRes.put("history", Collections.emptyList());
            emptyRes.put("limit", maxLimit);
            return emptyRes;
        }

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
        List<Map<String, Object>> historyList = new ArrayList<>();

        for (GameRoundEntity r : allRounds) {
            GameSessionEntity session = sessionMap.get(r.getGameSessionId());
            if (session == null) continue;

            List<GameSubmissionEntity> subs = subsByRoundId.getOrDefault(r.getId(), Collections.emptyList());
            VocabularyEntryEntity vocab = r.getVocabularyEntryId() != null ? vocabMap.get(r.getVocabularyEntryId()) : null;

            if (!subs.isEmpty()) {
                for (GameSubmissionEntity sub : subs) {
                    boolean isCorrect = Boolean.TRUE.equals(sub.getIsCorrect());
                    int attemptCount = sub.getAttemptCount() != null ? sub.getAttemptCount() : 1;
                    boolean isRoundResolved = r.getResolvedAt() != null;

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

                    // Only reveal vocabulary details if the answer was correct, or failed 3 times, or the round is resolved
                    if (vocab != null && (isCorrect || attemptCount >= 3 || isRoundResolved)) {
                        item.put("details", contentSelectionService.toVocabularyHistoryDetails(vocab));
                    }

                    historyList.add(item);
                }
            } else {
                // Only include rounds with no submissions if they were explicitly resolved/skipped
                // (i.e., they have a resolvedAt timestamp). Active live rounds (no submission yet)
                // must NOT appear in history — they would falsely show as incorrect answers.
                if (r.getResolvedAt() == null) {
                    continue;
                }

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

        // Sort descending by submittedAt safely (most recent first)
        historyList.sort((a, b) -> {
            String timeA = Objects.toString(a.get("submittedAt"), "");
            String timeB = Objects.toString(b.get("submittedAt"), "");
            return timeB.compareTo(timeA);
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
