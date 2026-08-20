package com.goiflow.service;

import com.goiflow.entity.auth.UserEntity;
import com.goiflow.repository.GameParticipantRepository;
import com.goiflow.repository.UserRepository;
import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ProfileService {

    private final UserRepository userRepository;
    private final GameParticipantRepository gameParticipantRepository;

    @Data
    @Builder
    public static class ProfileStats {
        private String userId;
        private String name;
        private String email;
        private String avatarUrl;
        private int level;
        private String rank;
        private int totalXp;
        private int streakDays;
    }

    public int computeLevel(int totalXp) {
        return (int) Math.floor(Math.sqrt(Math.max(0, totalXp) / 100.0)) + 1;
    }

    public String computeRank(int level) {
        if (level >= 50) return "Grand Master";
        if (level >= 30) return "Master";
        if (level >= 20) return "Diamond";
        if (level >= 10) return "Gold";
        if (level >= 5) return "Silver";
        return "Bronze";
    }

    public ProfileStats getUserProfileStats(String userId) {
        UserEntity user = userRepository.findById(userId).orElseThrow(() -> new IllegalArgumentException("User not found"));
        int xp = 500;
        int lvl = computeLevel(xp);
        return ProfileStats.builder()
                .userId(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .avatarUrl(user.getImage())
                .level(lvl)
                .rank(computeRank(lvl))
                .totalXp(xp)
                .streakDays(3)
                .build();
    }
}
