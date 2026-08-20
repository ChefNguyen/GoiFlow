package com.goiflow.entity.auth;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "\"Account\"",
    uniqueConstraints = @UniqueConstraint(columnNames = {"provider", "\"providerAccountId\""}))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AccountEntity {
    @Id
    @Column(name = "id", nullable = false)
    private String id;

    @Column(name = "\"userId\"", nullable = false)
    private String userId;

    @Column(name = "type", nullable = false)
    private String type;

    @Column(name = "provider", nullable = false)
    private String provider;

    @Column(name = "\"providerAccountId\"", nullable = false)
    private String providerAccountId;

    @Column(name = "refresh_token", columnDefinition = "text")
    private String refreshToken;

    @Column(name = "access_token", columnDefinition = "text")
    private String accessToken;

    @Column(name = "expires_at")
    private Integer expiresAt;

    @Column(name = "token_type")
    private String tokenType;

    @Column(name = "scope")
    private String scope;

    @Column(name = "id_token", columnDefinition = "text")
    private String idToken;

    @Column(name = "session_state")
    private String sessionState;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "\"userId\"", insertable = false, updatable = false)
    private UserEntity user;
}
