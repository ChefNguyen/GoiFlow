package com.goiflow.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateShiritoriRequest {
    private String displayName;
    @Builder.Default
    private Integer botPlayers = 2;
    @Builder.Default
    private Integer timePerTurn = 15;
    @Builder.Default
    private Boolean isPrivate = false;
    private String userId;
    private String avatarUrl;
}
