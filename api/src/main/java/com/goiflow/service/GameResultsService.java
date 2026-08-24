package com.goiflow.service;

import com.goiflow.entity.game.GameParticipantEntity;
import com.goiflow.entity.game.GameResultEntity;
import com.goiflow.entity.game.GameRoundEntity;
import com.goiflow.entity.game.GameSessionEntity;
import com.goiflow.entity.game.GameSubmissionEntity;
import com.goiflow.enums.GameSessionStatus;
import com.goiflow.repository.*;
import com.goiflow.util.CuidUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class GameResultsService {

    private final GameSessionRepository gameSessionRepository;
    private final GameParticipantRepository gameParticipantRepository;
    private final GameRoundRepository gameRoundRepository;
    private final GameSubmissionRepository gameSubmissionRepository;
    private final GameResultRepository gameResultRepository;

    @Transactional
    public List<Map<String, Object>> computeAndPersistResults(String sessionId) {
        return computeAndPersistResults(sessionId, true);
    }

    @Transactional
    public List<Map<String, Object>> computeAndPersistResults(String sessionId, boolean markFinished) {
        GameSessionEntity session = gameSessionRepository.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Session not found"));

        List<GameParticipantEntity> participants = gameParticipantRepository.findByGameSessionId(sessionId);
        List<GameRoundEntity> rounds = gameRoundRepository.findByGameSessionIdOrderByRoundNumberAsc(sessionId);

        List<GameResultEntity> computedResults = new ArrayList<>();

        for (GameParticipantEntity p : participants) {
            int totalScore = 0;
            int correctCount = 0;

            for (GameRoundEntity r : rounds) {
                Optional<GameSubmissionEntity> subOpt = gameSubmissionRepository.findByGameRoundIdAndParticipantId(r.getId(), p.getId());
                if (subOpt.isPresent()) {
                    GameSubmissionEntity sub = subOpt.get();
                    if (Boolean.TRUE.equals(sub.getIsCorrect())) {
                        correctCount++;
                        totalScore += (sub.getScoreAwarded() != null ? sub.getScoreAwarded() : 1);
                    }
                }
            }

            Optional<GameResultEntity> existingRes = gameResultRepository.findByGameSessionIdAndParticipantId(sessionId, p.getId());
            GameResultEntity resultEntity = existingRes.orElseGet(() -> GameResultEntity.builder()
                    .id(CuidUtils.generate())
                    .gameSessionId(sessionId)
                    .participantId(p.getId())
                    .build());

            resultEntity.setTotalScore(totalScore);
            resultEntity.setCorrectCount(correctCount);
            resultEntity.setAverageResponseMs(1000);
            computedResults.add(resultEntity);
        }

        // Sort descending by totalScore, then correctCount
        computedResults.sort((a, b) -> {
            int scoreCmp = Integer.compare(b.getTotalScore(), a.getTotalScore());
            if (scoreCmp != 0) return scoreCmp;
            return Integer.compare(b.getCorrectCount(), a.getCorrectCount());
        });

        // Assign ranks and persist
        List<Map<String, Object>> responseList = new ArrayList<>();
        for (int i = 0; i < computedResults.size(); i++) {
            GameResultEntity res = computedResults.get(i);
            res.setRank(i + 1);
            GameResultEntity saved = gameResultRepository.save(res);

            String displayName = "Player";
            Optional<GameParticipantEntity> pOpt = gameParticipantRepository.findById(saved.getParticipantId());
            if (pOpt.isPresent()) {
                displayName = pOpt.get().getDisplayName();
            }

            Map<String, Object> map = new HashMap<>();
            map.put("id", saved.getId());
            map.put("gameSessionId", saved.getGameSessionId());
            map.put("participantId", saved.getParticipantId());
            map.put("displayName", displayName);
            map.put("rank", saved.getRank());
            map.put("totalScore", saved.getTotalScore());
            map.put("correctCount", saved.getCorrectCount());
            map.put("averageResponseMs", saved.getAverageResponseMs());
            responseList.add(map);
        }

        if (markFinished) {
            session.setStatus(GameSessionStatus.FINISHED);
            session.setFinishedAt(LocalDateTime.now());
            gameSessionRepository.save(session);
        }

        return responseList;
    }

    @Transactional
    public List<Map<String, Object>> getResultsForSession(String sessionId) {
        List<GameResultEntity> results = gameResultRepository.findByGameSessionIdOrderByRankAsc(sessionId);
        GameSessionEntity session = gameSessionRepository.findById(sessionId).orElse(null);
        boolean isAlreadyFinished = session != null && session.getStatus() == GameSessionStatus.FINISHED;

        // If the session is still active (e.g. non-host participant left early to view their score),
        // compute intermediate standings WITHOUT marking the session FINISHED for the remaining players.
        if (results.isEmpty() || !isAlreadyFinished) {
            return computeAndPersistResults(sessionId, false);
        }

        List<Map<String, Object>> list = new ArrayList<>();
        for (GameResultEntity r : results) {
            String displayName = "Player";
            Optional<GameParticipantEntity> pOpt = gameParticipantRepository.findById(r.getParticipantId());
            if (pOpt.isPresent()) {
                displayName = pOpt.get().getDisplayName();
            }

            Map<String, Object> map = new HashMap<>();
            map.put("id", r.getId());
            map.put("gameSessionId", r.getGameSessionId());
            map.put("participantId", r.getParticipantId());
            map.put("displayName", displayName);
            map.put("rank", r.getRank());
            map.put("totalScore", r.getTotalScore());
            map.put("correctCount", r.getCorrectCount());
            map.put("averageResponseMs", r.getAverageResponseMs());
            list.add(map);
        }
        return list;
    }
}
