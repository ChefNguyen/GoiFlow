package com.goiflow.security;

import com.goiflow.entity.auth.AccountEntity;
import com.goiflow.entity.auth.UserEntity;
import com.goiflow.repository.AccountRepository;
import com.goiflow.repository.UserRepository;
import com.goiflow.util.CuidUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final UserRepository userRepository;
    private final AccountRepository accountRepository;

    @Override
    @Transactional
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oauth2User = super.loadUser(userRequest);
        String provider = userRequest.getClientRegistration().getRegistrationId();
        Map<String, Object> attributes = oauth2User.getAttributes();

        String providerAccountId = (String) attributes.get("sub");
        if (providerAccountId == null) providerAccountId = String.valueOf(attributes.get("id"));

        String email = (String) attributes.get("email");
        String name = (String) attributes.get("name");
        String image = (String) attributes.get("picture");

        UserEntity user = null;
        if (email != null) {
            user = userRepository.findByEmail(email).orElse(null);
        }

        if (user == null) {
            user = UserEntity.builder()
                    .id(CuidUtils.generate())
                    .email(email)
                    .name(name)
                    .image(image)
                    .emailVerified(LocalDateTime.now())
                    .build();
            user = userRepository.save(user);
        }

        var account = accountRepository.findByProviderAndProviderAccountId(provider, providerAccountId);
        if (account.isEmpty()) {
            AccountEntity newAccount = AccountEntity.builder()
                    .id(CuidUtils.generate())
                    .userId(user.getId())
                    .type("oauth")
                    .provider(provider)
                    .providerAccountId(providerAccountId)
                    .accessToken(userRequest.getAccessToken().getTokenValue())
                    .build();
            accountRepository.save(newAccount);
        }

        return oauth2User;
    }
}
