package com.goiflow.entity.game;

import com.goiflow.entity.auth.UserEntity;
import com.goiflow.enums.ParticipantRole;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "\"GameParticipant\"",
    uniqueConstraints = @UniqueConstraint(columnNames = {"\"gameSessionId\"", "\"userId\""}))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class GameParticipantEntity {
    @Id
    @Column(name = "id", nullable = false)
    private String id;

    @Column(name = "\"gameSessionId\"", nullable = false)
    private String gameSessionId;

    @Column(name = "\"userId\"")
    private String userId;

    @Column(name = "\"displayName\"", nullable = false)
    private String displayName;

    @Enumerated(EnumType.STRING)
    @org.hibernate.annotations.JdbcType(org.hibernate.dialect.PostgreSQLEnumJdbcType.class)
    @Column(name = "\"role\"", nullable = false)
    @Builder.Default
    private ParticipantRole role = ParticipantRole.PLAYER;

    @Column(name = "\"joinedAt\"", nullable = false)
    private LocalDateTime joinedAt;

    @com.fasterxml.jackson.annotation.JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "\"gameSessionId\"", insertable = false, updatable = false)
    private GameSessionEntity gameSession;

    @com.fasterxml.jackson.annotation.JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "\"userId\"", insertable = false, updatable = false)
    private UserEntity user;

    @com.fasterxml.jackson.annotation.JsonIgnore
    @OneToMany(mappedBy = "participant", cascade = CascadeType.ALL)
    private List<GameSubmissionEntity> submissions;

    @com.fasterxml.jackson.annotation.JsonIgnore
    @OneToMany(mappedBy = "participant", cascade = CascadeType.ALL)
    private List<GameResultEntity> results;

    @Column(name = "\"createdAt\"", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "\"updatedAt\"", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        if (joinedAt == null) joinedAt = LocalDateTime.now();
        createdAt = updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() { updatedAt = LocalDateTime.now(); }
}
