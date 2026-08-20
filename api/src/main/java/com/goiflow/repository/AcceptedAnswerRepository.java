package com.goiflow.repository;

import com.goiflow.entity.content.AcceptedAnswerEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface AcceptedAnswerRepository extends JpaRepository<AcceptedAnswerEntity, String> {
    List<AcceptedAnswerEntity> findByVocabularyEntryId(String vocabularyEntryId);
}
