package com.goiflow.service;

import com.goiflow.entity.content.AcceptedAnswerEntity;
import com.goiflow.entity.content.VocabularyEntryEntity;
import com.goiflow.entity.game.GameRoundEntity;
import com.goiflow.enums.JlptLevel;
import com.goiflow.enums.PromptType;
import com.goiflow.enums.RoundStatus;
import com.goiflow.repository.VocabularyEntryRepository;
import com.goiflow.util.CuidUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.text.Normalizer;
import java.time.LocalDateTime;
import java.util.*;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class ContentSelectionService {

    private final VocabularyEntryRepository vocabularyEntryRepository;
    private static final Pattern HIRAGANA_PATTERN = Pattern.compile("^[?-?????\\s]+$");

    public String normalizeAnswer(String raw) {
        if (raw == null) return "";
        String normalized = Normalizer.normalize(raw, Normalizer.Form.NFKC);
        return normalized.trim().toLowerCase(Locale.ROOT);
    }

    public boolean isHiraganaOnly(String text) {
        if (text == null || text.isBlank()) return false;
        return HIRAGANA_PATTERN.matcher(text).matches();
    }

    public boolean checkAnswer(String normalizedAnswer, List<String> acceptedValues) {
        if (normalizedAnswer == null || acceptedValues == null) return false;
        return acceptedValues.stream().anyMatch(val -> val.equalsIgnoreCase(normalizedAnswer));
    }

    public GameRoundEntity selectAndCreateNextRound(String sessionId, JlptLevel level, int nextRoundNumber, List<String> excludedVocabIds) {
        List<VocabularyEntryEntity> entries = vocabularyEntryRepository.findRandomByJlptLevel(level, 10);
        VocabularyEntryEntity selected = entries.stream()
                .filter(e -> excludedVocabIds == null || !excludedVocabIds.contains(e.getId()))
                .findFirst()
                .orElse(entries.isEmpty() ? null : entries.get(0));

        PromptType promptType = PromptType.KANJI_TO_READING;
        String promptText = selected != null ? selected.getTerm() : "No vocab available";
        String vocabId = selected != null ? selected.getId() : null;

        return GameRoundEntity.builder()
                .id(CuidUtils.generate())
                .gameSessionId(sessionId)
                .roundNumber(nextRoundNumber)
                .status(RoundStatus.ACTIVE)
                .promptType(promptType)
                .vocabularyEntryId(vocabId)
                .promptText(promptText)
                .startedAt(LocalDateTime.now())
                .build();
    }

    public Map<String, Object> toVocabularyHistoryDetails(VocabularyEntryEntity entry) {
        if (entry == null) return Map.of();
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("meaningsVi", entry.getMeaningsVi() != null ? entry.getMeaningsVi() : List.of());
        map.put("amHanViet", entry.getAmHanViet() != null ? entry.getAmHanViet() : List.of());
        map.put("reading", entry.getReading() != null ? entry.getReading() : "");
        map.put("term", entry.getTerm() != null ? entry.getTerm() : "");
        map.put("kunyomi", List.of());
        map.put("onyomi", List.of());
        return map;
    }
}
