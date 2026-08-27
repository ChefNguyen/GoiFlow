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

        List<String> roundIds = rounds.stream().map(GameRoundEntity::getId).toList();
        List<GameSubmissionEntity> allSubs = roundIds.isEmpty() ? Collections.emptyList() :
                gameSubmissionRepository.findByGameRoundIdIn(roundIds);

        Map<String, Integer> scoreMap = new HashMap<>();
        Map<String, Integer> correctMap = new HashMap<>();
        for (GameParticipantEntity p : participants) {
            scoreMap.put(p.getId(), 0);
            correctMap.put(p.getId(), 0);
        }

        for (GameSubmissionEntity sub : allSubs) {
            if (Boolean.TRUE.equals(sub.getIsCorrect()) && sub.getParticipantId() != null) {
                scoreMap.merge(sub.getParticipantId(), sub.getScoreAwarded() != null ? sub.getScoreAwarded() : 1, Integer::sum);
                correctMap.merge(sub.getParticipantId(), 1, Integer::sum);
            }
        }

        for (GameParticipantEntity p : participants) {
            int totalScore = scoreMap.getOrDefault(p.getId(), 0);
            int correctCount = correctMap.getOrDefault(p.getId(), 0);

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

        // Assign ranks (with standard competition tie-handling) and persist
        List<Map<String, Object>> responseList = new ArrayList<>();
        int currentRank = 1;
        for (int i = 0; i < computedResults.size(); i++) {
            GameResultEntity res = computedResults.get(i);
            if (i > 0) {
                GameResultEntity prev = computedResults.get(i - 1);
                boolean isTied = Objects.equals(prev.getTotalScore(), res.getTotalScore()) &&
                                 Objects.equals(prev.getCorrectCount(), res.getCorrectCount());
                if (!isTied) {
                    currentRank = i + 1;
                }
            } else {
                currentRank = 1;
            }
            res.setRank(currentRank);
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
