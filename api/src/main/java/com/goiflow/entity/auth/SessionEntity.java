package com.goiflow.entity.auth;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "\"Session\"")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class SessionEntity {
    @Id
    @Column(name = "id", nullable = false)
    private String id;

    @Column(name = "\"sessionToken\"", nullable = false, unique = true)
    private String sessionToken;

    @Column(name = "\"userId\"", nullable = false)
    private String userId;

    @Column(name = "expires", nullable = false)
    private LocalDateTime expires;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "\"userId\"", insertable = false, updatable = false)
    private UserEntity user;
}
