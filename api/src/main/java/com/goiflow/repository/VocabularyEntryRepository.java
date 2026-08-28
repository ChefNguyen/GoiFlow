package com.goiflow.repository;

import com.goiflow.entity.content.VocabularyEntryEntity;
import com.goiflow.enums.ContentSourceName;
import com.goiflow.enums.JlptLevel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface VocabularyEntryRepository extends JpaRepository<VocabularyEntryEntity, String>, JpaSpecificationExecutor<VocabularyEntryEntity> {

    Optional<VocabularyEntryEntity> findBySourceNameAndSourceRecordId(ContentSourceName sourceName, String sourceRecordId);

    @Query(value = "SELECT * FROM \"VocabularyEntry\" WHERE \"jlptLevel\"::text = :#{#level.name()} ORDER BY RANDOM() LIMIT :count", nativeQuery = true)
    List<VocabularyEntryEntity> findRandomByJlptLevel(@Param("level") JlptLevel level, @Param("count") int count);

    @Query("SELECT v FROM VocabularyEntryEntity v WHERE LOWER(v.term) = LOWER(:input) OR LOWER(v.reading) = LOWER(:input)")
    List<VocabularyEntryEntity> findByTermOrReading(@Param("input") String input);

    @Query(value = "SELECT * FROM \"VocabularyEntry\" WHERE \"reading\" NOT LIKE '%ん' AND \"reading\" NOT LIKE '%ン' AND LENGTH(\"reading\") >= 2 ORDER BY RANDOM() LIMIT 1", nativeQuery = true)
    VocabularyEntryEntity findRandomStarterWord();

    @Query(value = "SELECT * FROM \"VocabularyEntry\" WHERE (\"reading\" LIKE CONCAT(:startKana, '%') OR \"term\" LIKE CONCAT(:startKana, '%')) AND \"reading\" NOT LIKE '%ん' ORDER BY RANDOM() LIMIT :limit", nativeQuery = true)
    List<VocabularyEntryEntity> findWordsStartingWith(@Param("startKana") String startKana, @Param("limit") int limit);

    @Query(value = "SELECT * FROM \"VocabularyEntry\" WHERE \"reading\" LIKE CONCAT(:startKana, '%') OR \"term\" LIKE CONCAT(:startKana, '%') ORDER BY RANDOM() LIMIT :limit", nativeQuery = true)
    List<VocabularyEntryEntity> findAllWordsStartingWith(@Param("startKana") String startKana, @Param("limit") int limit);

    long countByJlptLevel(JlptLevel jlptLevel);
}
