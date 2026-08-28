package com.goiflow.dto.request;

import com.goiflow.enums.ContentSourceName;
import com.goiflow.enums.JlptLevel;
import lombok.*;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BatchSeedVocabularyRequest {

    private List<VocabularySeedItem> items;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class VocabularySeedItem {
        private String id;
        private String term;
        private String reading;
        private JlptLevel jlptLevel;
        private String partOfSpeech;
        private List<String> meaningsVi;
        private List<String> amHanViet;
        private String exampleSentence;
        private String exampleSentenceVi;
        private Integer difficultyWeight;
        private Boolean isCommon;
        private String lessonGroup;
        private String normalizedSearch;
        private ContentSourceName sourceName;
        private String sourceRecordId;
        private String importVersion;
        private List<String> acceptedAnswers;
    }
}
