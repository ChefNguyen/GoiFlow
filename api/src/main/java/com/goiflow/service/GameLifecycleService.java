package com.goiflow.service;

import com.goiflow.entity.game.GameRoundEntity;
import com.goiflow.entity.game.GameSessionEntity;
import com.goiflow.enums.GameSessionStatus;
import com.goiflow.enums.RoundStatus;
import com.goiflow.repository.GameRoundRepository;
import com.goiflow.repository.GameSessionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class GameLifecycleService {

    private final GameSessionRepository gameSessionRepository;
    private final GameRoundRepository gameRoundRepository;
    private final ContentSelectionService contentSelectionService;

    @Transactional
    public synchronized GameSessionEntity advanceToNextRound(String sessionId) {
        GameSessionEntity session = gameSessionRepository.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Session not found"));

        if (session.getStatus() == GameSessionStatus.WAITING) {
            session.setStatus(GameSessionStatus.IN_PROGRESS);
            session.setStartedAt(LocalDateTime.now());
            session = gameSessionRepository.save(session);
        } else if (session.getStatus() != GameSessionStatus.IN_PROGRESS) {
            throw new IllegalStateException("Session is not in progress");
        }

        // 1. Resolve all currently active rounds for this session
        List<GameRoundEntity> existingRounds = gameRoundRepository
                .findByGameSessionIdOrderByRoundNumberAsc(sessionId);

        for (GameRoundEntity r : existingRounds) {
            if (r.getStatus() == RoundStatus.ACTIVE) {
                r.setStatus(RoundStatus.RESOLVED);
                if (r.getResolvedAt() == null) {
                    r.setResolvedAt(LocalDateTime.now());
                }
                gameRoundRepository.save(r);
            }
        }

        // 2. Compute next round number safely (continuous gameplay until user explicitly finishes)
        int currentRoundNum = session.getCurrentRoundNumber() != null ? session.getCurrentRoundNumber() : 0;
        int nextRound = currentRoundNum + 1;

        // 3. Concurrency / Idempotency guard: check if nextRound already exists
        Optional<GameRoundEntity> existingRoundOpt = gameRoundRepository
                .findByGameSessionIdAndRoundNumber(sessionId, nextRound);

        if (existingRoundOpt.isPresent()) {
            GameRoundEntity existing = existingRoundOpt.get();
            if (existing.getStatus() != RoundStatus.ACTIVE) {
                existing.setStatus(RoundStatus.ACTIVE);
                gameRoundRepository.save(existing);
            }
            session.setCurrentRoundNumber(nextRound);
            return gameSessionRepository.save(session);
        }

        // 4. Create and save new round
        session.setCurrentRoundNumber(nextRound);
        GameSessionEntity updatedSession = gameSessionRepository.save(session);

        GameRoundEntity round = contentSelectionService.selectAndCreateNextRound(sessionId, session.getJlptLevel(), nextRound, null);
        gameRoundRepository.save(round);

        return updatedSession;
    }
}
