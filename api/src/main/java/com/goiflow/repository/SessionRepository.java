package com.goiflow.repository;

import com.goiflow.entity.auth.SessionEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface SessionRepository extends JpaRepository<SessionEntity, String> {
    Optional<SessionEntity> findBySessionToken(String sessionToken);
}
