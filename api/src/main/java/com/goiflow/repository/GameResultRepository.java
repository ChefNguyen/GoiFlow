package com.goiflow.repository;

import com.goiflow.entity.game.GameResultEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface GameResultRepository extends JpaRepository<GameResultEntity, String> {
    List<GameResultEntity> findByGameSessionIdOrderByRankAsc(String gameSessionId);
    Optional<GameResultEntity> findByGameSessionIdAndParticipantId(String gameSessionId, String participantId);
    List<GameResultEntity> findByParticipantUserId(String userId);
}
