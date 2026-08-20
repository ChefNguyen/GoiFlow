package com.goiflow.service;

import com.goiflow.entity.auth.OtpCodeEntity;
import com.goiflow.entity.auth.UserEntity;
import com.goiflow.repository.OtpCodeRepository;
import com.goiflow.repository.UserRepository;
import com.goiflow.util.CuidUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final OtpCodeRepository otpCodeRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private static final SecureRandom RANDOM = new SecureRandom();

    @Transactional
    public UserEntity registerUser(String name, String email, String password) {
        if (userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("Email already exists");
        }

        String passwordHash = passwordEncoder.encode(password);
        UserEntity user = UserEntity.builder()
                .id(CuidUtils.generate())
                .name(name)
                .email(email)
                .passwordHash(passwordHash)
                .build();

        return userRepository.save(user);
    }

    public UserEntity authenticateUser(String email, String password) {
        UserEntity user = userRepository.findByEmail(email).orElse(null);
        if (user == null || user.getPasswordHash() == null) {
            return null;
        }
        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            return null;
        }
        return user;
    }

    @Transactional
    public String createAndSendOtp(String email) {
        String code = String.format("%06d", RANDOM.nextInt(1000000));
        OtpCodeEntity otp = OtpCodeEntity.builder()
                .id(CuidUtils.generate())
                .email(email)
                .code(code)
                .expiresAt(LocalDateTime.now().plusMinutes(5))
                .build();

        otpCodeRepository.save(otp);
        emailService.sendOtpEmail(email, code);
        return code;
    }

    @Transactional
    public boolean verifyOtp(String email, String code) {
        OtpCodeEntity otp = otpCodeRepository.findTopByEmailAndUsedAtIsNullOrderByCreatedAtDesc(email).orElse(null);
        if (otp == null) return false;
        if (otp.getExpiresAt().isBefore(LocalDateTime.now())) return false;
        if (!otp.getCode().equals(code)) return false;

        otp.setUsedAt(LocalDateTime.now());
        otpCodeRepository.save(otp);
        return true;
    }
}
