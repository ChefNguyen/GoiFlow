package com.goiflow.controller;

import com.goiflow.enums.JlptLevel;
import com.goiflow.service.LibraryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/library")
@RequiredArgsConstructor
public class LibraryController {

    private final LibraryService libraryService;

    @GetMapping
    public ResponseEntity<?> getLibrary(
            @RequestParam(required = false) List<JlptLevel> levels,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int limit) {
        return ResponseEntity.ok(libraryService.getLibraryPage(levels, search, page, limit));
    }
}
