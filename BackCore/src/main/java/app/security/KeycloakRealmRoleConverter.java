package app.security;

import org.springframework.core.convert.converter.Converter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.lang.Nullable; // IMPORTANTE: Usa este import

import java.util.*;
import java.util.stream.Collectors;

public class KeycloakRealmRoleConverter implements Converter<Jwt, Collection<GrantedAuthority>> {

    @Override
    @SuppressWarnings("java:S2638")
    // Suprimimos la regla java:S2638 porque el contrato de la interfaz de Spring 
    // es incompatible con la restricción de @NonNullApi de nuestro paquete.
    public Collection<GrantedAuthority> convert(@Nullable Jwt jwt) {

        // Si el JWT es nulo, devolvemos un conjunto vacío de autoridades.
        if (jwt == null) return Collections.emptySet();
        
        // Extraemos el claim "realm_access" del JWT, que contiene los roles del realm.
        Map<String, Object> realmAccess = jwt.getClaim("realm_access");
        if (realmAccess == null) return Collections.emptySet();

        // Extraemos la lista de roles del claim "realm_access". Si no hay roles, devolvemos un conjunto vacío.
        @SuppressWarnings("unchecked")
        Collection<String> roles = (Collection<String>) realmAccess.get("roles");
        if (roles == null) return Collections.emptySet();

        // Convertimos cada rol en una autoridad de Spring Security, prefijando con "ROLE_".
        return roles.stream()
                .map(role -> new SimpleGrantedAuthority("ROLE_" + role))
                .collect(Collectors.toSet());
    }
}