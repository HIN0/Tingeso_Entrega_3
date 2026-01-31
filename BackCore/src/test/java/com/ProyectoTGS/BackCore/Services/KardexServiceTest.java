package com.ProyectoTGS.BackCore.Services;

import entities.KardexEntity;
import entities.ToolEntity;
import entities.UserEntity;
import entities.enums.MovementType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import repositories.KardexRepository;
import repositories.ToolRepository;
import services.KardexService;
import app.exceptions.ResourceNotFoundException;

import java.time.LocalDateTime;
import java.util.Collections; 
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class KardexServiceTest {

    @Mock
    private KardexRepository kardexRepository;

    @Mock // Añadir Mock para ToolRepository
    private ToolRepository toolRepository;

    @InjectMocks
    private KardexService kardexService;

    private ToolEntity testTool;
    private ToolEntity toolWithoutId;
    private UserEntity testUser;

    @BeforeEach
    void setUp() {
        testTool = ToolEntity.builder().id(1L).name("Test Tool").build();
        toolWithoutId = ToolEntity.builder().name("Tool No ID").build(); // Para probar validaciones
        testUser = UserEntity.builder().id(10L).username("test_user").build();
    }

    // =======================================================================
    // MÉTODO: registerMovement
    // =======================================================================

    @Test
    void registerMovement_Success() {
        // ARRANGE: Simular que la herramienta existe
        when(toolRepository.existsById(testTool.getId())).thenReturn(true);

        // ACT
        kardexService.registerMovement(testTool, MovementType.INCOME, 5, testUser);

        // ASSERT: Verifica que el repositorio fue llamado con la entidad Kardex correcta
        verify(kardexRepository, times(1)).save(
            argThat(kardex ->
                kardex.getTool().equals(testTool) &&
                kardex.getType().equals(MovementType.INCOME) &&
                kardex.getQuantity().equals(5) &&
                kardex.getUser().equals(testUser) &&
                kardex.getMovementDate() != null // Verificar que se asigna fecha
            )
        );
    }

    @Test
    void registerMovement_FailsWhenToolIsNull() {
        // ACT & ASSERT: Debe fallar si la herramienta es nula
        assertThrows(ResourceNotFoundException.class, () -> {
            kardexService.registerMovement(null, MovementType.INCOME, 1, testUser);
        }, "Debe lanzar ResourceNotFoundException si Tool es null.");
        verify(kardexRepository, never()).save(any()); // No debe intentar guardar
    }

     @Test
    void registerMovement_FailsWhenToolIdIsNull() {
        // ACT & ASSERT: Debe fallar si el ID de la herramienta es nulo
        assertThrows(ResourceNotFoundException.class, () -> {
            kardexService.registerMovement(toolWithoutId, MovementType.INCOME, 1, testUser);
        }, "Debe lanzar ResourceNotFoundException si Tool ID es null.");
        verify(kardexRepository, never()).save(any()); // No debe intentar guardar
    }


    @Test
    void registerMovement_FailsWhenToolDoesNotExistInRepo() {
        // ARRANGE: Simular que la herramienta NO existe en la BD
        when(toolRepository.existsById(testTool.getId())).thenReturn(false);

        // ACT & ASSERT
        assertThrows(ResourceNotFoundException.class, () -> {
            kardexService.registerMovement(testTool, MovementType.INCOME, 1, testUser);
        }, "Debe lanzar ResourceNotFoundException si la herramienta no existe.");
        verify(kardexRepository, never()).save(any()); // No debe intentar guardar
    }

    // =======================================================================
    // MÉTODO: getMovementsByTool
    // =======================================================================

    @Test
    void getMovementsByTool_Success() {
        // ARRANGE
        KardexEntity movement1 = KardexEntity.builder().id(1L).tool(testTool).type(MovementType.LOAN).build();
        KardexEntity movement2 = KardexEntity.builder().id(2L).tool(testTool).type(MovementType.RETURN).build();

        when(kardexRepository.findByTool_Id(testTool.getId())).thenReturn(List.of(movement1, movement2));

        // ACT
        List<KardexEntity> result = kardexService.getMovementsByTool(testTool);

        // ASSERT
        assertEquals(2, result.size());
        verify(kardexRepository, times(1)).findByTool_Id(1L);
    }

    @Test
    void getMovementsByTool_FailsWhenToolIsNull() {
        // ACT & ASSERT
        assertThrows(IllegalArgumentException.class, () -> {
            kardexService.getMovementsByTool(null);
        }, "Debe lanzar IllegalArgumentException si Tool es null.");
        verify(kardexRepository, never()).findByTool_Id(any());
    }

    @Test
    void getMovementsByTool_FailsWhenToolIdIsNull() {
        // ACT & ASSERT
        assertThrows(IllegalArgumentException.class, () -> {
            kardexService.getMovementsByTool(toolWithoutId);
        }, "Debe lanzar IllegalArgumentException si Tool ID es null.");
        verify(kardexRepository, never()).findByTool_Id(any());
    }

    // =======================================================================
    // MÉTODO: getMovementsByToolId
    // =======================================================================

    @Test
    void getMovementsByToolId_Success() {
        // ARRANGE
        Long toolId = 1L;
        KardexEntity movement1 = KardexEntity.builder().id(1L).tool(testTool).type(MovementType.LOAN).build();
        when(toolRepository.existsById(toolId)).thenReturn(true); // La herramienta existe
        when(kardexRepository.findByTool_Id(toolId)).thenReturn(List.of(movement1));

        // ACT
        List<KardexEntity> result = kardexService.getMovementsByToolId(toolId);

        // ASSERT
        assertEquals(1, result.size());
        verify(toolRepository, times(1)).existsById(toolId);
        verify(kardexRepository, times(1)).findByTool_Id(toolId);
    }

     @Test
    void getMovementsByToolId_ReturnsEmptyListWhenNoMovements() {
        // ARRANGE
        Long toolId = 1L;
        when(toolRepository.existsById(toolId)).thenReturn(true); // La herramienta existe
        when(kardexRepository.findByTool_Id(toolId)).thenReturn(Collections.emptyList()); // No hay movimientos

        // ACT
        List<KardexEntity> result = kardexService.getMovementsByToolId(toolId);

        // ASSERT
        assertTrue(result.isEmpty());
        verify(toolRepository, times(1)).existsById(toolId);
        verify(kardexRepository, times(1)).findByTool_Id(toolId);
    }

    @Test
    void getMovementsByToolId_FailsWhenToolIdIsNull() {
        // ACT & ASSERT
        assertThrows(IllegalArgumentException.class, () -> {
            kardexService.getMovementsByToolId(null);
        }, "Debe lanzar IllegalArgumentException si Tool ID es null.");
        verify(toolRepository, never()).existsById(any());
        verify(kardexRepository, never()).findByTool_Id(any());
    }

    @Test
    void getMovementsByToolId_FailsWhenToolDoesNotExist() {
        // ARRANGE
        Long toolId = 99L;
        when(toolRepository.existsById(toolId)).thenReturn(false); // La herramienta NO existe

        // ACT & ASSERT
        assertThrows(ResourceNotFoundException.class, () -> {
            kardexService.getMovementsByToolId(toolId);
        }, "Debe lanzar ResourceNotFoundException si la herramienta no existe.");
        verify(toolRepository, times(1)).existsById(toolId); // Verifica que se chequeó la existencia
        verify(kardexRepository, never()).findByTool_Id(any()); // No debe intentar buscar movimientos
    }


    // =======================================================================
    // MÉTODO: getMovementsByDate
    // =======================================================================

    @Test
    void getMovementsByDate_Success() {
        // ARRANGE
        LocalDateTime start = LocalDateTime.now().minusDays(1);
        LocalDateTime end = LocalDateTime.now();
        KardexEntity movement = KardexEntity.builder().id(3L).movementDate(start.plusHours(1)).build();

        when(kardexRepository.findByMovementDateBetween(start, end)).thenReturn(List.of(movement));

        // ACT
        List<KardexEntity> result = kardexService.getMovementsByDate(start, end);

        // ASSERT
        assertEquals(1, result.size());
        verify(kardexRepository, times(1)).findByMovementDateBetween(start, end);
    }

     @Test
    void getMovementsByDate_ReturnsEmptyListWhenNoMovementsInDateRange() {
        // ARRANGE
        LocalDateTime start = LocalDateTime.now().minusDays(1);
        LocalDateTime end = LocalDateTime.now();
        when(kardexRepository.findByMovementDateBetween(start, end)).thenReturn(Collections.emptyList());

        // ACT
        List<KardexEntity> result = kardexService.getMovementsByDate(start, end);

        // ASSERT
        assertTrue(result.isEmpty());
        verify(kardexRepository, times(1)).findByMovementDateBetween(start, end);
    }

    @Test
    void getMovementsByDate_FailsWhenStartDateIsNull() {
        // ACT & ASSERT
        assertThrows(IllegalArgumentException.class, () -> {
            kardexService.getMovementsByDate(null, LocalDateTime.now());
        }, "Debe lanzar IllegalArgumentException si startDate es null.");
        verify(kardexRepository, never()).findByMovementDateBetween(any(), any());
    }

    @Test
    void getMovementsByDate_FailsWhenEndDateIsNull() {
        // ACT & ASSERT
        assertThrows(IllegalArgumentException.class, () -> {
            kardexService.getMovementsByDate(LocalDateTime.now(), null);
        }, "Debe lanzar IllegalArgumentException si endDate es null.");
        verify(kardexRepository, never()).findByMovementDateBetween(any(), any());
    }

    @Test
    void getMovementsByDate_FailsWhenEndDateIsBeforeStartDate() {
        // ARRANGE
        LocalDateTime start = LocalDateTime.now();
        LocalDateTime end = start.minusDays(1); // Fecha fin anterior a fecha inicio

        // ACT & ASSERT
        assertThrows(IllegalArgumentException.class, () -> {
            kardexService.getMovementsByDate(start, end);
        }, "Debe lanzar IllegalArgumentException si endDate es anterior a startDate.");
        verify(kardexRepository, never()).findByMovementDateBetween(any(), any());
    }
}