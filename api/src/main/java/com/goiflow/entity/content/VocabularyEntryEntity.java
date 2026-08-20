package com.goiflow.entity.content;

import com.goiflow.enums.ContentSourceName;
import com.goiflow.enums.JlptLevel;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "\"VocabularyEntry\"",
    uniqueConstraints = @UniqueConstraint(columnNames = {"\"sourceName\"", "\"sourceRecordId\""}))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class VocabularyEntryEntity {
    @Id
    @Column(name = "id", nullable = false)
    private String id;

    @Column(name = "term", nullable = false)
    private String term;

    @Column(name = "reading", nullable = false)
    private String reading;

    @Enumerated(EnumType.STRING)
    @org.hibernate.annotations.JdbcType(org.hibernate.dialect.PostgreSQLEnumJdbcType.class)
    @Column(name = "\"jlptLevel\"", nullable = false)
    private JlptLevel jlptLevel;

    @Column(name = "\"partOfSpeech\"")
    private String partOfSpeech;

    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(name = "\"meaningsVi\"", columnDefinition = "text[]")
    private List<String> meaningsVi;

    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(name = "\"amHanViet\"", columnDefinition = "text[]")
    private List<String> amHanViet;

    @Column(name = "\"exampleSentence\"", columnDefinition = "text")
    private String exampleSentence;

    @Column(name = "\"exampleSentenceVi\"", columnDefinition = "text")
    private String exampleSentenceVi;

    @Column(name = "\"difficultyWeight\"", nullable = false)
    @Builder.Default
    private Integer difficultyWeight = 1;

    @Column(name = "\"isCommon\"", nullable = false)
    @Builder.Default
    private Boolean isCommon = false;

    @Column(name = "\"lessonGroup\"")
    private String lessonGroup;

    @Column(name = "\"normalizedSearch\"", nullable = false)
    private String normalizedSearch;

    @Enumerated(EnumType.STRING)
    @org.hibernate.annotations.JdbcType(org.hibernate.dialect.PostgreSQLEnumJdbcType.class)
    @Column(name = "\"sourceName\"", nullable = false)
    private ContentSourceName sourceName;

    @Column(name = "\"sourceRecordId\"", nullable = false)
    private String sourceRecordId;

    @Column(name = "\"importVersion\"", nullable = false)
    private String importVersion;

    @Column(name = "\"normalizedAt\"", nullable = false)
    private LocalDateTime normalizedAt;

    @com.fasterxml.jackson.annotation.JsonIgnore
    @OneToMany(mappedBy = "vocabularyEntry", cascade = CascadeType.ALL)
    private List<AcceptedAnswerEntity> acceptedAnswers;

    @Column(name = "\"createdAt\"", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "\"updatedAt\"", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() { createdAt = updatedAt = LocalDateTime.now(); }

    @PreUpdate
    protected void onUpdate() { updatedAt = LocalDateTime.now(); }
}
