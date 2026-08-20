package com.goiflow.entity.org;

import com.goiflow.entity.auth.UserEntity;
import com.goiflow.enums.OrganizationRole;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "\"Membership\"",
    uniqueConstraints = @UniqueConstraint(columnNames = {"\"userId\"", "\"organizationId\""}))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class MembershipEntity {
    @Id
    @Column(name = "id", nullable = false)
    private String id;

    @Enumerated(EnumType.STRING)
    @org.hibernate.annotations.JdbcType(org.hibernate.dialect.PostgreSQLEnumJdbcType.class)
    @Column(name = "\"role\"", nullable = false)
    @Builder.Default
    private OrganizationRole role = OrganizationRole.MEMBER;

    @Column(name = "\"userId\"", nullable = false)
    private String userId;

    @Column(name = "\"organizationId\"", nullable = false)
    private String organizationId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "\"userId\"", insertable = false, updatable = false)
    private UserEntity user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "\"organizationId\"", insertable = false, updatable = false)
    private OrganizationEntity organization;

    @Column(name = "\"createdAt\"", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "\"updatedAt\"", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() { createdAt = updatedAt = LocalDateTime.now(); }

    @PreUpdate
    protected void onUpdate() { updatedAt = LocalDateTime.now(); }
}
