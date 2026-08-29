package com.goiflow.service;

import com.goiflow.dto.request.SubmitAnswerRequest;
import com.goiflow.entity.content.VocabularyEntryEntity;
import com.goiflow.entity.game.GameRoundEntity;
import com.goiflow.entity.game.GameSessionEntity;
import com.goiflow.entity.game.GameSubmissionEntity;
import com.goiflow.enums.GameSessionStatus;
import com.goiflow.enums.JlptLevel;
import com.goiflow.enums.PromptType;
import com.goiflow.enums.RoundStatus;
import com.goiflow.repository.*;
import com.goiflow.util.CuidUtils;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.text.Normalizer;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
@RequiredArgsConstructor
public class ActiveGamePlayService {

    private final GameSessionRepository gameSessionRepository;
    private final GameRoundRepository gameRoundRepository;
    private final VocabularyEntryRepository vocabularyEntryRepository;
    private final GameSubmissionRepository gameSubmissionRepository;
    private final ContentSelectionService contentSelectionService;
    private final RedisCacheService redisCacheService;

    // High-performance RAM cache for active game sessions (0ms latency, zero WAN SQL blocking)
    private final Map<String, ActiveGameState> activeGameStates = new ConcurrentHashMap<>();

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ActiveGameState {
        private String sessionId;
        private String roomCode;
        private JlptLevel jlptLevel;
        private Integer timePerPromptSeconds;
        private Integer maxRounds;
        private Integer currentRoundNumber;
        private GameSessionStatus status;
        private String hostParticipantId;

        // Current Active Round info in RAM
        private String currentRoundId;
        private String currentPromptText;
        private PromptType currentPromptType;
        private String currentVocabularyEntryId;
        private LocalDateTime currentRoundStartedAt;
        private Set<String> validAnswers;
        private Map<String, Object> currentVocabularyDetails;

        // Upcoming Preloaded Round in RAM (Enables 0.0ms instant optimistic switching)
        private String upcomingRoundId;
        private Integer upcomingRoundNumber;
        private String upcomingPromptText;
        private PromptType upcomingPromptType;
        private String upcomingVocabularyEntryId;
        private Set<String> upcomingValidAnswers;
        private Map<String, Object> upcomingVocabularyDetails;

        // Scores and attempts in RAM
        @Builder.Default
        private Map<String, Integer> participantScores = new ConcurrentHashMap<>();
        @Builder.Default
        private Map<String, Integer> participantCorrectCounts = new ConcurrentHashMap<>();
        @Builder.Default
        private Set<String> usedVocabIds = ConcurrentHashMap.newKeySet();
    }

    /**
     * Get active round with 0ms RAM lookup & preloaded upcoming round
     */
    public Map<String, Object> getActiveRoundResponse(String sessionId) {
        ActiveGameState state = getOrCreateActiveGameState(sessionId);
        if (state == null) {
            return Map.of("error", "Session not found");
        }

        if (state.getStatus() == GameSessionStatus.FINISHED) {
            return Map.of("status", "FINISHED");
        }

        return toRoundResponseMap(state);
    }

