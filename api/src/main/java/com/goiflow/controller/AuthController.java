package com.goiflow.controller;

import com.goiflow.dto.request.LoginRequest;
import com.goiflow.dto.request.OtpRequest;
import com.goiflow.dto.request.RegisterRequest;
import com.goiflow.dto.request.VerifyOtpRequest;
import com.goiflow.dto.response.ApiResponse;
import com.goiflow.dto.response.AuthResponse;
import com.goiflow.entity.auth.UserEntity;
import com.goiflow.repository.UserRepository;
import com.goiflow.security.JwtTokenProvider;
import com.goiflow.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final UserRepository userRepository;
    private final JwtTokenProvider tokenProvider;

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest req) {
        UserEntity user = authService.registerUser(req.getName(), req.getEmail(), req.getPassword());
        String token = tokenProvider.generateToken(user.getId(), user.getEmail(), user.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(
                AuthResponse.builder().token(token).id(user.getId()).name(user.getName()).email(user.getEmail()).build()
        );
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest req) {
        UserEntity user = authService.authenticateUser(req.getEmail(), req.getPassword());
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.builder().success(false).error("Invalid email or password").build());
        }
        String token = tokenProvider.generateToken(user.getId(), user.getEmail(), user.getName());
        return ResponseEntity.ok(
                AuthResponse.builder().token(token).id(user.getId()).name(user.getName()).email(user.getEmail()).build()
        );
    }

    @PostMapping("/request-otp")
    public ResponseEntity<?> requestOtp(@Valid @RequestBody OtpRequest req) {
        UserEntity user = authService.authenticateUser(req.getEmail(), req.getPassword());
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.builder().success(false).error("Invalid email or password").build());
        }
        authService.createAndSendOtp(req.getEmail());
        return ResponseEntity.ok(ApiResponse.builder().success(true).message("OTP sent to " + req.getEmail()).build());
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(@Valid @RequestBody VerifyOtpRequest req) {
        boolean valid = authService.verifyOtp(req.getEmail(), req.getOtp());
        if (!valid) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.builder().success(false).error("Invalid or expired OTP code").build());
        }
        UserEntity user = userRepository.findByEmail(req.getEmail()).orElse(null);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.builder().success(false).error("User not found").build());
        }
        String token = tokenProvider.generateToken(user.getId(), user.getEmail(), user.getName());
        return ResponseEntity.ok(
                AuthResponse.builder().token(token).id(user.getId()).name(user.getName()).email(user.getEmail()).build()
        );
    }
}
