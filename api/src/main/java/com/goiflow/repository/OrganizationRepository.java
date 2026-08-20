package com.goiflow.repository;

import com.goiflow.entity.org.OrganizationEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface OrganizationRepository extends JpaRepository<OrganizationEntity, String> {
    Optional<OrganizationEntity> findBySlug(String slug);
}
