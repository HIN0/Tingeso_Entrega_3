package app.utils;

import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component; // NECESARIO para que Spring la gestione

import app.entities.UserEntity;
import app.services.UserService; // NECESARIO para buscar el ID de usuario

@Component // ¡ESTA ES LA ANOTACIÓN FALTANTE QUE RESUELVE EL ERROR!
public class SecurityUtils {

    private final UserService userService;

    // Spring usa este constructor para inyectar UserService
    public SecurityUtils(UserService userService) {
        this.userService = userService;
    }


    /**
     * Extrae el nombre de usuario del JWT y busca el UserEntity completo en la BD para obtener el ID.
     */
    public UserEntity getUserFromAuthentication(Authentication authentication) {
        if (authentication == null || authentication.getPrincipal() == null) {
            throw new IllegalStateException("Usuario no autenticado. El contexto de seguridad es nulo."); 
        }

        if (!(authentication.getPrincipal() instanceof Jwt jwt)) {
            throw new IllegalArgumentException("El Principal esperado no es un JWT.");
        }
        
        // Keycloak usa 'preferred_username' para el nombre de usuario
        String username = jwt.getClaimAsString("preferred_username");

        if (username == null) {
             throw new IllegalStateException("La claim 'preferred_username' no se encontró en el JWT.");
        }

        // Busca el UserEntity por username para obtener el ID de la base de datos (CRÍTICO para Kardex)
        return userService.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User '" + username + "' not found in database."));
    }
}