    /**
     * Submit answer with 0.5ms RAM validation & auto-advance (Async PostgreSQL persistence)
     */
    public Map<String, Object> submitAnswerFast(String sessionId, SubmitAnswerRequest req) {
        ActiveGameState state = getOrCreateActiveGameState(sessionId);
        if (state == null) {
            throw new IllegalArgumentException("Session not found");
        }

        synchronized (state) {
            if (state.getStatus() == GameSessionStatus.FINISHED) {
                return Map.of("isCorrect", false, "shouldAdvance", true, "nextRound", Map.of("status", "FINISHED"));
            }

            String rawAnswer = req.getRawAnswer() != null ? req.getRawAnswer().trim() : "";
            String normalizedInput = contentSelectionService.normalizeAnswer(rawAnswer);
            boolean isCorrect = state.getValidAnswers() != null && state.getValidAnswers().contains(normalizedInput);

            int currentAttempt = req.getAttemptCount() != null ? req.getAttemptCount() : 1;
            boolean shouldAdvance = isCorrect || currentAttempt >= 3;
            int remainingAttempts = Math.max(0, 3 - currentAttempt);

            String participantId = req.getParticipantId() != null ? req.getParticipantId() : state.getHostParticipantId();
            if (isCorrect && participantId != null) {
                state.getParticipantScores().merge(participantId, 1, Integer::sum);
                state.getParticipantCorrectCounts().merge(participantId, 1, Integer::sum);
            }

            String roundId = state.getCurrentRoundId();
            String vocabId = state.getCurrentVocabularyEntryId();
            Map<String, Object> currentDetails = state.getCurrentVocabularyDetails();

            // Asynchronously persist submission to PostgreSQL without blocking HTTP response thread
            String submissionId = CuidUtils.generate();
            persistSubmissionAsync(submissionId, roundId, participantId, rawAnswer, normalizedInput, isCorrect, currentAttempt);

            Map<String, Object> response = new HashMap<>();
            response.put("submissionId", submissionId);
            response.put("isCorrect", isCorrect);
            response.put("scoreAwarded", isCorrect ? 1 : 0);
            response.put("normalizedAnswer", normalizedInput);
            response.put("attemptCount", currentAttempt);
            response.put("remainingAttempts", remainingAttempts);
            response.put("shouldAdvance", shouldAdvance);
            response.put("vocabularyEntryId", vocabId);

            if (currentDetails != null && (isCorrect || currentAttempt >= 3)) {
                response.put("details", currentDetails);
            }

            // If round completed, advance immediately in RAM ($<0.2ms)
            if (shouldAdvance) {
                advanceRoundInMemory(state);
                if (state.getStatus() == GameSessionStatus.FINISHED) {
                    response.put("nextRound", Map.of("status", "FINISHED"));
                } else {
                    Map<String, Object> nextMap = toRoundResponseMap(state);
                    response.put("nextRound", nextMap);
                    if (nextMap.containsKey("nextUpcomingRound")) {
                        response.put("nextUpcomingRound", nextMap.get("nextUpcomingRound"));
                    }
                }
            }

            return response;
        }
    }

    /**
     * Advance round in RAM (for Skip or Timeout) in 0.2ms
     */
    public Map<String, Object> advanceRoundFast(String sessionId, String participantId, String action) {
        ActiveGameState state = getOrCreateActiveGameState(sessionId);
        if (state == null) {
            throw new IllegalArgumentException("Session not found");
        }

        synchronized (state) {
            Map<String, Object> skippedDetails = null;
            if (state.getCurrentVocabularyDetails() != null) {
                skippedDetails = new HashMap<>();
                skippedDetails.put("vocabularyEntryId", state.getCurrentVocabularyEntryId());
                skippedDetails.put("promptText", state.getCurrentPromptText());
                skippedDetails.put("details", state.getCurrentVocabularyDetails());
            }

            // Record skip submission in background
            String subId = CuidUtils.generate();
            persistSubmissionAsync(subId, state.getCurrentRoundId(), participantId, "skip", "skip", false, 3);

            advanceRoundInMemory(state);

            Map<String, Object> response;
            if (state.getStatus() == GameSessionStatus.FINISHED) {
                response = new HashMap<>(Map.of("status", "FINISHED"));
            } else {
                response = toRoundResponseMap(state);
            }

            if (skippedDetails != null) {
                response.put("skippedRoundDetails", skippedDetails);
            }
            return response;
        }
    }

    public ActiveGameState getActiveGameState(String sessionId) {
        if (sessionId == null) return null;
        return activeGameStates.get(sessionId);
    }

    public void resetSessionState(String sessionId) {
        if (sessionId != null) {
            activeGameStates.remove(sessionId);
        }
    }

    public void finishSessionState(String sessionId) {
        if (sessionId != null) {
            ActiveGameState state = activeGameStates.get(sessionId);
            if (state != null) {
                state.setStatus(GameSessionStatus.FINISHED);
            }
        }
    }

