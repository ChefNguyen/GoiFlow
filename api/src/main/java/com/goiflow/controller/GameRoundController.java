package com.goiflow.controller;

import com.goiflow.dto.request.SubmitAnswerRequest;
import com.goiflow.entity.content.AcceptedAnswerEntity;
import com.goiflow.entity.content.VocabularyEntryEntity;
import com.goiflow.entity.game.GameRoundEntity;
import com.goiflow.entity.game.GameSessionEntity;
import com.goiflow.entity.game.GameSubmissionEntity;
import com.goiflow.enums.GameSessionStatus;
import com.goiflow.enums.RoundStatus;
import com.goiflow.repository.*;
import com.goiflow.service.ContentSelectionService;
import com.goiflow.service.GameLifecycleService;
import com.goiflow.util.CuidUtils;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/v1/game/sessions/{sessionId}")
@RequiredArgsConstructor
public class GameRoundController {

    private final GameLifecycleService gameLifecycleService;
    private final GameSessionRepository gameSessionRepository;
    private final GameRoundRepository gameRoundRepository;
    private final VocabularyEntryRepository vocabularyEntryRepository;
    private final AcceptedAnswerRepository acceptedAnswerRepository;
    private final GameSubmissionRepository gameSubmissionRepository;
    private final ContentSelectionService contentSelectionService;

    @GetMapping("/rounds")
    public ResponseEntity<?> getActiveRound(@PathVariable String sessionId) {
        GameSessionEntity session = gameSessionRepository.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Session not found"));

        if (session.getStatus() == GameSessionStatus.FINISHED) {
            return ResponseEntity.ok(Map.of("status", "FINISHED"));
        }

        Optional<GameRoundEntity> activeRoundOpt = gameRoundRepository
                .findFirstByGameSessionIdAndStatusOrderByRoundNumberDesc(sessionId, RoundStatus.ACTIVE);

        if (activeRoundOpt.isPresent()) {
            GameRoundEntity round = activeRoundOpt.get();
            return ResponseEntity.ok(toRoundResponse(round, session));
        }

        return ResponseEntity.ok(Map.of(
                "status", session.getStatus().name(),
                "currentRoundNumber", session.getCurrentRoundNumber(),
                "maxRounds", session.getMaxRounds()
        ));
    }

    @PostMapping("/rounds")
    public ResponseEntity<?> advanceRound(@PathVariable String sessionId, @RequestBody(required = false) Map<String, Object> body) {
        Map<String, Object> skippedRoundDetails = null;
        Optional<GameRoundEntity> prevRoundOpt = gameRoundRepository
                .findFirstByGameSessionIdAndStatusOrderByRoundNumberDesc(sessionId, RoundStatus.ACTIVE);

        if (prevRoundOpt.isPresent()) {
            GameRoundEntity prevRound = prevRoundOpt.get();
            String participantId = body != null && body.get("participantId") != null ? body.get("participantId").toString() : null;
            String action = body != null && body.get("action") != null ? body.get("action").toString() : "skip";

            boolean isSkipAction = action != null && (action.equalsIgnoreCase("skip") || action.equalsIgnoreCase("Skipped"));
            if (isSkipAction && participantId != null && !participantId.isBlank()) {
                Optional<GameSubmissionEntity> existingSub = gameSubmissionRepository.findByGameRoundIdAndParticipantIdAndAttemptCount(prevRound.getId(), participantId, 3);
                if (existingSub.isEmpty()) {
                    GameSubmissionEntity submission = GameSubmissionEntity.builder()
                            .id(CuidUtils.generate())
                            .gameRoundId(prevRound.getId())
                            .participantId(participantId)
                            .rawAnswer("skip")
                            .normalizedAnswer("skip")
                            .attemptCount(3)
                            .isCorrect(false)
                            .scoreAwarded(0)
                            .submittedAt(LocalDateTime.now())
                            .build();
                    gameSubmissionRepository.save(submission);
                } else {
                    GameSubmissionEntity submission = existingSub.get();
                    if (!Boolean.TRUE.equals(submission.getIsCorrect())) {
                        submission.setRawAnswer("skip");
                        submission.setNormalizedAnswer("skip");
                        submission.setAttemptCount(3);
                        submission.setIsCorrect(false);
                        submission.setScoreAwarded(0);
                        submission.setSubmittedAt(LocalDateTime.now());
                        gameSubmissionRepository.save(submission);
                    }
                }
            }

            if (prevRound.getVocabularyEntryId() != null) {
                VocabularyEntryEntity vocab = vocabularyEntryRepository.findById(prevRound.getVocabularyEntryId()).orElse(null);
                if (vocab != null) {
                    skippedRoundDetails = new HashMap<>();
                    skippedRoundDetails.put("vocabularyEntryId", vocab.getId());
                    skippedRoundDetails.put("promptText", prevRound.getPromptText());
                    skippedRoundDetails.put("details", contentSelectionService.toVocabularyHistoryDetails(vocab));
                }
            }
        }

        GameSessionEntity session = gameLifecycleService.advanceToNextRound(sessionId);
        if (session.getStatus() == GameSessionStatus.FINISHED) {
            Map<String, Object> res = new HashMap<>();
            res.put("status", "FINISHED");
            if (skippedRoundDetails != null) {
                res.put("skippedRoundDetails", skippedRoundDetails);
            }
            return ResponseEntity.ok(res);
        }

        GameRoundEntity round = gameRoundRepository
                .findFirstByGameSessionIdAndStatusOrderByRoundNumberDesc(sessionId, RoundStatus.ACTIVE)
                .orElseThrow(() -> new IllegalStateException("Failed to retrieve new active round"));

        Map<String, Object> res = toRoundResponse(round, session);
        if (skippedRoundDetails != null) {
            res.put("skippedRoundDetails", skippedRoundDetails);
        }
        return ResponseEntity.ok(res);
    }

