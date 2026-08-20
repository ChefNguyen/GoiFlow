package com.goiflow.security;

import com.goiflow.entity.auth.UserEntity;
import com.goiflow.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Collections;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String idOrEmail) throws UsernameNotFoundException {
        UserEntity user = userRepository.findById(idOrEmail)
                .or(() -> userRepository.findByEmail(idOrEmail))
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + idOrEmail));

        return new User(user.getId(), user.getPasswordHash() != null ? user.getPasswordHash() : "", Collections.emptyList());
    }
}
