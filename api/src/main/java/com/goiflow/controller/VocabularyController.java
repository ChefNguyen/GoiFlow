package com.goiflow.controller;

import com.goiflow.dto.request.BatchSeedVocabularyRequest;
import com.goiflow.entity.content.AcceptedAnswerEntity;
import com.goiflow.entity.content.VocabularyEntryEntity;
import com.goiflow.enums.ContentSourceName;
import com.goiflow.enums.PromptType;
import com.goiflow.repository.AcceptedAnswerRepository;
import com.goiflow.repository.VocabularyEntryRepository;
import com.goiflow.service.ContentSelectionService;
import com.goiflow.service.RedisCacheService;
import com.goiflow.util.CuidUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/game/vocabulary")
@RequiredArgsConstructor
public class VocabularyController {

    private final VocabularyEntryRepository vocabularyEntryRepository;
    private final AcceptedAnswerRepository acceptedAnswerRepository;
    private final ContentSelectionService contentSelectionService;
    private final RedisCacheService redisCacheService;

    @GetMapping("/{id}")
    @Cacheable(value = "vocabulary_detail", key = "#id", unless = "#result == null")
    public ResponseEntity<?> getVocabularyDetail(@PathVariable String id) {
        VocabularyEntryEntity entry = vocabularyEntryRepository.findById(id).orElseThrow();
        Map<String, Object> details = contentSelectionService.toVocabularyHistoryDetails(entry);
        return ResponseEntity.ok(Map.of(
                "vocabularyEntryId", entry.getId(),
                "details", details
        ));
    }

    @PostMapping("/warmup-cache")
    public ResponseEntity<?> warmupCache() {
        redisCacheService.warmUpVocabularyCache();
        return ResponseEntity.ok(Map.of(
                "status", "initiated",
                "message", "Redis vocabulary cache warm-up initiated asynchronously"
        ));
    }

    @PostMapping("/batch-seed")
    @Transactional
    public ResponseEntity<?> batchSeedVocabulary(@RequestBody BatchSeedVocabularyRequest request) {
        if (request == null || request.getItems() == null || request.getItems().isEmpty()) {
            return ResponseEntity.ok(Map.of("message", "No items to seed", "inserted", 0, "updated", 0));
        }

        int inserted = 0;
        int updated = 0;

        for (BatchSeedVocabularyRequest.VocabularySeedItem item : request.getItems()) {
            if (item.getTerm() == null || item.getTerm().isBlank()) continue;

            VocabularyEntryEntity entry = null;
            if (item.getSourceName() != null && item.getSourceRecordId() != null) {
                entry = vocabularyEntryRepository.findBySourceNameAndSourceRecordId(item.getSourceName(), item.getSourceRecordId()).orElse(null);
            }
            if (entry == null && item.getId() != null) {
                entry = vocabularyEntryRepository.findById(item.getId()).orElse(null);
            }

            boolean isNew = (entry == null);
            if (isNew) {
                entry = new VocabularyEntryEntity();
                entry.setId(item.getId() != null ? item.getId() : CuidUtils.generate());
                entry.setCreatedAt(LocalDateTime.now());
                inserted++;
            } else {
                updated++;
            }

            entry.setTerm(item.getTerm());
            entry.setReading(item.getReading() != null ? item.getReading() : item.getTerm());
            entry.setJlptLevel(item.getJlptLevel());
            entry.setPartOfSpeech(item.getPartOfSpeech());
            entry.setMeaningsVi(item.getMeaningsVi() != null ? item.getMeaningsVi() : List.of());
            entry.setAmHanViet(item.getAmHanViet() != null ? item.getAmHanViet() : List.of());
            entry.setExampleSentence(item.getExampleSentence());
            entry.setExampleSentenceVi(item.getExampleSentenceVi());
            entry.setDifficultyWeight(item.getDifficultyWeight() != null ? item.getDifficultyWeight() : 1);
            entry.setIsCommon(item.getIsCommon() != null ? item.getIsCommon() : true);
            entry.setLessonGroup(item.getLessonGroup());
            entry.setNormalizedSearch(item.getNormalizedSearch() != null ? item.getNormalizedSearch() : item.getTerm().toLowerCase());
            entry.setSourceName(item.getSourceName() != null ? item.getSourceName() : ContentSourceName.JISHO_API);
            entry.setSourceRecordId(item.getSourceRecordId() != null ? item.getSourceRecordId() : entry.getId());
            entry.setImportVersion(item.getImportVersion() != null ? item.getImportVersion() : "2026-08-28");
            entry.setNormalizedAt(LocalDateTime.now());
            entry.setUpdatedAt(LocalDateTime.now());

            VocabularyEntryEntity savedEntry = vocabularyEntryRepository.save(entry);

            // Handle accepted answers
            List<String> answers = item.getAcceptedAnswers();
            if (answers == null || answers.isEmpty()) {
                answers = List.of(entry.getReading());
            }

            for (String ans : answers) {
                if (ans == null || ans.isBlank()) continue;
                String normalizedAns = contentSelectionService.normalizeAnswer(ans);

                AcceptedAnswerEntity answerEntity = AcceptedAnswerEntity.builder()
                        .id(CuidUtils.generate())
                        .promptType(PromptType.KANJI_TO_READING)
                        .normalizedValue(normalizedAns)
                        .displayValue(ans)
                        .vocabularyEntryId(savedEntry.getId())
                        .build();

                try {
                    acceptedAnswerRepository.save(answerEntity);
                } catch (Exception ignored) {
                    // Ignore duplicate accepted answers
                }
            }
        }

        return ResponseEntity.ok(Map.of(
                "status", "success",
                "inserted", inserted,
                "updated", updated,
                "totalProcessed", request.getItems().size()
        ));
    }
}
