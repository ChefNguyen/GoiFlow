package com.goiflow.repository;

import com.goiflow.entity.auth.AccountEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface AccountRepository extends JpaRepository<AccountEntity, String> {
    Optional<AccountEntity> findByProviderAndProviderAccountId(String provider, String providerAccountId);
}
