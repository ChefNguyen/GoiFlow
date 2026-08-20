package com.goiflow.service;

import com.goiflow.entity.game.GameParticipantEntity;
import com.goiflow.entity.game.GameResultEntity;
import com.goiflow.repository.GameParticipantRepository;
import com.goiflow.repository.GameResultRepository;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
public class LeaderboardService {

    private final GameResultRepository gameResultRepository;
    private final GameParticipantRepository gameParticipantRepository;

    @Data
    @Builder
    public static class LeaderboardEntry {
        private String userId;
        private String displayName;
        private int totalScore;
        private int gamesPlayed;
    }

    @AllArgsConstructor
    private static class Accumulator {
        String displayName;
        int totalScore;
        int gamesPlayed;
    }

    @Transactional(readOnly = true)
    public List<LeaderboardEntry> getGlobalLeaderboard() {
        List<GameResultEntity> allResults = gameResultRepository.findAll();
        if (allResults.isEmpty()) {
            return Collections.emptyList();
        }

        Map<String, Accumulator> map = new HashMap<>();

        for (GameResultEntity r : allResults) {
            String displayName = "Player";
            String key = r.getParticipantId();

            Optional<GameParticipantEntity> participantOpt = gameParticipantRepository.findById(r.getParticipantId());
            if (participantOpt.isPresent()) {
                GameParticipantEntity p = participantOpt.get();
                if (p.getDisplayName() != null && !p.getDisplayName().isBlank()) {
                    displayName = p.getDisplayName();
                }
                if (p.getUserId() != null) {
                    key = p.getUserId();
                }
            }

            Accumulator acc = map.computeIfAbsent(displayName, k -> new Accumulator(k, 0, 0));
            acc.totalScore += r.getTotalScore();
            acc.gamesPlayed += 1;
        }

        List<LeaderboardEntry> entries = new ArrayList<>();
        for (Accumulator acc : map.values()) {
            entries.add(LeaderboardEntry.builder()
                    .userId(acc.displayName)
                    .displayName(acc.displayName)
                    .totalScore(acc.totalScore)
                    .gamesPlayed(acc.gamesPlayed)
                    .build());
        }

        entries.sort((a, b) -> Integer.compare(b.getTotalScore(), a.getTotalScore()));
        return entries;
    }
}
