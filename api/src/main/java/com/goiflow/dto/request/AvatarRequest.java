package com.goiflow.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AvatarRequest {
    @NotBlank(message = "Image data URL is required")
    private String image;
}