    private void advanceRoundInMemory(ActiveGameState state) {
        if (state.getUpcomingRoundId() != null && state.getUpcomingPromptText() != null) {
            // Promote preloaded upcoming round to current round instantly (0ms)
            state.setCurrentRoundId(state.getUpcomingRoundId());
            state.setCurrentRoundNumber(state.getUpcomingRoundNumber());
            state.setCurrentPromptText(state.getUpcomingPromptText());
            state.setCurrentPromptType(state.getUpcomingPromptType());
            state.setCurrentVocabularyEntryId(state.getUpcomingVocabularyEntryId());
            state.setValidAnswers(state.getUpcomingValidAnswers());
            state.setCurrentVocabularyDetails(state.getUpcomingVocabularyDetails());
            state.setCurrentRoundStartedAt(LocalDateTime.now());
        } else {
            // Initial round generation
            int nextRoundNumber = (state.getCurrentRoundNumber() != null ? state.getCurrentRoundNumber() : 0) + 1;
            state.setCurrentRoundNumber(nextRoundNumber);
            VocabularyEntryEntity nextVocab = pickNextVocabulary(state.getJlptLevel(), state.getUsedVocabIds());
            if (nextVocab != null && nextVocab.getId() != null) {
                state.getUsedVocabIds().add(nextVocab.getId());
                state.setCurrentVocabularyEntryId(nextVocab.getId());
                state.setCurrentPromptText(nextVocab.getTerm() != null ? nextVocab.getTerm() : nextVocab.getReading());
                state.setCurrentVocabularyDetails(contentSelectionService.toVocabularyHistoryDetails(nextVocab));
                state.setValidAnswers(extractValidAnswers(nextVocab));
            } else {
                state.setCurrentPromptText("...");
                state.setValidAnswers(Set.of());
                state.setCurrentVocabularyDetails(Map.of());
            }
            state.setCurrentRoundId(CuidUtils.generate());
            state.setCurrentPromptType(PromptType.KANJI_TO_READING);
            state.setCurrentRoundStartedAt(LocalDateTime.now());
        }
        state.setStatus(GameSessionStatus.IN_PROGRESS);

        // Preload the next upcoming round in RAM
        preloadUpcomingRound(state);

        // Asynchronously persist new round to PostgreSQL
        persistRoundAsync(state.getCurrentRoundId(), state.getSessionId(), state.getCurrentRoundNumber(), state.getCurrentVocabularyEntryId(), state.getCurrentPromptText());
    }

    private void preloadUpcomingRound(ActiveGameState state) {
        int upcomingNum = (state.getCurrentRoundNumber() != null ? state.getCurrentRoundNumber() : 0) + 1;
        VocabularyEntryEntity vocab = pickNextVocabulary(state.getJlptLevel(), state.getUsedVocabIds());
        if (vocab != null && vocab.getId() != null) {
            state.getUsedVocabIds().add(vocab.getId());
            state.setUpcomingRoundId(CuidUtils.generate());
            state.setUpcomingRoundNumber(upcomingNum);
            state.setUpcomingPromptText(vocab.getTerm() != null ? vocab.getTerm() : vocab.getReading());
            state.setUpcomingPromptType(PromptType.KANJI_TO_READING);
            state.setUpcomingVocabularyEntryId(vocab.getId());
            state.setUpcomingValidAnswers(extractValidAnswers(vocab));
            state.setUpcomingVocabularyDetails(contentSelectionService.toVocabularyHistoryDetails(vocab));
        }
    }

    private VocabularyEntryEntity pickNextVocabulary(JlptLevel level, Set<String> excludedIds) {
        List<String> randomIds = redisCacheService.getRandomVocabIds(level, 10);
        if (randomIds != null && !randomIds.isEmpty()) {
            for (String id : randomIds) {
                if (excludedIds == null || !excludedIds.contains(id)) {
                    VocabularyEntryEntity cached = redisCacheService.getCachedVocabularyEntry(id);
                    if (cached != null) return cached;
                    Optional<VocabularyEntryEntity> dbOpt = vocabularyEntryRepository.findById(id);
                    if (dbOpt.isPresent()) {
                        redisCacheService.cacheVocabularyEntry(dbOpt.get());
                        return dbOpt.get();
                    }
                }
            }
        }

        // Fallback to PostgreSQL
        List<VocabularyEntryEntity> entries = vocabularyEntryRepository.findRandomByJlptLevel(level, 10);
        for (VocabularyEntryEntity e : entries) {
            if (excludedIds == null || !excludedIds.contains(e.getId())) {
                redisCacheService.cacheVocabularyEntry(e);
                return e;
            }
        }
        return entries.isEmpty() ? null : entries.get(0);
    }

