package com.ProyectoTGS.BackCore.Services;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import app.entities.TariffEntity;
import app.repositories.TariffRepository;
import app.services.TariffService;

import java.util.Collections;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class TariffServiceTest {

    @Mock
    private TariffRepository tariffRepository;

    @InjectMocks
    private TariffService tariffService;

    private TariffEntity currentTariff;

    @BeforeEach
    void setUp() {
        // Simular la tarifa 
        currentTariff = TariffEntity.builder()
                .id(1L)
                .dailyRentFee(5000)
                .dailyLateFee(2000)
                .repairFee(1500)
                .build();
    }

    // =======================================================================
    // ÉPICA 4: CONSULTA DE TARIFAS (getTariff)
    // =======================================================================

    @Test
    void getTariff_Success() {
        // ARRANGE: Simular que la base de datos devuelve una lista con la tarifa actual
        when(tariffRepository.findAll()).thenReturn(List.of(currentTariff));

        // ACT
        TariffEntity result = tariffService.getTariff();

        // ASSERT
        assertNotNull(result);
        assertEquals(5000, result.getDailyRentFee());
    }

    @Test
    void getTariff_FailsIfNoTariffIsConfigured() {
        // ARRANGE: Simular que la base de datos devuelve una lista vacía
        when(tariffRepository.findAll()).thenReturn(Collections.emptyList());

        // ACT & ASSERT: Debe fallar si no hay tarifas configuradas
        assertThrows(RuntimeException.class, () -> {
            tariffService.getTariff();
        }, "Debe lanzar excepción si no hay tarifas configuradas.");
    }

    // =======================================================================
    // ÉPICA 4: MODIFICACIÓN DE TARIFAS (updateTariff)
    // =======================================================================

    @Test
    void updateTariff_Success() {
        // ARRANGE: Tarifa con nuevos valores
        TariffEntity updatedValues = TariffEntity.builder()
                .dailyRentFee(6000)
                .dailyLateFee(3000)
                .repairFee(2500)
                .build();

        // MOCKEO: 1. Obtener la tarifa actual, 2. Simular la persistencia
        when(tariffRepository.findAll()).thenReturn(List.of(currentTariff));
        when(tariffRepository.save(any(TariffEntity.class))).thenReturn(currentTariff);

        // ACT
        TariffEntity result = tariffService.updateTariff(updatedValues);

        // ASSERT: Verifica que los valores de la entidad original (currentTariff) se hayan actualizado
        assertEquals(6000, result.getDailyRentFee());
        assertEquals(3000, result.getDailyLateFee());
        verify(tariffRepository, times(1)).save(currentTariff);
    }

// =======================================================================
    // MÉTODOS GETTERS ESPECÍFICOS (por completitud)
    // =======================================================================

    @Test
    void getDailyLateFee_Success() {
        // ARRANGE: Simular que getTariff() funciona
        when(tariffRepository.findAll()).thenReturn(List.of(currentTariff));

        // ACT
        double fee = tariffService.getDailyLateFee();

        // ASSERT
        assertEquals(2000, fee); // Valor del setUp
    }

    @Test
    void getDailyRentFee_Success() {
        // ARRANGE: Simular que getTariff() funciona
        when(tariffRepository.findAll()).thenReturn(List.of(currentTariff));

        // ACT
        double fee = tariffService.getDailyRentFee();

        // ASSERT
        assertEquals(5000, fee); // Valor del setUp
    }

    @Test
    void getRepairFee_Success() {
        // ARRANGE: Simular que getTariff() funciona
        when(tariffRepository.findAll()).thenReturn(List.of(currentTariff));

        // ACT
        double fee = tariffService.getRepairFee();

        // ASSERT
        assertEquals(1500, fee); // Valor del setUp
    }
}