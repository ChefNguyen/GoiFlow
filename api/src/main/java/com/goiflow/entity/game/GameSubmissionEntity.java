package com.goiflow.entity.game;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "\"GameSubmission\"",
    uniqueConstraints = @UniqueConstraint(columnNames = {"\"gameRoundId\"", "\"participantId\""}))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class GameSubmissionEntity {
    @Id
    @Column(name = "id", nullable = false)
    private String id;

    @Column(name = "\"gameRoundId\"", nullable = false)
    private String gameRoundId;

    @Column(name = "\"participantId\"", nullable = false)
    private String participantId;

    @Column(name = "\"rawAnswer\"", nullable = false)
    private String rawAnswer;

    @Column(name = "\"normalizedAnswer\"", nullable = false)
    private String normalizedAnswer;

    @Column(name = "\"attemptCount\"", nullable = false)
    @Builder.Default
    private Integer attemptCount = 1;

    @Column(name = "\"isCorrect\"")
    private Boolean isCorrect;

    @Column(name = "\"scoreAwarded\"", nullable = false)
    @Builder.Default
    private Integer scoreAwarded = 0;

    @Column(name = "\"submittedAt\"", nullable = false)
    private LocalDateTime submittedAt;

    @com.fasterxml.jackson.annotation.JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "\"gameRoundId\"", insertable = false, updatable = false)
    private GameRoundEntity gameRound;

    @com.fasterxml.jackson.annotation.JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "\"participantId\"", insertable = false, updatable = false)
    private GameParticipantEntity participant;

    @Column(name = "\"createdAt\"", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "\"updatedAt\"", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        if (submittedAt == null) submittedAt = LocalDateTime.now();
        createdAt = updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() { updatedAt = LocalDateTime.now(); }
}