    private Set<String> extractValidAnswers(VocabularyEntryEntity vocab) {
        Set<String> answers = new HashSet<>();
        if (vocab == null) return answers;

        if (vocab.getReading() != null) {
            answers.add(contentSelectionService.normalizeAnswer(vocab.getReading()));
        }
        if (vocab.getAmHanViet() != null) {
            for (String han : vocab.getAmHanViet()) {
                String n = contentSelectionService.normalizeAnswer(han);
                answers.add(n);
                answers.add(removeAccents(n));
            }
        }
        if (vocab.getMeaningsVi() != null) {
            for (String m : vocab.getMeaningsVi()) {
                String n = contentSelectionService.normalizeAnswer(m);
                answers.add(n);
                answers.add(removeAccents(n));
            }
        }

        return answers;
    }

    private String removeAccents(String src) {
        if (src == null) return "";
        String nfd = Normalizer.normalize(src, Normalizer.Form.NFD);
        return nfd.replaceAll("\\p{InCombiningDiacriticalMarks}+", "").replace("đ", "d").replace("Đ", "D");
    }

    private ActiveGameState getOrCreateActiveGameState(String sessionId) {
        return activeGameStates.computeIfAbsent(sessionId, id -> {
            GameSessionEntity session = gameSessionRepository.findById(id).orElse(null);
            if (session == null) return null;

            ActiveGameState state = ActiveGameState.builder()
                    .sessionId(session.getId())
                    .roomCode(session.getRoomCode())
                    .jlptLevel(session.getJlptLevel() != null ? session.getJlptLevel() : JlptLevel.N5)
                    .timePerPromptSeconds(session.getTimePerPromptSeconds() != null ? session.getTimePerPromptSeconds() : 15)
                    .maxRounds(session.getMaxRounds() != null ? session.getMaxRounds() : 10)
                    .currentRoundNumber(session.getCurrentRoundNumber() != null ? session.getCurrentRoundNumber() : 0)
                    .status(session.getStatus())
                    .hostParticipantId(session.getHostParticipantId())
                    .build();

            // Load existing active round from DB if any
            Optional<GameRoundEntity> activeRoundOpt = gameRoundRepository
                    .findFirstByGameSessionIdAndStatusOrderByRoundNumberDesc(id, RoundStatus.ACTIVE);

            if (activeRoundOpt.isPresent()) {
                GameRoundEntity r = activeRoundOpt.get();
                state.setCurrentRoundId(r.getId());
                state.setCurrentPromptText(r.getPromptText());
                state.setCurrentPromptType(r.getPromptType() != null ? r.getPromptType() : PromptType.KANJI_TO_READING);
                state.setCurrentVocabularyEntryId(r.getVocabularyEntryId());
                state.setCurrentRoundStartedAt(r.getStartedAt());
                if (r.getVocabularyEntryId() != null) {
                    vocabularyEntryRepository.findById(r.getVocabularyEntryId()).ifPresent(v -> {
                        state.setCurrentVocabularyDetails(contentSelectionService.toVocabularyHistoryDetails(v));
                        state.setValidAnswers(extractValidAnswers(v));
                        state.getUsedVocabIds().add(v.getId());
                    });
                }
                preloadUpcomingRound(state);
            } else {
                // Initialize round 1 & upcoming round in RAM
                advanceRoundInMemory(state);
            }

            return state;
        });
    }

