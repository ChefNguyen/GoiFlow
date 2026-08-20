package com.goiflow.repository;

import com.goiflow.entity.game.GameSessionEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface GameSessionRepository extends JpaRepository<GameSessionEntity, String> {

    Optional<GameSessionEntity> findByRoomCode(String roomCode);

    @Modifying
    @Query("UPDATE GameSessionEntity g SET g.currentRoundNumber = :nextRound WHERE g.id = :id AND g.currentRoundNumber = :expectedRound")
    int updateCurrentRoundNumber(@Param("id") String id, @Param("expectedRound") Integer expectedRound, @Param("nextRound") Integer nextRound);
}
