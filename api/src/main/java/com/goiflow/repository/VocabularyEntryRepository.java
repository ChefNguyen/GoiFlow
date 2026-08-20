package com.goiflow.repository;

import com.goiflow.entity.content.VocabularyEntryEntity;
import com.goiflow.enums.JlptLevel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface VocabularyEntryRepository extends JpaRepository<VocabularyEntryEntity, String>, JpaSpecificationExecutor<VocabularyEntryEntity> {

    @Query(value = "SELECT * FROM \"VocabularyEntry\" WHERE \"jlptLevel\"::text = :#{#level.name()} ORDER BY RANDOM() LIMIT :count", nativeQuery = true)
    List<VocabularyEntryEntity> findRandomByJlptLevel(@Param("level") JlptLevel level, @Param("count") int count);

    long countByJlptLevel(JlptLevel jlptLevel);
}
