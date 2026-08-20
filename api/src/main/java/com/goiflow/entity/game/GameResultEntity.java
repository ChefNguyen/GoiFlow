package com.goiflow.entity.game;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "\"GameResult\"",
    uniqueConstraints = @UniqueConstraint(columnNames = {"\"gameSessionId\"", "\"participantId\""}))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class GameResultEntity {
    @Id
    @Column(name = "id", nullable = false)
    private String id;

    @Column(name = "\"gameSessionId\"", nullable = false)
    private String gameSessionId;

    @Column(name = "\"participantId\"", nullable = false)
    private String participantId;

    @Column(name = "rank")
    private Integer rank;

    @Column(name = "\"totalScore\"", nullable = false)
    @Builder.Default
    private Integer totalScore = 0;

    @Column(name = "\"correctCount\"", nullable = false)
    @Builder.Default
    private Integer correctCount = 0;

    @Column(name = "\"averageResponseMs\"")
    private Integer averageResponseMs;

    @com.fasterxml.jackson.annotation.JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "\"gameSessionId\"", insertable = false, updatable = false)
    private GameSessionEntity gameSession;

    @com.fasterxml.jackson.annotation.JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "\"participantId\"", insertable = false, updatable = false)
    private GameParticipantEntity participant;

    @Column(name = "\"createdAt\"", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "\"updatedAt\"", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() { createdAt = updatedAt = LocalDateTime.now(); }

    @PreUpdate
    protected void onUpdate() { updatedAt = LocalDateTime.now(); }
}
