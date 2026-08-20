package com.goiflow.controller;

import com.goiflow.dto.request.AvatarRequest;
import com.goiflow.dto.response.ApiResponse;
import com.goiflow.entity.auth.UserEntity;
import com.goiflow.repository.UserRepository;
import com.goiflow.service.ProfileService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/user")
@RequiredArgsConstructor
public class UserController {

    private final ProfileService profileService;
    private final UserRepository userRepository;

    @GetMapping("/profile")
    public ResponseEntity<?> getProfile(Authentication auth) {
        String userId = auth.getName();
        return ResponseEntity.ok(profileService.getUserProfileStats(userId));
    }

    @PostMapping("/avatar")
    public ResponseEntity<?> updateAvatar(@Valid @RequestBody AvatarRequest req, Authentication auth) {
        String userId = auth.getName();
        UserEntity user = userRepository.findById(userId).orElseThrow();
        user.setImage(req.getImage());
        userRepository.save(user);
        return ResponseEntity.ok(ApiResponse.builder().success(true).message("Avatar updated").build());
    }

    @DeleteMapping("/avatar")
    public ResponseEntity<?> deleteAvatar(Authentication auth) {
        String userId = auth.getName();
        UserEntity user = userRepository.findById(userId).orElseThrow();
        user.setImage(null);
        userRepository.save(user);
        return ResponseEntity.ok(ApiResponse.builder().success(true).message("Avatar deleted").build());
    }
}
