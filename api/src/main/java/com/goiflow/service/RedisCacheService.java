package com.goiflow.service;

import com.goiflow.entity.content.VocabularyEntryEntity;
import com.goiflow.enums.JlptLevel;
import com.goiflow.repository.VocabularyEntryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.*;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
@RequiredArgsConstructor
public class RedisCacheService {

    private final RedisTemplate<String, Object> redisTemplate;
    private final VocabularyEntryRepository vocabularyEntryRepository;

    private static final String VOCAB_SET_PREFIX = "vocab:set:";
    private static final String VOCAB_ENTRY_PREFIX = "vocab:entry:";
    private static final String SHIRITORI_VALID_WORDS_KEY = "shiritori:valid_words";
    private static final String SHIRITORI_STARTER_WORDS_KEY = "shiritori:starter_words";
    private static final String SHIRITORI_KANA_PREFIX = "shiritori:kana:";

    public boolean isAvailable() {
        try {
            String ping = Objects.requireNonNull(redisTemplate.getConnectionFactory()).getConnection().ping();
            return "PONG".equalsIgnoreCase(ping);
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Get random vocabulary IDs by JLPT level in O(1) via Redis SRANDMEMBER
     */
    public List<String> getRandomVocabIds(JlptLevel level, int count) {
        if (level == null || count <= 0) return List.of();
        try {
            String key = VOCAB_SET_PREFIX + level.name();
            Set<Object> members = redisTemplate.opsForSet().distinctRandomMembers(key, count);
            if (members != null && !members.isEmpty()) {
                return members.stream().map(Object::toString).toList();
            }
        } catch (Exception e) {
            log.warn("Redis error fetching random vocab IDs for level {}: {}", level, e.getMessage());
        }
        return List.of();
    }

    /**
     * Cache vocabulary entry entity for 24 hours
     */
    public void cacheVocabularyEntry(VocabularyEntryEntity entry) {
        if (entry == null || entry.getId() == null) return;
        try {
            String key = VOCAB_ENTRY_PREFIX + entry.getId();
            redisTemplate.opsForValue().set(key, entry, Duration.ofHours(24));
        } catch (Exception e) {
            log.warn("Redis error caching entry {}: {}", entry.getId(), e.getMessage());
        }
    }

    /**
     * Get cached vocabulary entry entity
     */
    public VocabularyEntryEntity getCachedVocabularyEntry(String id) {
        if (id == null || id.isBlank()) return null;
        try {
            String key = VOCAB_ENTRY_PREFIX + id;
            Object val = redisTemplate.opsForValue().get(key);
            if (val instanceof VocabularyEntryEntity entity) {
                return entity;
            }
        } catch (Exception e) {
            log.warn("Redis error reading cached entry {}: {}", id, e.getMessage());
        }
        return null;
    }

    /**
     * Check if word exists in Shiritori dictionary in O(1)
     */
    public Boolean isShiritoriWordValid(String word) {
        if (word == null || word.isBlank()) return false;
        try {
            Boolean exists = redisTemplate.opsForSet().isMember(SHIRITORI_VALID_WORDS_KEY, word.trim().toLowerCase());
            if (Boolean.TRUE.equals(exists)) return true;
        } catch (Exception e) {
            log.warn("Redis error checking Shiritori word {}: {}", word, e.getMessage());
        }
        return null; // Return null on cache miss/error so caller can fallback to DB
    }

    /**
     * Get random starter word ID for Shiritori in O(1)
     */
    public String getRandomStarterWordId() {
        try {
            Object member = redisTemplate.opsForSet().randomMember(SHIRITORI_STARTER_WORDS_KEY);
            if (member != null) return member.toString();
        } catch (Exception e) {
            log.warn("Redis error fetching starter word: {}", e.getMessage());
        }
        return null;
    }

    /**
     * Get words starting with specific kana for Shiritori AI Bot in O(1)
     */
    public List<String> getWordsStartingWith(String startKana, int limit) {
        if (startKana == null || startKana.isBlank()) return List.of();
        try {
            String key = SHIRITORI_KANA_PREFIX + startKana.trim().toLowerCase();
            Set<Object> members = redisTemplate.opsForSet().distinctRandomMembers(key, limit);
            if (members != null && !members.isEmpty()) {
                return members.stream().map(Object::toString).toList();
            }
        } catch (Exception e) {
            log.warn("Redis error fetching words starting with {}: {}", startKana, e.getMessage());
        }
        return List.of();
    }

    /**
     * Preload and warm up all vocabulary entries into Redis Sets for O(1) operations
     */
    @Async
    public void warmUpVocabularyCache() {
        if (!isAvailable()) {
            log.info("Redis is currently not available. Skipping cache warm-up (PostgreSQL fallback will be used).");
            return;
        }

        log.info("🚀 Starting Redis vocabulary cache warm-up...");
        long startTime = System.currentTimeMillis();

        try {
            List<VocabularyEntryEntity> allEntries = vocabularyEntryRepository.findAll();
            if (allEntries.isEmpty()) {
                log.info("No vocabulary entries found in database to warm up.");
                return;
            }

            Map<String, Set<String>> levelSetMap = new HashMap<>();
            Set<String> validWords = new HashSet<>();
            Set<String> starterWordIds = new HashSet<>();
            Map<String, Set<String>> kanaWordMap = new HashMap<>();

            for (VocabularyEntryEntity entry : allEntries) {
                if (entry.getId() == null) continue;

                // Level set
                if (entry.getJlptLevel() != null) {
                    levelSetMap.computeIfAbsent(VOCAB_SET_PREFIX + entry.getJlptLevel().name(), k -> new HashSet<>())
                            .add(entry.getId());
                }

                String term = entry.getTerm() != null ? entry.getTerm().trim().toLowerCase() : "";
                String reading = entry.getReading() != null ? entry.getReading().trim().toLowerCase() : "";

                if (!term.isBlank()) validWords.add(term);
                if (!reading.isBlank()) validWords.add(reading);

                // Starter words (length >= 2 and reading doesn't end with ん / ン)
                if (reading.length() >= 2 && !reading.endsWith("ん") && !reading.endsWith("ン")) {
                    starterWordIds.add(entry.getId());
                }

                // Kana index for Shiritori bot
                if (!reading.isBlank()) {
                    String firstKana = reading.substring(0, 1);
                    kanaWordMap.computeIfAbsent(SHIRITORI_KANA_PREFIX + firstKana, k -> new HashSet<>())
                            .add(entry.getTerm() != null ? entry.getTerm() : reading);
                }
            }

            // Write level sets
            for (Map.Entry<String, Set<String>> entry : levelSetMap.entrySet()) {
                if (!entry.getValue().isEmpty()) {
                    redisTemplate.delete(entry.getKey());
                    redisTemplate.opsForSet().add(entry.getKey(), entry.getValue().toArray());
                    redisTemplate.expire(entry.getKey(), 30, TimeUnit.DAYS);
                }
            }

            // Write Shiritori valid words
            if (!validWords.isEmpty()) {
                redisTemplate.delete(SHIRITORI_VALID_WORDS_KEY);
                redisTemplate.opsForSet().add(SHIRITORI_VALID_WORDS_KEY, validWords.toArray());
                redisTemplate.expire(SHIRITORI_VALID_WORDS_KEY, 30, TimeUnit.DAYS);
            }

            // Write Shiritori starter words
            if (!starterWordIds.isEmpty()) {
                redisTemplate.delete(SHIRITORI_STARTER_WORDS_KEY);
                redisTemplate.opsForSet().add(SHIRITORI_STARTER_WORDS_KEY, starterWordIds.toArray());
                redisTemplate.expire(SHIRITORI_STARTER_WORDS_KEY, 30, TimeUnit.DAYS);
            }

            // Write Kana index sets
            for (Map.Entry<String, Set<String>> entry : kanaWordMap.entrySet()) {
                if (!entry.getValue().isEmpty()) {
                    redisTemplate.delete(entry.getKey());
                    redisTemplate.opsForSet().add(entry.getKey(), entry.getValue().toArray());
                    redisTemplate.expire(entry.getKey(), 30, TimeUnit.DAYS);
                }
            }

            long elapsed = System.currentTimeMillis() - startTime;
            log.info("✅ Redis cache warm-up completed in {}ms. Loaded {} entries across {} levels and {} kana indices.",
                    elapsed, allEntries.size(), levelSetMap.size(), kanaWordMap.size());

        } catch (Exception e) {
            log.warn("⚠️ Error occurred during Redis cache warm-up: {}", e.getMessage());
        }
    }
}
