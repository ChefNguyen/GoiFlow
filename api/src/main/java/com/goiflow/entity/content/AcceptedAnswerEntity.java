package com.goiflow.entity.content;

import com.goiflow.enums.PromptType;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "\"AcceptedAnswer\"",
    uniqueConstraints = @UniqueConstraint(
        columnNames = {"\"vocabularyEntryId\"", "\"promptType\"", "\"normalizedValue\""}))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AcceptedAnswerEntity {
    @Id
    @Column(name = "id", nullable = false)
    private String id;

    @Enumerated(EnumType.STRING)
    @org.hibernate.annotations.JdbcType(org.hibernate.dialect.PostgreSQLEnumJdbcType.class)
    @Column(name = "\"promptType\"", nullable = false)
    private PromptType promptType;

    @Column(name = "\"normalizedValue\"", nullable = false)
    private String normalizedValue;

    @Column(name = "\"displayValue\"", nullable = false)
    private String displayValue;

    @Column(name = "\"vocabularyEntryId\"")
    private String vocabularyEntryId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "\"vocabularyEntryId\"", insertable = false, updatable = false)
    private VocabularyEntryEntity vocabularyEntry;

    @Column(name = "\"createdAt\"", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "\"updatedAt\"", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() { createdAt = updatedAt = LocalDateTime.now(); }

    @PreUpdate
    protected void onUpdate() { updatedAt = LocalDateTime.now(); }
}
