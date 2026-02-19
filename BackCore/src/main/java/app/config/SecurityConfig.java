package app.config;

import app.security.KeycloakRealmRoleConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private static final String ROLE_ADMIN = "ADMIN";
    private static final String ROLE_EMPLOYEE = "USER";
    private static final String TOOLS_PATH = "/tools/**";

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    JwtAuthenticationConverter jwtAuthConverter = new JwtAuthenticationConverter();
    jwtAuthConverter.setJwtGrantedAuthoritiesConverter(new KeycloakRealmRoleConverter());

    http
        // Mover .cors() al principio para asegurar que se procese antes que la autorización
        .cors(cors -> cors.configurationSource(corsConfigurationSource()))
        .csrf(AbstractHttpConfigurer::disable)
        .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
        .authorizeHttpRequests(auth -> auth
            // Permitir explícitamente el pre-flight de CORS para todas las rutas
            .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
            
            // Reglas de negocio
            .requestMatchers(HttpMethod.GET, "/loans/**", TOOLS_PATH).hasAnyRole(ROLE_ADMIN, ROLE_EMPLOYEE)
            .requestMatchers(HttpMethod.POST,   TOOLS_PATH).hasRole(ROLE_ADMIN)
            .requestMatchers(HttpMethod.PUT,    TOOLS_PATH).hasRole(ROLE_ADMIN)
            .requestMatchers(HttpMethod.PATCH,  TOOLS_PATH).hasRole(ROLE_ADMIN)
            .requestMatchers(HttpMethod.DELETE, TOOLS_PATH).hasRole(ROLE_ADMIN)
            .requestMatchers("/tariffs/**", "/clients/**").hasRole(ROLE_ADMIN)
            .requestMatchers("/kardex/**", "/returns/**", "/reports/**").hasAnyRole(ROLE_ADMIN, ROLE_EMPLOYEE)
            .requestMatchers("/users/**").hasRole(ROLE_ADMIN)

            .anyRequest().authenticated()
        )
        .oauth2ResourceServer(oauth2 -> oauth2
            .jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAuthConverter))
        );

    return http.build();
}

    // 2. CAMBIO: Configuración CORS simple y directa en el mismo archivo
    @Bean
    CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of("http://localhost:5173")); // Tu React
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        configuration.setAllowedHeaders(List.of("*")); // Permitir todo header
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}