    @PostMapping("/submit")
    public ResponseEntity<?> submitAnswer(@PathVariable String sessionId, @Valid @RequestBody SubmitAnswerRequest req) {
        GameSessionEntity session = gameSessionRepository.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Session not found"));

        Optional<GameRoundEntity> activeRoundOpt = gameRoundRepository
                .findFirstByGameSessionIdAndStatusOrderByRoundNumberDesc(sessionId, RoundStatus.ACTIVE);

        if (activeRoundOpt.isEmpty()) {
            return ResponseEntity.ok(Map.of(
                    "submissionId", "sub_" + System.currentTimeMillis(),
                    "isCorrect", false,
                    "scoreAwarded", 0,
                    "shouldAdvance", true
            ));
        }

        GameRoundEntity round = activeRoundOpt.get();
        String normalizedInput = contentSelectionService.normalizeAnswer(req.getRawAnswer());
        boolean isCorrect = false;

        VocabularyEntryEntity vocab = null;
        if (round.getVocabularyEntryId() != null) {
            vocab = vocabularyEntryRepository.findById(round.getVocabularyEntryId()).orElse(null);
            if (vocab != null) {
                List<AcceptedAnswerEntity> answers = acceptedAnswerRepository.findByVocabularyEntryId(vocab.getId());
                List<String> validAnswers = new ArrayList<>();
                if (vocab.getReading() != null) validAnswers.add(vocab.getReading());
                if (vocab.getAmHanViet() != null) validAnswers.addAll(vocab.getAmHanViet());
                answers.forEach(a -> {
                    if (a.getNormalizedValue() != null) validAnswers.add(a.getNormalizedValue());
                    if (a.getDisplayValue() != null) validAnswers.add(a.getDisplayValue());
                });

                isCorrect = contentSelectionService.checkAnswer(normalizedInput, validAnswers);
            }
        }

        int currentAttempt = req.getAttemptCount() != null ? req.getAttemptCount() : 1;
        boolean shouldAdvance = isCorrect || currentAttempt >= 3;
        int remainingAttempts = Math.max(0, 3 - currentAttempt);

        // Persist real submission to PostgreSQL (each attempt is its own distinct record)
        String participantId = req.getParticipantId() != null ? req.getParticipantId() : session.getHostParticipantId();
        GameSubmissionEntity savedSub = null;
        if (participantId != null) {
            Optional<GameSubmissionEntity> existingSub = gameSubmissionRepository
                    .findByGameRoundIdAndParticipantIdAndAttemptCount(round.getId(), participantId, currentAttempt);
            GameSubmissionEntity submission;
            if (existingSub.isPresent()) {
                submission = existingSub.get();
                submission.setRawAnswer(req.getRawAnswer());
                submission.setNormalizedAnswer(normalizedInput);
                submission.setIsCorrect(isCorrect);
                submission.setScoreAwarded(isCorrect ? 1 : 0);
                submission.setSubmittedAt(LocalDateTime.now());
            } else {
                submission = GameSubmissionEntity.builder()
                        .id(CuidUtils.generate())
                        .gameRoundId(round.getId())
                        .participantId(participantId)
                        .rawAnswer(req.getRawAnswer())
                        .normalizedAnswer(normalizedInput)
                        .attemptCount(currentAttempt)
                        .isCorrect(isCorrect)
                        .scoreAwarded(isCorrect ? 1 : 0)
                        .submittedAt(LocalDateTime.now())
                        .build();
            }
            savedSub = gameSubmissionRepository.save(submission);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("submissionId", savedSub != null ? savedSub.getId() : ("sub_" + System.currentTimeMillis()));
        response.put("isCorrect", isCorrect);
        response.put("scoreAwarded", isCorrect ? 1 : 0);
        response.put("normalizedAnswer", normalizedInput);
        response.put("attemptCount", currentAttempt);
        response.put("remainingAttempts", remainingAttempts);
        response.put("shouldAdvance", shouldAdvance);
        response.put("vocabularyEntryId", round.getVocabularyEntryId());

        // Only attach vocabulary details if answered correctly OR if failed 3 times
        if (vocab != null && (isCorrect || currentAttempt >= 3)) {
            response.put("details", contentSelectionService.toVocabularyHistoryDetails(vocab));
        }

        return ResponseEntity.ok(response);
    }

    private Map<String, Object> toRoundResponse(GameRoundEntity round, GameSessionEntity session) {
        Map<String, Object> map = new HashMap<>();
        map.put("roundId", round.getId());
        map.put("roundNumber", round.getRoundNumber());
        map.put("promptText", round.getPromptText());
        map.put("promptType", round.getPromptType() != null ? round.getPromptType().name() : "KANJI_TO_READING");
        map.put("startedAt", round.getStartedAt() != null ? round.getStartedAt().toString() : LocalDateTime.now().toString());
        map.put("vocabularyEntryId", round.getVocabularyEntryId());
        map.put("status", session.getStatus().name());
        map.put("currentRoundNumber", session.getCurrentRoundNumber());
        map.put("maxRounds", session.getMaxRounds());
        return map;
    }
}
