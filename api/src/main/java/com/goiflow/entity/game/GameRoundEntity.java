package com.goiflow.entity.game;

import com.goiflow.entity.content.VocabularyEntryEntity;
import com.goiflow.enums.PromptType;
import com.goiflow.enums.RoundStatus;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "\"GameRound\"",
    uniqueConstraints = @UniqueConstraint(columnNames = {"\"gameSessionId\"", "\"roundNumber\""}))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class GameRoundEntity {
    @Id
    @Column(name = "id", nullable = false)
    private String id;

    @Column(name = "\"gameSessionId\"", nullable = false)
    private String gameSessionId;

    @Column(name = "\"roundNumber\"", nullable = false)
    private Integer roundNumber;

    @Enumerated(EnumType.STRING)
    @org.hibernate.annotations.JdbcType(org.hibernate.dialect.PostgreSQLEnumJdbcType.class)
    @Column(name = "\"status\"", nullable = false)
    @Builder.Default
    private RoundStatus status = RoundStatus.PENDING;

    @Enumerated(EnumType.STRING)
    @org.hibernate.annotations.JdbcType(org.hibernate.dialect.PostgreSQLEnumJdbcType.class)
    @Column(name = "\"promptType\"", nullable = false)
    private PromptType promptType;

    @Column(name = "\"vocabularyEntryId\"")
    private String vocabularyEntryId;

    @Column(name = "\"promptText\"", nullable = false)
    private String promptText;

    @Column(name = "\"startedAt\"")
    private LocalDateTime startedAt;

    @Column(name = "\"resolvedAt\"")
    private LocalDateTime resolvedAt;

    @com.fasterxml.jackson.annotation.JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "\"gameSessionId\"", insertable = false, updatable = false)
    private GameSessionEntity gameSession;

    @com.fasterxml.jackson.annotation.JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "\"vocabularyEntryId\"", insertable = false, updatable = false)
    private VocabularyEntryEntity vocabularyEntry;

    @com.fasterxml.jackson.annotation.JsonIgnore
    @OneToMany(mappedBy = "gameRound", cascade = CascadeType.ALL)
    private List<GameSubmissionEntity> submissions;

    @Column(name = "\"createdAt\"", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "\"updatedAt\"", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() { createdAt = updatedAt = LocalDateTime.now(); }

    @PreUpdate
    protected void onUpdate() { updatedAt = LocalDateTime.now(); }
}
