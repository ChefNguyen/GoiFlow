package com.goiflow.repository;

import com.goiflow.entity.game.GameParticipantEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface GameParticipantRepository extends JpaRepository<GameParticipantEntity, String> {
    Optional<GameParticipantEntity> findByGameSessionIdAndUserId(String gameSessionId, String userId);
    List<GameParticipantEntity> findByGameSessionId(String gameSessionId);
    List<GameParticipantEntity> findByUserId(String userId);
}
