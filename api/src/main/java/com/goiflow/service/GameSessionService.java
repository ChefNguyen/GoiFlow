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
import com.goiflow.enums.RoundStatus;
import com.goiflow.repository.*;
import com.goiflow.util.CuidUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

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
    public GameSessionEntity createRoom(String userId, String displayName, String avatarUrl, JlptLevel jlptLevel, Integer timePerPromptSeconds, Integer maxRounds, Boolean isPrivate) {
        String effectiveUserId = (userId != null && !userId.isBlank()) ? userId.trim() : null;

        if (effectiveUserId != null) {
            try {
                UserEntity user = userRepository.findById(effectiveUserId).orElse(null);
                if (user == null) {
                    user = UserEntity.builder()
                            .id(effectiveUserId)
                            .name(displayName)
                            .image(avatarUrl)
                            .createdAt(LocalDateTime.now())
                            .updatedAt(LocalDateTime.now())
                            .build();
                } else {
                    if (displayName != null && !displayName.isBlank()) {
                        user.setName(displayName);
                    }
                    if (avatarUrl != null && !avatarUrl.isBlank()) {
                        user.setImage(avatarUrl);
                    }
                    user.setUpdatedAt(LocalDateTime.now());
                }
                userRepository.saveAndFlush(user);
            } catch (Exception e) {
                // If user persistence fails, clear effectiveUserId so foreign key constraint is not violated
                effectiveUserId = null;
            }
        }

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
                .userId(effectiveUserId)
                .displayName(displayName != null ? displayName : "Host")
                .role(ParticipantRole.HOST)
                .joinedAt(LocalDateTime.now())
                .build();

        GameParticipantEntity savedHost = gameParticipantRepository.save(host);
        savedSession.setHostParticipantId(savedHost.getId());
        return gameSessionRepository.save(savedSession);
    }

    @Transactional
    public GameParticipantEntity joinRoom(String roomCode, String userId, String displayName, String avatarUrl) {
        GameSessionEntity session = gameSessionRepository.findByRoomCode(roomCode)
                .orElseThrow(() -> new IllegalArgumentException("Room not found"));

        if (session.getStatus() == GameSessionStatus.FINISHED || session.getStatus() == GameSessionStatus.CANCELLED) {
            throw new IllegalStateException("Phòng đấu này đã kết thúc hoặc không còn nhận người chơi mới");
        }

        String effectiveUserId = (userId != null && !userId.isBlank()) ? userId.trim() : null;

        if (effectiveUserId != null) {
            try {
                UserEntity user = userRepository.findById(effectiveUserId).orElse(null);
                if (user == null) {
                    user = UserEntity.builder()
                            .id(effectiveUserId)
                            .name(displayName)
                            .image(avatarUrl)
                            .createdAt(LocalDateTime.now())
                            .updatedAt(LocalDateTime.now())
                            .build();
                } else {
                    if (displayName != null && !displayName.isBlank()) {
                        user.setName(displayName);
                    }
                    if (avatarUrl != null && !avatarUrl.isBlank()) {
                        user.setImage(avatarUrl);
                    }
                    user.setUpdatedAt(LocalDateTime.now());
                }
                userRepository.saveAndFlush(user);
            } catch (Exception e) {
                effectiveUserId = null;
            }
        }

        if (effectiveUserId != null) {
            var existing = gameParticipantRepository.findByGameSessionIdAndUserId(session.getId(), effectiveUserId);
            if (existing.isPresent()) {
                GameParticipantEntity p = existing.get();
                p.setLeftAt(null); // Re-activate participant on rejoin
                if (displayName != null && !displayName.isBlank()) {
                    p.setDisplayName(displayName);
                }
                // Clear old submissions and results so returning guest starts with 0 points
                List<GameSubmissionEntity> oldSubs = gameSubmissionRepository.findByParticipantId(p.getId());
                if (!oldSubs.isEmpty()) {
                    gameSubmissionRepository.deleteAll(oldSubs);
                }
                Optional<GameResultEntity> oldRes = gameResultRepository.findByGameSessionIdAndParticipantId(session.getId(), p.getId());
                oldRes.ifPresent(gameResultRepository::delete);

                return gameParticipantRepository.save(p);
            }
        }

        GameParticipantEntity participant = GameParticipantEntity.builder()
                .id(CuidUtils.generate())
                .gameSessionId(session.getId())
                .userId(effectiveUserId)
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
    public void leaveSession(String sessionId, String participantId) {
        GameSessionEntity session = gameSessionRepository.findById(sessionId).orElse(null);
        if (session == null) return;

        Optional<GameParticipantEntity> participantOpt = gameParticipantRepository.findById(participantId);
        if (participantOpt.isPresent()) {
            GameParticipantEntity participant = participantOpt.get();
            // If the leaving participant is the HOST, conclude the session for everyone
            if (participantId.equals(session.getHostParticipantId())) {
                session.setStatus(GameSessionStatus.FINISHED);
                session.setFinishedAt(LocalDateTime.now());
                gameSessionRepository.save(session);
            } else {
                // Non-host guest leaving: stamp leftAt timestamp and wipe past submissions so returning to session resets score to 0
                participant.setLeftAt(LocalDateTime.now());
                gameParticipantRepository.save(participant);

                List<GameSubmissionEntity> oldSubs = gameSubmissionRepository.findByParticipantId(participant.getId());
                if (!oldSubs.isEmpty()) {
                    gameSubmissionRepository.deleteAll(oldSubs);
                }
                Optional<GameResultEntity> oldRes = gameResultRepository.findByGameSessionIdAndParticipantId(sessionId, participant.getId());
                oldRes.ifPresent(gameResultRepository::delete);
            }
        }
    }

    @Transactional
    public GameSessionEntity restartSession(String sessionId) {
        return restartSession(sessionId, null);
    }

    @Transactional
    public GameSessionEntity restartSession(String sessionId, String callerParticipantId) {
        GameSessionEntity session = gameSessionRepository.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Session not found"));

        // 1. Clean up old results for this session
        List<GameResultEntity> results = gameResultRepository.findByGameSessionIdOrderByRankAsc(sessionId);
        if (!results.isEmpty()) {
            gameResultRepository.deleteAll(results);
        }

        // 2. Clean up old submissions and rounds to reset word history and scores for the new match
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

        // 3. Transfer Host role to the first participant who returns (callerParticipantId).
        // That person becomes the new HOST with leftAt = null (ACTIVE).
        // All other participants (including the old host) become PLAYER with leftAt = now() (INACTIVE until they play again).
        List<GameParticipantEntity> participants = gameParticipantRepository.findByGameSessionId(sessionId);
        String candidateHostId = callerParticipantId != null ? callerParticipantId : session.getHostParticipantId();
        boolean callerExists = participants.stream().anyMatch(p -> p.getId().equals(candidateHostId));
        String finalHostId = (callerExists || participants.isEmpty()) ? candidateHostId : participants.get(0).getId();

        session.setHostParticipantId(finalHostId);

        for (GameParticipantEntity p : participants) {
            boolean isNewHost = p.getId().equals(finalHostId);
            p.setRole(isNewHost ? ParticipantRole.HOST : ParticipantRole.PLAYER);
            p.setLeftAt(isNewHost ? null : LocalDateTime.now());
            gameParticipantRepository.save(p);
        }

        // 4. Reset session back to round 0 and IN_PROGRESS
        session.setStatus(GameSessionStatus.IN_PROGRESS);
        session.setCurrentRoundNumber(0);
        session.setStartedAt(LocalDateTime.now());
        session.setFinishedAt(null);
        return gameSessionRepository.save(session);
    }
}
