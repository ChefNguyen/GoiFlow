package com.goiflow.config;

import com.goiflow.service.RedisCacheService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class CacheWarmupRunner implements ApplicationRunner {

    private final RedisCacheService redisCacheService;

    @Override
    public void run(ApplicationArguments args) {
        log.info("Checking Redis cache readiness on application startup...");
        redisCacheService.warmUpVocabularyCache();
    }
}
