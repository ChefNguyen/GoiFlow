package com.goiflow.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class SubmitAnswerRequest {
    @NotBlank(message = "rawAnswer is required")
    private String rawAnswer;
    private String participantId;
    private Integer attemptCount;
}
