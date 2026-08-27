package com.goiflow.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JoinShiritoriRequest {
    private String roomCode;
    private String displayName;
    private String userId;
    private String avatarUrl;
}
