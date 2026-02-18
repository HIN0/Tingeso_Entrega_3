package com.ProyectoTGS.BackCore.Services;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import app.entities.ClientEntity;
import app.entities.LoanEntity;
import app.entities.ToolEntity;
import app.entities.enums.ClientStatus;
import app.entities.enums.LoanStatus;
import app.repositories.ClientRepository;
import app.repositories.LoanRepository;
import app.repositories.ToolRepository;
import app.services.ReportService;

import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class ReportServiceTest {

    @Mock
    private LoanRepository loanRepository;
    @Mock
    private ClientRepository clientRepository;
    @Mock 
    private ToolRepository toolRepository; 

    @InjectMocks
    private ReportService reportService;

    private ClientEntity client1;
    private ClientEntity client2;
    private ToolEntity toolA;
    private ToolEntity toolB;


    @BeforeEach
    void setUp() {

        // Inicializar entidades de prueba
        client1 = ClientEntity.builder().id(1L).name("Cliente Juan").build();
        client2 = ClientEntity.builder().id(2L).name("Cliente Maria").build();
        toolA = ToolEntity.builder().id(10L).name("Martillo").build();
        toolB = ToolEntity.builder().id(20L).name("Taladro").build();
        
    }

    // =======================================================================
    // ÉPICA 6: RF 6.1 - PRÉSTAMOS POR ESTADO (getLoansByStatus)
    // =======================================================================

    @Test
    void getLoansByStatus_Active_Success() {
        // ARRANGE
        LoanEntity activeLoan = LoanEntity.builder().status(LoanStatus.ACTIVE).build();
        when(loanRepository.findByStatus(LoanStatus.ACTIVE)).thenReturn(List.of(activeLoan));

        // ACT
        List<LoanEntity> result = reportService.getLoansByStatus("ACTIVE", null, null);

        // ASSERT
        assertEquals(1, result.size());
        assertEquals(LoanStatus.ACTIVE, result.get(0).getStatus());
    }
    
    @Test
    void getLoansByStatus_ThrowsExceptionForInvalidStatus() {
        // ACT & ASSERT: Debe fallar al intentar convertir un string inválido a LoanStatus
        assertThrows(IllegalArgumentException.class, () -> {
            reportService.getLoansByStatus("INVALID_STATUS", null, null);
        }, "Debe lanzar excepción si el estado no existe en el Enum.");
    }

    // =======================================================================
    // ÉPICA 6: RF 6.2 - CLIENTES CON PRÉSTAMOS ATRASADOS (getClientsWithLateLoans)
    // =======================================================================

    @Test
    void getClientsWithLateLoans_ReturnsUniqueClients() {
        // ARRANGE: Cliente 1 tiene dos préstamos LATE, Cliente 2 tiene uno
        LoanEntity lateLoanForC1 = LoanEntity.builder().client(client1).status(LoanStatus.LATE).build();
        LoanEntity anotherLateLoanForC1 = LoanEntity.builder().client(client1).status(LoanStatus.LATE).build();
        LoanEntity lateLoanForC2 = LoanEntity.builder().client(client2).status(LoanStatus.LATE).build();

        when(loanRepository.findByStatus(LoanStatus.LATE)).thenReturn(List.of(lateLoanForC1, anotherLateLoanForC1, lateLoanForC2));

        // ACT
        List<ClientEntity> result = reportService.getClientsWithLateLoans(null, null);

        // ASSERT: Debe devolver 2 clientes únicos (se usa .distinct())
        assertEquals(2, result.size());
        assertTrue(result.stream().anyMatch(c -> c.getId().equals(1L)), "Debe contener al Cliente 1");
        assertTrue(result.stream().anyMatch(c -> c.getId().equals(2L)), "Debe contener al Cliente 2");
    }
    
    // =======================================================================
    // ÉPICA 6: RF 6.3 - RANKING DE HERRAMIENTAS (getTopTools)
    // =======================================================================

    @Test
    void getTopTools_ReturnsRankingFromRepository() {
        // ARRANGE: Simular el resultado de la consulta SQL (Object[]: ToolEntity, Count)
        LocalDate start = LocalDate.of(2025, 1, 1);
        LocalDate end = LocalDate.of(2025, 1, 31);
        
        List<Object[]> mockRanking = List.of(
            new Object[]{toolA, 5L}, // 5 veces prestada
            new Object[]{toolB, 3L}  // 3 veces prestada
        );

        when(loanRepository.findTopToolsByDateRange(start, end)).thenReturn(mockRanking);

        // ACT
        List<Object[]> result = reportService.getTopTools(start, end);

        // ASSERT
        assertEquals(2, result.size());
        // Verificar el orden y los datos
        assertEquals(toolA, result.get(0)[0]);
        assertEquals(5L, result.get(0)[1]);
        verify(loanRepository, times(1)).findTopToolsByDateRange(start, end);
    }
    
    // =======================================================================
    // CLIENTES RESTRINGIDOS (getRestrictedClients)
    // =======================================================================
    
    @Test
    void getRestrictedClients_Success() {
        // ARRANGE
        ClientEntity restrictedClient = ClientEntity.builder().status(ClientStatus.RESTRICTED).build();
        when(clientRepository.findByStatus(ClientStatus.RESTRICTED)).thenReturn(List.of(restrictedClient));

        // ACT
        List<ClientEntity> result = reportService.getRestrictedClients();

        // ASSERT
        assertEquals(1, result.size());
        assertEquals(ClientStatus.RESTRICTED, result.get(0).getStatus());
    }

// =======================================================================
    // MÉTODO: getLoansByStatus (con filtro de fecha)
    // =======================================================================

    @Test
    void getLoansByStatus_WithDateFilter_Success() {
        // ARRANGE
        LocalDate from = LocalDate.of(2025, 1, 1);
        LocalDate to = LocalDate.of(2025, 1, 31);
        LoanEntity loan = LoanEntity.builder().status(LoanStatus.ACTIVE).startDate(from.plusDays(5)).build();
        when(loanRepository.findByStatusAndStartDateBetween(LoanStatus.ACTIVE, from, to)).thenReturn(List.of(loan));

        // ACT
        List<LoanEntity> result = reportService.getLoansByStatus("ACTIVE", from, to);

        // ASSERT
        assertEquals(1, result.size());
        verify(loanRepository, times(1)).findByStatusAndStartDateBetween(LoanStatus.ACTIVE, from, to);
        verify(loanRepository, never()).findByStatus(any()); // Verifica que NO se llamó al método sin filtro
    }

    @Test
    void getLoansByStatus_WithDateFilter_FailsIfFromAfterTo() {
        // ARRANGE
        LocalDate from = LocalDate.of(2025, 1, 31);
        LocalDate to = LocalDate.of(2025, 1, 1);

        // ACT & ASSERT
        assertThrows(IllegalArgumentException.class, () -> {
            reportService.getLoansByStatus("ACTIVE", from, to);
        });
        verify(loanRepository, never()).findByStatusAndStartDateBetween(any(), any(), any());
    }

    // =======================================================================
    // MÉTODO: getClientsWithLateLoans (con filtro de fecha)
    // =======================================================================

     @Test
    void getClientsWithLateLoans_WithDateFilter_Success() {
        // ARRANGE
        LocalDate from = LocalDate.of(2025, 2, 1);
        LocalDate to = LocalDate.of(2025, 2, 28);
        when(loanRepository.findDistinctClientsByStatusAndStartDateBetween(LoanStatus.LATE, from, to))
                .thenReturn(List.of(client1)); // Simular que solo client1 cumple

        // ACT
        List<ClientEntity> result = reportService.getClientsWithLateLoans(from, to);

        // ASSERT
        assertEquals(1, result.size());
        assertEquals(client1.getId(), result.get(0).getId());
        verify(loanRepository, times(1)).findDistinctClientsByStatusAndStartDateBetween(LoanStatus.LATE, from, to);
        verify(loanRepository, never()).findByStatus(LoanStatus.LATE); // Verifica que no se usó el método sin filtro
    }

     @Test
    void getClientsWithLateLoans_WithDateFilter_FailsIfFromAfterTo() {
        // ARRANGE
        LocalDate from = LocalDate.of(2025, 2, 28);
        LocalDate to = LocalDate.of(2025, 2, 1);

        // ACT & ASSERT
        assertThrows(IllegalArgumentException.class, () -> {
            reportService.getClientsWithLateLoans(from, to);
        });
        verify(loanRepository, never()).findDistinctClientsByStatusAndStartDateBetween(any(), any(), any());
    }

    // =======================================================================
    // MÉTODO: getTopTools (validaciones de fecha)
    // =======================================================================

    @Test
    void getTopTools_FailsIfFromDateIsNull() {
         // ACT & ASSERT
        assertThrows(IllegalArgumentException.class, () -> {
            reportService.getTopTools(null, LocalDate.now());
        });
        verify(loanRepository, never()).findTopToolsByDateRange(any(), any());
    }

    @Test
    void getTopTools_FailsIfToDateIsNull() {
        // ACT & ASSERT
        assertThrows(IllegalArgumentException.class, () -> {
            reportService.getTopTools(LocalDate.now(), null);
        });
        verify(loanRepository, never()).findTopToolsByDateRange(any(), any());
    }

    @Test
    void getTopTools_FailsIfFromDateAfterToDate() {
        // ARRANGE
        LocalDate from = LocalDate.of(2025, 1, 31);
        LocalDate to = LocalDate.of(2025, 1, 1);

        // ACT & ASSERT
        assertThrows(IllegalArgumentException.class, () -> {
            reportService.getTopTools(from, to);
        });
        verify(loanRepository, never()).findTopToolsByDateRange(any(), any());
    }
}