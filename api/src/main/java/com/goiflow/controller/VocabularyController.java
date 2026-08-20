package com.goiflow.controller;

import com.goiflow.entity.content.VocabularyEntryEntity;
import com.goiflow.repository.VocabularyEntryRepository;
import com.goiflow.service.ContentSelectionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/game/vocabulary")
@RequiredArgsConstructor
public class VocabularyController {

    private final VocabularyEntryRepository vocabularyEntryRepository;
    private final ContentSelectionService contentSelectionService;

    @GetMapping("/{id}")
    public ResponseEntity<?> getVocabularyDetail(@PathVariable String id) {
        VocabularyEntryEntity entry = vocabularyEntryRepository.findById(id).orElseThrow();
        Map<String, Object> details = contentSelectionService.toVocabularyHistoryDetails(entry);
        return ResponseEntity.ok(Map.of(
                "vocabularyEntryId", entry.getId(),
                "details", details
        ));
    }
}
