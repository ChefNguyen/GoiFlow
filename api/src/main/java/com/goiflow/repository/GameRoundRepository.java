package com.goiflow.repository;

import com.goiflow.entity.game.GameRoundEntity;
import com.goiflow.enums.RoundStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface GameRoundRepository extends JpaRepository<GameRoundEntity, String> {
    Optional<GameRoundEntity> findFirstByGameSessionIdAndStatusOrderByRoundNumberDesc(String gameSessionId, RoundStatus status);
    Optional<GameRoundEntity> findByGameSessionIdAndRoundNumber(String gameSessionId, Integer roundNumber);
    List<GameRoundEntity> findByGameSessionIdOrderByRoundNumberAsc(String gameSessionId);
    List<GameRoundEntity> findByGameSessionIdIn(Collection<String> gameSessionIds);
}
