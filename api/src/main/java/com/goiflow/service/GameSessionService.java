package com.goiflow.service;

import com.goiflow.entity.auth.UserEntity;
import com.goiflow.entity.game.GameParticipantEntity;
import com.goiflow.entity.game.GameResultEntity;
import com.goiflow.entity.game.GameRoundEntity;
import com.goiflow.entity.game.GameSessionEntity;
import com.goiflow.entity.game.GameSubmissionEntity;
import com.goiflow.enums.GameMode;
import com.goiflow.enums.GameSessionStatus;
import com.goiflow.enums.JlptLevel;
import com.goiflow.enums.ParticipantRole;
import com.goiflow.repository.*;
import com.goiflow.util.CuidUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class GameSessionService {

    private final GameSessionRepository gameSessionRepository;
    private final GameParticipantRepository gameParticipantRepository;
    private final GameRoundRepository gameRoundRepository;
    private final GameSubmissionRepository gameSubmissionRepository;
    private final GameResultRepository gameResultRepository;
    private final UserRepository userRepository;
    private static final SecureRandom RANDOM = new SecureRandom();

    public String generateRoomCode() {
        return String.format("%06X", RANDOM.nextInt(0xFFFFFF));
    }

    @Transactional
    public GameSessionEntity createRoom(String userId, String displayName, JlptLevel jlptLevel, Integer timePerPromptSeconds, Integer maxRounds, Boolean isPrivate) {
        String roomCode = generateRoomCode();
        GameSessionEntity session = GameSessionEntity.builder()
                .id(CuidUtils.generate())
                .roomCode(roomCode)
                .gameMode(GameMode.KANJI)
                .status(GameSessionStatus.WAITING)
                .jlptLevel(jlptLevel != null ? jlptLevel : JlptLevel.N5)
                .timePerPromptSeconds(timePerPromptSeconds != null ? timePerPromptSeconds : 15)
                .maxRounds(maxRounds != null ? maxRounds : 10)
                .isPrivate(isPrivate != null ? isPrivate : false)
                .currentRoundNumber(0)
                .build();

        GameSessionEntity savedSession = gameSessionRepository.save(session);

        GameParticipantEntity host = GameParticipantEntity.builder()
                .id(CuidUtils.generate())
                .gameSessionId(savedSession.getId())
                .userId(userId)
                .displayName(displayName != null ? displayName : "Host")
                .role(ParticipantRole.HOST)
                .joinedAt(LocalDateTime.now())
                .build();

        GameParticipantEntity savedHost = gameParticipantRepository.save(host);
        savedSession.setHostParticipantId(savedHost.getId());
        return gameSessionRepository.save(savedSession);
    }

    @Transactional
    public GameParticipantEntity joinRoom(String roomCode, String userId, String displayName) {
        GameSessionEntity session = gameSessionRepository.findByRoomCode(roomCode)
                .orElseThrow(() -> new IllegalArgumentException("Room not found"));

        if (session.getStatus() == GameSessionStatus.FINISHED || session.getStatus() == GameSessionStatus.CANCELLED) {
            throw new IllegalStateException("Phòng đấu này đã kết thúc hoặc không còn nhận người chơi mới");
        }

        if (userId != null) {
            var existing = gameParticipantRepository.findByGameSessionIdAndUserId(session.getId(), userId);
            if (existing.isPresent()) return existing.get();
        }

        GameParticipantEntity participant = GameParticipantEntity.builder()
                .id(CuidUtils.generate())
                .gameSessionId(session.getId())
                .userId(userId)
                .displayName(displayName != null ? displayName : "Player")
                .role(ParticipantRole.PLAYER)
                .joinedAt(LocalDateTime.now())
                .build();

        return gameParticipantRepository.save(participant);
    }

    @Transactional
    public GameSessionEntity startSession(String sessionId) {
        GameSessionEntity session = gameSessionRepository.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Session not found"));

        session.setStatus(GameSessionStatus.IN_PROGRESS);
        session.setStartedAt(LocalDateTime.now());
        return gameSessionRepository.save(session);
    }

    @Transactional
    public GameSessionEntity restartSession(String sessionId) {
        GameSessionEntity session = gameSessionRepository.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Session not found"));

        // Clean up old results
        List<GameResultEntity> results = gameResultRepository.findByGameSessionIdOrderByRankAsc(sessionId);
        if (!results.isEmpty()) {
            gameResultRepository.deleteAll(results);
        }

        // Clean up old submissions and rounds for this session to prevent unique constraint conflicts on roundNumber
        List<GameRoundEntity> rounds = gameRoundRepository.findByGameSessionIdOrderByRoundNumberAsc(sessionId);
        for (GameRoundEntity r : rounds) {
            List<GameSubmissionEntity> subs = gameSubmissionRepository.findByGameRoundId(r.getId());
            if (!subs.isEmpty()) {
                gameSubmissionRepository.deleteAll(subs);
            }
        }
        if (!rounds.isEmpty()) {
            gameRoundRepository.deleteAll(rounds);
        }

        session.setStatus(GameSessionStatus.IN_PROGRESS);
        session.setCurrentRoundNumber(0);
        session.setStartedAt(LocalDateTime.now());
        session.setFinishedAt(null);
        return gameSessionRepository.save(session);
    }
}