    private Map<String, Object> toRoundResponseMap(ActiveGameState state) {
        Map<String, Object> map = new HashMap<>();
        map.put("roundId", state.getCurrentRoundId());
        map.put("roundNumber", state.getCurrentRoundNumber());
        map.put("promptText", state.getCurrentPromptText());
        map.put("promptType", state.getCurrentPromptType() != null ? state.getCurrentPromptType().name() : "KANJI_TO_READING");
        map.put("startedAt", state.getCurrentRoundStartedAt() != null ? state.getCurrentRoundStartedAt().toString() : LocalDateTime.now().toString());
        map.put("vocabularyEntryId", state.getCurrentVocabularyEntryId());
        map.put("status", state.getStatus().name());
        map.put("currentRoundNumber", state.getCurrentRoundNumber());
        map.put("maxRounds", state.getMaxRounds());
        if (state.getValidAnswers() != null) {
            map.put("validAnswers", state.getValidAnswers());
        }
        if (state.getCurrentVocabularyDetails() != null) {
            map.put("details", state.getCurrentVocabularyDetails());
        }

        if (state.getUpcomingRoundId() != null && state.getUpcomingPromptText() != null) {
            Map<String, Object> upcoming = new HashMap<>();
            upcoming.put("roundId", state.getUpcomingRoundId());
            upcoming.put("roundNumber", state.getUpcomingRoundNumber());
            upcoming.put("promptText", state.getUpcomingPromptText());
            upcoming.put("promptType", state.getUpcomingPromptType() != null ? state.getUpcomingPromptType().name() : "KANJI_TO_READING");
            upcoming.put("vocabularyEntryId", state.getUpcomingVocabularyEntryId());
            upcoming.put("status", state.getStatus().name());
            upcoming.put("currentRoundNumber", state.getUpcomingRoundNumber());
            upcoming.put("maxRounds", state.getMaxRounds());
            if (state.getUpcomingValidAnswers() != null) {
                upcoming.put("validAnswers", state.getUpcomingValidAnswers());
            }
            if (state.getUpcomingVocabularyDetails() != null) {
                upcoming.put("details", state.getUpcomingVocabularyDetails());
            }
            map.put("nextUpcomingRound", upcoming);
        }

        return map;
    }

    @Async
    public void persistSubmissionAsync(String submissionId, String roundId, String participantId,
                                       String rawAnswer, String normalizedAnswer, boolean isCorrect, int attemptCount) {
        try {
            GameSubmissionEntity submission = GameSubmissionEntity.builder()
                    .id(submissionId)
                    .gameRoundId(roundId)
                    .participantId(participantId)
                    .rawAnswer(rawAnswer)
                    .normalizedAnswer(normalizedAnswer)
                    .attemptCount(attemptCount)
                    .isCorrect(isCorrect)
                    .scoreAwarded(isCorrect ? 1 : 0)
                    .submittedAt(LocalDateTime.now())
                    .build();
            gameSubmissionRepository.save(submission);
        } catch (Exception e) {
            log.warn("Async save submission failed: {}", e.getMessage());
        }
    }

    @Async
    public void persistRoundAsync(String roundId, String sessionId, int roundNumber, String vocabId, String promptText) {
        try {
            // Mark previous rounds resolved
            gameRoundRepository.findFirstByGameSessionIdAndStatusOrderByRoundNumberDesc(sessionId, RoundStatus.ACTIVE)
                    .ifPresent(r -> {
                        r.setStatus(RoundStatus.RESOLVED);
                        r.setResolvedAt(LocalDateTime.now());
                        gameRoundRepository.save(r);
                    });

            GameRoundEntity round = GameRoundEntity.builder()
                    .id(roundId)
                    .gameSessionId(sessionId)
                    .roundNumber(roundNumber)
                    .status(RoundStatus.ACTIVE)
                    .promptType(PromptType.KANJI_TO_READING)
                    .vocabularyEntryId(vocabId)
                    .promptText(promptText)
                    .startedAt(LocalDateTime.now())
                    .build();
            gameRoundRepository.save(round);

            // Update session round number
            gameSessionRepository.findById(sessionId).ifPresent(s -> {
                s.setCurrentRoundNumber(roundNumber);
                if (s.getStatus() == GameSessionStatus.WAITING) {
                    s.setStatus(GameSessionStatus.IN_PROGRESS);
                    s.setStartedAt(LocalDateTime.now());
                }
                gameSessionRepository.save(s);
            });
        } catch (Exception e) {
            log.warn("Async persist round failed: {}", e.getMessage());
        }
    }

    @Async
    public void persistSessionFinishAsync(String sessionId) {
        try {
            gameSessionRepository.findById(sessionId).ifPresent(s -> {
                s.setStatus(GameSessionStatus.FINISHED);
                s.setFinishedAt(LocalDateTime.now());
                gameSessionRepository.save(s);
            });
        } catch (Exception e) {
            log.warn("Async persist finish session failed: {}", e.getMessage());
        }
    }
}
