package com.goiflow.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import java.util.Map;

@Service
public class EmailService {

    @Value("${resend.api-key:}")
    private String resendApiKey;

    @Value("${resend.from:onboarding@resend.dev}")
    private String emailFrom;

    private final RestClient restClient = RestClient.create();

    public void sendOtpEmail(String toEmail, String otpCode) {
        if (resendApiKey == null || resendApiKey.isBlank()) {
            System.out.println("[EmailService] No RESEND_API_KEY set. Simulated OTP send to " + toEmail + ": " + otpCode);
            return;
        }

        try {
            restClient.post()
                .uri("https://api.resend.com/emails")
                .header("Authorization", "Bearer " + resendApiKey)
                .contentType(MediaType.APPLICATION_JSON)
                .body(Map.of(
                    "from", emailFrom,
                    "to", toEmail,
                    "subject", "M? x?c th?c GoiFlow",
                    "html", "<p>M? OTP c?a b?n l?: <strong>" + otpCode + "</strong>. M? n?y c? hi?u l?c trong 5 ph?t.</p>"
                ))
                .retrieve()
                .toBodilessEntity();
        } catch (Exception e) {
            System.err.println("[EmailService] Failed to send email via Resend: " + e.getMessage());
        }
    }
}
