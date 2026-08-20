package com.goiflow.service;

import com.goiflow.entity.content.VocabularyEntryEntity;
import com.goiflow.enums.JlptLevel;
import com.goiflow.repository.VocabularyEntryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class LibraryService {

    private final VocabularyEntryRepository vocabularyEntryRepository;

    public Page<VocabularyEntryEntity> getLibraryPage(List<JlptLevel> levels, String search, int page, int limit) {
        Pageable pageable = PageRequest.of(Math.max(0, page - 1), limit, Sort.by("jlptLevel").ascending().and(Sort.by("term").ascending()));
        Specification<VocabularyEntryEntity> spec = Specification.where(null);

        if (levels != null && !levels.isEmpty()) {
            spec = spec.and((root, query, cb) -> root.get("jlptLevel").in(levels));
        }

        if (search != null && !search.isBlank()) {
            String lowerSearch = search.trim().toLowerCase();
            spec = spec.and((root, query, cb) -> cb.or(
                    cb.like(cb.lower(root.get("term")), "%" + lowerSearch + "%"),
                    cb.like(cb.lower(root.get("reading")), "%" + lowerSearch + "%")
            ));
        }

        return vocabularyEntryRepository.findAll(spec, pageable);
    }
}
