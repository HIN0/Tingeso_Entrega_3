package com.ProyectoTGS.BackCore.Services;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import app.entities.UserEntity;
import app.entities.enums.UserRole;
import app.repositories.UserRepository;
import app.services.UserService;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private UserService userService;

    // =======================================================================
    // MÉTODO: createUser
    // =======================================================================

    @Test
    void createUser_Success() {
        // ARRANGE
        UserEntity userToCreate = UserEntity.builder()
                .username("testuser")
                .password("pass123")
                .role(UserRole.EMPLOYEE)
                .build();
        
        UserEntity savedUser = UserEntity.builder()
                .id(1L) // Simular que la BD asigna un ID
                .username("testuser")
                .password("pass123")
                .role(UserRole.EMPLOYEE)
                .build();

        // Mockeo: Cuando se guarde el usuario, devolver el usuario con ID
        when(userRepository.save(any(UserEntity.class))).thenReturn(savedUser);

        // ACT
        UserEntity result = userService.createUser(userToCreate);

        // ASSERT
        assertNotNull(result);
        assertEquals(1L, result.getId());
        assertEquals("testuser", result.getUsername());
        
        // Verificar que save fue llamado una vez con el objeto correcto
        verify(userRepository, times(1)).save(userToCreate);
    }

    // =======================================================================
    // MÉTODO: findByUsername
    // =======================================================================

    @Test
    void findByUsername_Success_WhenUserExists() {
        // ARRANGE
        String username = "diego";
        UserEntity existingUser = UserEntity.builder()
                .id(2L)
                .username(username)
                .role(UserRole.ADMIN)
                .build();
        
        // Mockeo: El repositorio encuentra al usuario
        when(userRepository.findByUsername(username)).thenReturn(Optional.of(existingUser));

        // ACT
        Optional<UserEntity> resultOptional = userService.findByUsername(username);

        // ASSERT
        assertTrue(resultOptional.isPresent()); // Verificar que el Optional contiene algo
        assertEquals(existingUser, resultOptional.get()); // Verificar que es el usuario correcto
        
        // Verificar que el repositorio fue llamado
        verify(userRepository, times(1)).findByUsername(username);
    }

    @Test
    void findByUsername_ReturnsEmpty_WhenUserNotFound() {
        // ARRANGE
        String username = "usuario_inexistente";
        
        // Mockeo: El repositorio NO encuentra al usuario
        when(userRepository.findByUsername(username)).thenReturn(Optional.empty());

        // ACT
        Optional<UserEntity> resultOptional = userService.findByUsername(username);

        // ASSERT
        assertTrue(resultOptional.isEmpty()); // Verificar que el Optional está vacío
        
        // Verificar que el repositorio fue llamado
        verify(userRepository, times(1)).findByUsername(username);
    }
}