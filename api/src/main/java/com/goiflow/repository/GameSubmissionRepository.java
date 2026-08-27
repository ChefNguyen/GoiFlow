package com.goiflow.repository;

import com.goiflow.entity.game.GameSubmissionEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface GameSubmissionRepository extends JpaRepository<GameSubmissionEntity, String> {
    Optional<GameSubmissionEntity> findByGameRoundIdAndParticipantId(String gameRoundId, String participantId);
    Optional<GameSubmissionEntity> findByGameRoundIdAndParticipantIdAndAttemptCount(String gameRoundId, String participantId, Integer attemptCount);
    List<GameSubmissionEntity> findByGameRoundId(String gameRoundId);
    List<GameSubmissionEntity> findByGameRoundIdIn(Collection<String> gameRoundIds);
    List<GameSubmissionEntity> findByParticipantId(String participantId);
}
