package com.goiflow.repository;

import com.goiflow.entity.org.MembershipEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface MembershipRepository extends JpaRepository<MembershipEntity, String> {
    Optional<MembershipEntity> findByUserIdAndOrganizationId(String userId, String organizationId);
    List<MembershipEntity> findByUserId(String userId);
}
