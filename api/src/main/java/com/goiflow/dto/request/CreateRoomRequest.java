package com.goiflow.dto.request;

import com.goiflow.enums.JlptLevel;
import lombok.Data;

@Data
public class CreateRoomRequest {
    private JlptLevel jlptLevel = JlptLevel.N5;
    private Integer timePerPromptSeconds = 15;
    private Integer maxRounds = 10;
    private Boolean isPrivate = false;
    private String hostDisplayName;
    private String displayName;
    private String userId;
    private String avatarUrl;
}
