package com.ProyectoTGS.BackCore;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtException;

import java.time.Instant;
import java.util.Collections;
import java.util.Map;

@TestConfiguration
public class TestSecurityConfig {

    @Bean
    public JwtDecoder jwtDecoder() {
        return new JwtDecoder() {
            @Override
            public Jwt decode(String token) throws JwtException {
                return new Jwt(
                    "token",
                    Instant.now(),
                    Instant.now().plusSeconds(30),
                    Map.of("alg", "none"),
                    Collections.singletonMap("scope", "read")
                );
            }
        };
    }
}