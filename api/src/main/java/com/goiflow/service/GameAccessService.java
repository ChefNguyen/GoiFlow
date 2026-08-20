package com.goiflow.service;

import com.goiflow.entity.game.GameParticipantEntity;
import com.goiflow.entity.game.GameSessionEntity;
import com.goiflow.enums.ParticipantRole;
import com.goiflow.repository.GameParticipantRepository;
import com.goiflow.repository.GameSessionRepository;
import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class GameAccessService {

    private final GameSessionRepository gameSessionRepository;
    private final GameParticipantRepository gameParticipantRepository;

    @Data
    @Builder
    public static class GameAccessResult {
        private GameSessionEntity session;
        private GameParticipantEntity participant;
        private boolean isHost;
    }

    public GameAccessResult requireGameAccess(String sessionId, String userId, boolean hostOnly) {
        GameSessionEntity session = gameSessionRepository.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Game session not found"));

        GameParticipantEntity participant = gameParticipantRepository.findByGameSessionIdAndUserId(sessionId, userId)
                .orElseThrow(() -> new IllegalStateException("User is not a participant in this session"));

        boolean isHost = participant.getRole() == ParticipantRole.HOST;
        if (hostOnly && !isHost) {
            throw new IllegalStateException("Only host can perform this action");
        }

        return GameAccessResult.builder()
                .session(session)
                .participant(participant)
                .isHost(isHost)
                .build();
    }
}
