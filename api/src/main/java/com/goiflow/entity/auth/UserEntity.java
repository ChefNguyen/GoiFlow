package com.goiflow.entity.auth;

import com.goiflow.entity.game.GameParticipantEntity;
import com.goiflow.entity.org.MembershipEntity;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "\"User\"")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class UserEntity {
    @Id
    @Column(name = "id", nullable = false)
    private String id;

    @Column(name = "name")
    private String name;

    @Column(name = "email", unique = true)
    private String email;

    @Column(name = "\"emailVerified\"")
    private LocalDateTime emailVerified;

    @Column(name = "image", columnDefinition = "text")
    private String image;

    @com.fasterxml.jackson.annotation.JsonIgnore
    @Column(name = "\"passwordHash\"", columnDefinition = "text")
    private String passwordHash;

    @com.fasterxml.jackson.annotation.JsonIgnore
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL)
    private List<AccountEntity> accounts;

    @com.fasterxml.jackson.annotation.JsonIgnore
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL)
    private List<SessionEntity> sessions;

    @com.fasterxml.jackson.annotation.JsonIgnore
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL)
    private List<MembershipEntity> memberships;

    @com.fasterxml.jackson.annotation.JsonIgnore
    @OneToMany(mappedBy = "user")
    private List<GameParticipantEntity> gameParticipants;

    @Column(name = "\"createdAt\"", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "\"updatedAt\"", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() { createdAt = updatedAt = LocalDateTime.now(); }

    @PreUpdate
    protected void onUpdate() { updatedAt = LocalDateTime.now(); }
}
