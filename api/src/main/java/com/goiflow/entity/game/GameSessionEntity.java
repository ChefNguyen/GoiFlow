package com.goiflow.entity.game;

import com.goiflow.enums.GameMode;
import com.goiflow.enums.GameSessionStatus;
import com.goiflow.enums.JlptLevel;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "\"GameSession\"")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class GameSessionEntity {
    @Id
    @Column(name = "id", nullable = false)
    private String id;

    @Column(name = "\"roomCode\"", nullable = false, unique = true)
    private String roomCode;

    @Enumerated(EnumType.STRING)
    @org.hibernate.annotations.JdbcType(org.hibernate.dialect.PostgreSQLEnumJdbcType.class)
    @Column(name = "\"gameMode\"", nullable = false)
    @Builder.Default
    private GameMode gameMode = GameMode.KANJI;

    @Enumerated(EnumType.STRING)
    @org.hibernate.annotations.JdbcType(org.hibernate.dialect.PostgreSQLEnumJdbcType.class)
    @Column(name = "\"status\"", nullable = false)
    @Builder.Default
    private GameSessionStatus status = GameSessionStatus.WAITING;

    @Column(name = "\"hostParticipantId\"")
    private String hostParticipantId;

    @Enumerated(EnumType.STRING)
    @org.hibernate.annotations.JdbcType(org.hibernate.dialect.PostgreSQLEnumJdbcType.class)
    @Column(name = "\"jlptLevel\"", nullable = false)
    private JlptLevel jlptLevel;

    @Column(name = "\"timePerPromptSeconds\"", nullable = false)
    private Integer timePerPromptSeconds;

    @Column(name = "\"isPrivate\"", nullable = false)
    @Builder.Default
    private Boolean isPrivate = false;

    @Column(name = "\"maxRounds\"", nullable = false)
    @Builder.Default
    private Integer maxRounds = 10;

    @Column(name = "\"currentRoundNumber\"", nullable = false)
    @Builder.Default
    private Integer currentRoundNumber = 0;

    @OneToMany(mappedBy = "gameSession", cascade = CascadeType.ALL, fetch = FetchType.EAGER)
    private List<GameParticipantEntity> participants;

    @com.fasterxml.jackson.annotation.JsonIgnore
    @OneToMany(mappedBy = "gameSession", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<GameRoundEntity> rounds;

    @com.fasterxml.jackson.annotation.JsonIgnore
    @OneToMany(mappedBy = "gameSession", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<GameResultEntity> results;

    @Column(name = "\"startedAt\"")
    private LocalDateTime startedAt;

    @Column(name = "\"finishedAt\"")
    private LocalDateTime finishedAt;

    @Column(name = "\"createdAt\"", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "\"updatedAt\"", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() { createdAt = updatedAt = LocalDateTime.now(); }

    @PreUpdate
    protected void onUpdate() { updatedAt = LocalDateTime.now(); }
}
