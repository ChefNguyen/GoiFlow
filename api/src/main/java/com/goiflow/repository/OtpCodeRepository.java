package com.goiflow.repository;

import com.goiflow.entity.auth.OtpCodeEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface OtpCodeRepository extends JpaRepository<OtpCodeEntity, String> {
    Optional<OtpCodeEntity> findTopByEmailAndUsedAtIsNullOrderByCreatedAtDesc(String email);
    List<OtpCodeEntity> findByEmailAndUsedAtIsNull(String email);
}
