package com.ProyectoTGS.BackCore.Services;

import entities.*;
import entities.enums.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import app.exceptions.InvalidOperationException;
import app.exceptions.ResourceNotFoundException;
import repositories.*;
import services.*;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyDouble;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class LoanServiceTest {

    @Mock private LoanRepository loanRepository;
    @Mock private ClientRepository clientRepository;
    @Mock private ToolRepository toolRepository;
    @Mock private ToolService toolService;
    @Mock private TariffService tariffService;
    @Mock private ClientService clientService;
    @Mock private KardexService kardexService;

    @InjectMocks
    private LoanService loanService;

    // Entidades de prueba (SETUP)
    private ClientEntity clientActive;
    private ClientEntity clientRestricted;
    private ToolEntity toolAvailable;
    private UserEntity testUser;

    @BeforeEach
    void setUp() {
        // Configuramos entidades base que se usan en la mayoría de los tests
        clientActive = ClientEntity.builder().id(1L).status(ClientStatus.ACTIVE).build();
        clientRestricted = ClientEntity.builder().id(2L).status(ClientStatus.RESTRICTED).build();
        
        // La herramienta debe tener stock > 0 para que la mayoría de los préstamos pasen
        toolAvailable = ToolEntity.builder().id(10L).stock(1).status(ToolStatus.AVAILABLE).replacementValue(45000).build();
        testUser = UserEntity.builder().username("test_user").id(1L).build();
        
        // Re-inicializamos el servicio para cada prueba
        loanService = new LoanService(loanRepository, clientRepository, toolRepository, toolService, kardexService, tariffService, clientService);
    }

    // =========================================================================================================
    // ÉPICA 2: TESTS PARA createLoan (Validaciones de Préstamo)
    // =========================================================================================================

    @Test
    void createLoan_Success() {
        // ARRANGE
        LocalDate today = LocalDate.now();
        LocalDate dueDate = today.plusDays(7);
        LoanEntity newLoan = LoanEntity.builder().client(clientActive).tool(toolAvailable).startDate(today).dueDate(dueDate).status(LoanStatus.ACTIVE).totalPenalty(0.0).build();

        // MOCKEO: Simular que el cliente, herramienta existen, no hay préstamos y la persistencia funciona
        when(clientRepository.findById(1L)).thenReturn(Optional.of(clientActive));
        when(toolRepository.findById(10L)).thenReturn(Optional.of(toolAvailable));
        when(loanRepository.save(any(LoanEntity.class))).thenReturn(newLoan);

        // ACT
        LoanEntity createdLoan = loanService.createLoan(1L, 10L, today, dueDate, testUser);

        // ASSERT
        // Confirma el estado y la manipulación de inventario/Kardex (Épica 2, 5)
        assertNotNull(createdLoan);
        assertEquals(LoanStatus.ACTIVE, createdLoan.getStatus());
        verify(toolService, times(1)).decrementStockForLoan(toolAvailable, testUser);
    }

    @Test
    void createLoan_FailsWhenClientIsRestricted() {
        // ÉPICA 2 / 3: RN - No prestar a clientes restringidos
        // ARRANGE: Cliente 2 (clientRestricted) es RESTRICTED
        LocalDate today = LocalDate.now();
        LocalDate dueDate = today.plusDays(7);
        Long restrictedClientId = clientRestricted.getId(); // 2L
        Long toolId = toolAvailable.getId(); // 10L

        // Mockeo:
        when(clientRepository.findById(restrictedClientId)).thenReturn(Optional.of(clientRestricted));
        when(toolRepository.findById(toolId)).thenReturn(Optional.of(toolAvailable));

        // ACT & ASSERT: Debe lanzar InvalidOperationException (basado en LoanService.java línea 66)
        assertThrows(InvalidOperationException.class, () -> { 
            loanService.createLoan(restrictedClientId, toolId, today, dueDate, testUser);
        }, "Debe lanzar InvalidOperationException porque el cliente está restringido.");
        
        // VERIFY: Verificar que falló después de buscar cliente/herramienta, pero antes de guardar
        verify(clientRepository, times(1)).findById(restrictedClientId);
        verify(toolRepository, times(1)).findById(toolId);

        // VERIFICACIÓN CRÍTICA: Asegurarse de que NO continuó con las siguientes validaciones
        verify(loanRepository, never()).countByClientAndStatus(any(), any());
        verify(loanRepository, never()).findByClientAndStatusAndTotalPenaltyGreaterThan(any(), any(), anyDouble());
        verify(loanRepository, never()).findByClientAndStatus(any(), any());
        
        // VERIFICACIÓN CRÍTICA: Asegurarse de que NO guardó
        verify(loanRepository, never()).save(any());
        verify(toolService, never()).decrementStockForLoan(any(), any());
    }
    
    @Test
    void createLoan_FailsWhenDueDateIsBeforeStartDate() {
        // ÉPICA 2: RN - Validación de fechas
        // ARRANGE: dueDate es anterior a startDate
        LocalDate startDate = LocalDate.now();
        LocalDate dueDate = startDate.minusDays(1);
        when(clientRepository.findById(1L)).thenReturn(Optional.of(clientActive));
        when(toolRepository.findById(10L)).thenReturn(Optional.of(toolAvailable));

        // ACT & ASSERT: Debe lanzar la excepción de argumento ilegal
        assertThrows(IllegalArgumentException.class, () -> 
            loanService.createLoan(1L, 10L, startDate, dueDate, testUser));
        verify(loanRepository, never()).save(any());
    }

    @Test
    void createLoan_FailsWhenLimitOfFiveActiveLoansIsReached() {
        // ÉPICA 2: RN - Límite de 5 préstamos activos
        // ARRANGE: Simular 5 préstamos activos para el cliente 1L
        LocalDate today = LocalDate.now();
        LocalDate dueDate = today.plusDays(7);

        // Lista simulada de 5 préstamos ACTIVOS
        List<LoanEntity> fiveActiveLoans = List.of(
            LoanEntity.builder().build(), // El contenido no importa, solo el tamaño
            LoanEntity.builder().build(),
            LoanEntity.builder().build(),
            LoanEntity.builder().build(),
            LoanEntity.builder().build()
        );

        // MOCKEO
        when(clientRepository.findById(1L)).thenReturn(Optional.of(clientActive));
        when(toolRepository.findById(10L)).thenReturn(Optional.of(toolAvailable));
        
        // 1. Simular validaciones previas (LATE y RECEIVED)
        when(loanRepository.countByClientAndStatus(clientActive, LoanStatus.LATE)).thenReturn(0L); // No tiene LATE
        when(loanRepository.findByClientAndStatusAndTotalPenaltyGreaterThan(clientActive, LoanStatus.RECEIVED, 0.0))
                .thenReturn(Collections.emptyList()); // No tiene deudas RECEIVED

        // 2. Simular la validación que debe fallar (Límite de 5)
        // El servicio llama a findByClientAndStatus(client, ACTIVE) y .size()
        when(loanRepository.findByClientAndStatus(clientActive, LoanStatus.ACTIVE)).thenReturn(fiveActiveLoans); // Devuelve 5 activos

        // ACT & ASSERT: Intenta crear el sexto préstamo
        assertThrows(InvalidOperationException.class, () -> {
            loanService.createLoan(1L, 10L, today, dueDate, testUser);
        }, "Debe fallar al alcanzar el límite de 5 préstamos activos.");

        // Verificar que se llamó a los métodos correctos (y no a findAll)
        verify(loanRepository, times(1)).countByClientAndStatus(clientActive, LoanStatus.LATE);
        verify(loanRepository, times(1)).findByClientAndStatusAndTotalPenaltyGreaterThan(clientActive, LoanStatus.RECEIVED, 0.0);
        verify(loanRepository, times(1)).findByClientAndStatus(clientActive, LoanStatus.ACTIVE);
        verify(loanRepository, never()).save(any()); // No debe guardar
        verify(loanRepository, never()).findAll();
    }

    @Test
    void createLoan_Fails_WhenToolStatusIsNotAvailable() {
        // ARRANGE: Herramienta en estado LOANED
        Long toolId = 20L;
        ToolEntity toolLoaned = ToolEntity.builder()
                .id(toolId)
                .stock(0) // Stock no importa si el estado es incorrecto
                .status(ToolStatus.LOANED) // <-- Estado INVÁLIDO
                .build();

        // Mockeo:
        // 1. Validaciones previas (Cliente y Deudas) pasan
        when(clientRepository.findById(1L)).thenReturn(Optional.of(clientActive));
        when(loanRepository.countByClientAndStatus(clientActive, LoanStatus.LATE)).thenReturn(0L);
        when(loanRepository.findByClientAndStatusAndTotalPenaltyGreaterThan(clientActive, LoanStatus.RECEIVED, 0.0))
                .thenReturn(Collections.emptyList());
        
        // 2. Mockear la herramienta que fallará la validación
        when(toolRepository.findById(toolId)).thenReturn(Optional.of(toolLoaned));

        // ACT & ASSERT: Debe fallar con InvalidOperationException si el estado no es AVAILABLE
        assertThrows(InvalidOperationException.class, () -> { // <-- EXCEPCIÓN CORREGIDA
            loanService.createLoan(1L, toolId, LocalDate.now(), LocalDate.now().plusDays(1), testUser);
        }, "Debe lanzar InvalidOperationException si el estado no es AVAILABLE.");

        // VERIFY: Verificar que falló después de las validaciones de cliente pero antes de guardar
        verify(loanRepository, times(1)).countByClientAndStatus(clientActive, LoanStatus.LATE);
        verify(loanRepository, times(1)).findByClientAndStatusAndTotalPenaltyGreaterThan(clientActive, LoanStatus.RECEIVED, 0.0);
        verify(toolRepository, times(1)).findById(toolId);
        verify(loanRepository, never()).save(any()); // Nunca debe guardar
    }

    @Test
    void createLoan_Fails_WhenToolIsAvailableButStockIsZero() {
        // ARRANGE: Herramienta AVAILABLE pero con stock 0
        Long toolId = 21L;
        ToolEntity toolOutOfStock = ToolEntity.builder()
                .id(toolId)
                .stock(0) // <-- Stock INVÁLIDO
                .status(ToolStatus.AVAILABLE) // <-- Estado VÁLIDO
                .build();

        // Mockeo:
        // 1. Validaciones previas (Cliente y Deudas) pasan
        when(clientRepository.findById(1L)).thenReturn(Optional.of(clientActive));
        when(loanRepository.countByClientAndStatus(clientActive, LoanStatus.LATE)).thenReturn(0L);
        when(loanRepository.findByClientAndStatusAndTotalPenaltyGreaterThan(clientActive, LoanStatus.RECEIVED, 0.0))
                .thenReturn(Collections.emptyList());
        
        // 2. Mockear la herramienta que fallará la validación
        when(toolRepository.findById(toolId)).thenReturn(Optional.of(toolOutOfStock));

        // ACT & ASSERT: Debe fallar con InvalidOperationException si el stock es 0
        assertThrows(InvalidOperationException.class, () -> { // <-- EXCEPCIÓN CORREGIDA
            loanService.createLoan(1L, toolId, LocalDate.now(), LocalDate.now().plusDays(1), testUser);
        }, "Debe lanzar InvalidOperationException si el stock es 0.");

        // VERIFY: Verificar que falló después de las validaciones de cliente pero antes de guardar
        verify(loanRepository, times(1)).countByClientAndStatus(clientActive, LoanStatus.LATE);
        verify(loanRepository, times(1)).findByClientAndStatusAndTotalPenaltyGreaterThan(clientActive, LoanStatus.RECEIVED, 0.0);
        verify(toolRepository, times(1)).findById(toolId);
        verify(loanRepository, never()).save(any()); // Nunca debe guardar
    }
    
    @Test
    void createLoan_FailsWhenClientAlreadyHasThisToolActive() {
        // ÉPICA 2: RN - No duplicidad de herramienta
        // ARRANGE: Simular que el cliente 1 ya tiene la herramienta 10 activa
        LocalDate today = LocalDate.now();
        LocalDate dueDate = today.plusDays(7);

        // Simular un préstamo ACTIVO existente con la MISMA herramienta (toolAvailable)
        LoanEntity activeLoanForSameTool = LoanEntity.builder()
                .client(clientActive)
                .tool(toolAvailable) // <- La misma herramienta que se intenta pedir
                .status(LoanStatus.ACTIVE)
                .build();

        // MOCKEO
        when(clientRepository.findById(1L)).thenReturn(Optional.of(clientActive));
        when(toolRepository.findById(10L)).thenReturn(Optional.of(toolAvailable));
        
        // 1. Simular validaciones previas (LATE y RECEIVED)
        when(loanRepository.countByClientAndStatus(clientActive, LoanStatus.LATE)).thenReturn(0L); // No tiene LATE (para check de límite)
        when(loanRepository.findByClientAndStatusAndTotalPenaltyGreaterThan(clientActive, LoanStatus.RECEIVED, 0.0))
                .thenReturn(Collections.emptyList()); // No tiene deudas RECEIVED

        // 2. Simular la validación de límite de 5 (asumimos que tiene < 5 activos)
        when(loanRepository.findByClientAndStatus(clientActive, LoanStatus.ACTIVE))
                .thenReturn(List.of(activeLoanForSameTool)); // Devuelve el préstamo duplicado

        // ACT & ASSERT: Intenta crear el préstamo con la misma herramienta
        assertThrows(InvalidOperationException.class, () -> {
            loanService.createLoan(1L, 10L, today, dueDate, testUser);
        }, "Debe fallar si el cliente ya tiene esta herramienta activa.");

        // Verificar que se llamó a los métodos correctos (y no a findAll)
        verify(loanRepository, times(1)).countByClientAndStatus(clientActive, LoanStatus.LATE);
        verify(loanRepository, times(1)).findByClientAndStatusAndTotalPenaltyGreaterThan(clientActive, LoanStatus.RECEIVED, 0.0);
        // Verifica el 'findByClientAndStatus(ACTIVE)' (tanto para límite de 5 como para duplicidad)
        verify(loanRepository, times(2)).findByClientAndStatus(clientActive, LoanStatus.ACTIVE); 
        
        // NO debe llamar a 'findByClientAndStatus(LATE)' para el stream, porque el '||' hace short-circuit
        verify(loanRepository, never()).findByClientAndStatus(clientActive, LoanStatus.LATE);
        
        verify(loanRepository, never()).save(any()); // No debe guardar
        verify(loanRepository, never()).findAll(); // NUNCA debe llamar a findAll
    }

    @Test
    void createLoan_FailsWhenClientHasUnpaidReceivedLoans() {
        // ARRANGE: Cliente activo pero con una deuda pendiente
        LocalDate today = LocalDate.now();
        LocalDate dueDate = today.plusDays(7);

        // Simular un préstamo anterior en estado RECEIVED con penalidad > 0
        LoanEntity unpaidReceivedLoan = LoanEntity.builder()
                .client(clientActive) // Usamos clientActive definido en setUp
                .status(LoanStatus.RECEIVED)
                .totalPenalty(5000.0) // Deuda pendiente
                .build();

        // Mockeo:
        // 1. Encontrar al cliente activo
        when(clientRepository.findById(clientActive.getId())).thenReturn(Optional.of(clientActive));
        // 2. Encontrar la herramienta disponible
        when(toolRepository.findById(toolAvailable.getId())).thenReturn(Optional.of(toolAvailable));
        // 3. No tiene préstamos LATE
        when(loanRepository.countByClientAndStatus(clientActive, LoanStatus.LATE)).thenReturn(0L);
        // 4. SIMULAR QUE TIENE DEUDAS PENDIENTES (devuelve lista no vacía)
        when(loanRepository.findByClientAndStatusAndTotalPenaltyGreaterThan(clientActive, LoanStatus.RECEIVED, 0.0))
                .thenReturn(List.of(unpaidReceivedLoan)); // Lista contiene la deuda

        // ACT & ASSERT: Esperamos que lance InvalidOperationException
        assertThrows(InvalidOperationException.class, () -> {
            loanService.createLoan(clientActive.getId(), toolAvailable.getId(), today, dueDate, testUser);
        }, "Debe lanzar InvalidOperationException porque el cliente tiene deudas pendientes.");

        // Verificar que se hicieron las comprobaciones hasta el punto de fallo
        verify(clientRepository, times(1)).findById(clientActive.getId());
        verify(toolRepository, times(1)).findById(toolAvailable.getId()); // Verifica la herramienta también
        verify(loanRepository, times(1)).countByClientAndStatus(clientActive, LoanStatus.LATE);
        verify(loanRepository, times(1)).findByClientAndStatusAndTotalPenaltyGreaterThan(clientActive, LoanStatus.RECEIVED, 0.0);
        // VERIFICACIÓN CRÍTICA: Asegurarse de que NO se intentó guardar el nuevo préstamo
        verify(loanRepository, never()).save(any(LoanEntity.class));
        // VERIFICACIÓN CRÍTICA: Asegurarse de que NO se intentó decrementar el stock
        verify(toolService, never()).decrementStockForLoan(any(ToolEntity.class), any(UserEntity.class));
    }

@Test
    void createLoan_FailsWhenClientHasLateLoans() {
        // ARRANGE: Cliente activo pero con préstamos atrasados
        LocalDate today = LocalDate.now();
        LocalDate dueDate = today.plusDays(7);

        // Mockeo:
        // 1. Encontrar al cliente activo
        when(clientRepository.findById(clientActive.getId())).thenReturn(Optional.of(clientActive));
        // 2. Encontrar la herramienta disponible
        when(toolRepository.findById(toolAvailable.getId())).thenReturn(Optional.of(toolAvailable));
        // 3. SIMULAR QUE TIENE PRÉSTAMOS LATE (devolver > 0)
        when(loanRepository.countByClientAndStatus(clientActive, LoanStatus.LATE)).thenReturn(1L); // Tiene 1 préstamo LATE

        // ACT & ASSERT: Esperamos que lance InvalidOperationException
        assertThrows(InvalidOperationException.class, () -> {
            loanService.createLoan(clientActive.getId(), toolAvailable.getId(), today, dueDate, testUser);
        }, "Debe lanzar InvalidOperationException porque el cliente tiene préstamos LATE.");

        // Verificar que se hicieron las comprobaciones hasta el punto de fallo
        verify(clientRepository, times(1)).findById(clientActive.getId());
        verify(toolRepository, times(1)).findById(toolAvailable.getId());
        verify(loanRepository, times(1)).countByClientAndStatus(clientActive, LoanStatus.LATE);
        // VERIFICACIÓN CRÍTICA: Asegurarse de que NO continuó verificando deudas RECEIVED
        verify(loanRepository, never()).findByClientAndStatusAndTotalPenaltyGreaterThan(any(ClientEntity.class), any(LoanStatus.class), anyDouble());
        // VERIFICACIÓN CRÍTICA: Asegurarse de que NO se intentó guardar el nuevo préstamo
        verify(loanRepository, never()).save(any(LoanEntity.class));
        // VERIFICACIÓN CRÍTICA: Asegurarse de que NO se intentó decrementar el stock
        verify(toolService, never()).decrementStockForLoan(any(ToolEntity.class), any(UserEntity.class));
    }

    // =========================================================================================================
    // ÉPICA 2: TESTS PARA returnLoan (Devoluciones, Multas y Restricciones)
    // =========================================================================================================

    @Test
    void returnLoan_SuccessOnTimeNoDamage_SetsStatusToReceivedAndRestrictsClient() {
        // ARRANGE: Préstamo devuelto a tiempo (returnDate = dueDate) y sin daños
        LocalDate startDate = LocalDate.now().minusDays(5);
        LocalDate dueDate = LocalDate.now(); // Vence hoy
        LocalDate returnDate = LocalDate.now(); // Se devuelve hoy
        Long loanId = 5L;
        
        LoanEntity loan = LoanEntity.builder()
                .id(loanId)
                .client(clientActive)
                .tool(toolAvailable)
                .startDate(startDate)
                .dueDate(dueDate)
                .status(LoanStatus.ACTIVE)
                .totalPenalty(0.0)
                .build();

        // MOCKEO:
        when(loanRepository.findById(loanId)).thenReturn(Optional.of(loan));
        // Mockear tarifa de arriendo (la única necesaria aquí)
        when(tariffService.getDailyRentFee()).thenReturn(1000.0);
        when(loanRepository.save(any(LoanEntity.class))).thenAnswer(invocation -> invocation.getArgument(0)); // Devolver la entidad guardada

        // ACT (Devuelto hoy, a tiempo)
        LoanEntity returnedLoan = loanService.returnLoan(loanId, toolAvailable.getId(), false, false, testUser, returnDate);
        
        // ASSERT
        // Días de arriendo (pactados) = 5
        long rentalDays = ChronoUnit.DAYS.between(startDate, dueDate); // 5
        double expectedRentalCost = rentalDays * 1000.0; // 5000.0

        // 1. El estado debe ser RECEIVED (pendiente de pago)
        assertEquals(LoanStatus.RECEIVED, returnedLoan.getStatus());
        // 2. La penalidad debe ser el costo del arriendo
        assertEquals(expectedRentalCost, returnedLoan.getTotalPenalty(), 0.01); // 5000.0

        // 3. Se actualiza el stock
        verify(toolService, times(1)).incrementStockForReturn(toolAvailable, testUser);
        // 4. El cliente DEBE ser restringido (porque totalPenalty > 0)
        verify(clientService, times(1)).updateStatus(clientActive.getId(), ClientStatus.RESTRICTED);
    }

    @Test
    void returnLoan_AppliesLateFeeAndRentalFee_AndRestrictsClient() {
        // ARRANGE: Préstamo atrasado 2 días
        LocalDate startDate = LocalDate.now().minusDays(7); // Inició hace 7 días
        LocalDate dueDate = LocalDate.now().minusDays(2);  // Vencía hace 2 días
        LocalDate returnDate = LocalDate.now();            // Se devuelve hoy
        Long loanId = 6L;
        
        LoanEntity loan = LoanEntity.builder()
                .id(loanId)
                .client(clientActive)
                .tool(toolAvailable)
                .startDate(startDate)
                .dueDate(dueDate)
                .status(LoanStatus.LATE) // o ACTIVE
                .totalPenalty(0.0)
                .build();

        when(loanRepository.findById(loanId)).thenReturn(Optional.of(loan));
        when(tariffService.getDailyRentFee()).thenReturn(1000.0); // Tarifa arriendo
        when(tariffService.getDailyLateFee()).thenReturn(2000.0); // Tarifa multa
        when(loanRepository.save(any(LoanEntity.class))).thenReturn(loan);
        
        // ACT (Se devuelve hoy, 2 días tarde)
        LoanEntity returnedLoan = loanService.returnLoan(loanId, toolAvailable.getId(), false, false, testUser, returnDate);
        
        // ASSERT
        // Días de arriendo (pactados) = 5
        long rentalDays = ChronoUnit.DAYS.between(startDate, dueDate); // 5
        double expectedRentalCost = rentalDays * 1000.0; // 5000.0
        // Días de atraso = 2
        long delayDays = ChronoUnit.DAYS.between(dueDate, returnDate); // 2
        double expectedLateFee = delayDays * 2000.0; // 4000.0
        
        double expectedTotalPenalty = expectedRentalCost + expectedLateFee; // 5000 + 4000 = 9000.0

        assertEquals(expectedTotalPenalty, returnedLoan.getTotalPenalty(), 0.01); // Total 9000.0
        assertEquals(LoanStatus.RECEIVED, returnedLoan.getStatus());
        // RN CRÍTICO: Debe restringir al cliente por la multa (Épica 3)
        verify(clientService, times(1)).updateStatus(clientActive.getId(), ClientStatus.RESTRICTED); 
        verify(toolService, times(1)).incrementStockForReturn(toolAvailable, testUser);
        verify(toolService, never()).markAsRepairing(any(), any());
        verify(toolService, never()).markAsDecommissioned(any(), any());
    }
    
    @Test
    void returnLoan_AppliesRepairFeeAndRentalFee_MarksRepairingAndRestrictsClient() {
        // ARRANGE: Préstamo a tiempo (returnDate = dueDate), pero dañado
        Long loanId = 8L;
        LocalDate startDate = LocalDate.now().minusDays(7); // Inició hace 7 días
        LocalDate dueDate = LocalDate.now();                // Vence hoy
        LocalDate returnDate = LocalDate.now();             // Se devuelve hoy
        
        LoanEntity loan = LoanEntity.builder()
            .id(loanId)
            .client(clientActive)
            .tool(toolAvailable)
            .startDate(startDate) // <- Añadido
            .dueDate(dueDate) 
            .status(LoanStatus.ACTIVE)
            .totalPenalty(0.0).build();
        
        when(loanRepository.findById(loanId)).thenReturn(Optional.of(loan));
        when(tariffService.getDailyRentFee()).thenReturn(1000.0); // Tarifa arriendo
        when(tariffService.getRepairFee()).thenReturn(1500.0);    // Tarifa reparación
        when(loanRepository.save(any(LoanEntity.class))).thenReturn(loan);
        
        // ACT (Devuelto dañado, NO irreparable)
        LoanEntity returnedLoan = loanService.returnLoan(loanId, toolAvailable.getId(), true, false, testUser, returnDate);
        
        // ASSERT
        // Días de arriendo (pactados) = 7
        long rentalDays = ChronoUnit.DAYS.between(startDate, dueDate); // 7
        double expectedRentalCost = rentalDays * 1000.0; // 7000.0
        // Días de atraso = 0
        // Cargo por reparación = 1500.0
        
        double expectedTotalPenalty = expectedRentalCost + 1500.0; // 7000 + 1500 = 8500.0

        assertEquals(expectedTotalPenalty, returnedLoan.getTotalPenalty(), 0.01);
        assertEquals(LoanStatus.RECEIVED, returnedLoan.getStatus());
        // RN CRÍTICO: Debe restringir al cliente por el cargo (Épica 3)
        verify(clientService, times(1)).updateStatus(clientActive.getId(), ClientStatus.RESTRICTED);
        // Debe marcarse como REPAIRING (Épica 1)
        verify(toolService, times(1)).markAsRepairing(toolAvailable, testUser);
        verify(toolService, never()).incrementStockForReturn(any(), any()); // No vuelve a stock
    }

    @Test
    void returnLoan_AppliesReplacementFeeAndLateFeeAndRentalFee_AndRestrictsClient() {
        // ARRANGE: Préstamo ATRASADO 10 días y daño irreparable
        Long loanId = 7L;
        LocalDate startDate = LocalDate.now().minusDays(15); // Inició hace 15 días
        LocalDate dueDate = LocalDate.now().minusDays(10); // Vencía hace 10 días
        LocalDate returnDate = LocalDate.now();            // Se devuelve hoy
        
        ToolEntity irreparableTool = ToolEntity.builder().id(11L).replacementValue(50000).build();
        
        LoanEntity loan = LoanEntity.builder()
            .id(loanId)
            .client(clientActive)
            .tool(irreparableTool)
            .startDate(startDate) // <- Añadido
            .dueDate(dueDate) 
            .status(LoanStatus.LATE)
            .totalPenalty(0.0).build();
        
        when(loanRepository.findById(loanId)).thenReturn(Optional.of(loan));
        when(tariffService.getDailyRentFee()).thenReturn(1000.0); // Tarifa arriendo
        when(tariffService.getDailyLateFee()).thenReturn(2000.0); // Tarifa multa

        when(loanRepository.save(any(LoanEntity.class))).thenReturn(loan);

        // ACT (Devuelto dañado e irreparable)
        LoanEntity returnedLoan = loanService.returnLoan(loanId, 11L, true, true, testUser, returnDate);
        
        // ASSERT
        // Días de arriendo (pactados) = 5
        long rentalDays = ChronoUnit.DAYS.between(startDate, dueDate); // 5
        double expectedRentalCost = rentalDays * 1000.0; // 5000.0
        // Días de atraso = 10
        long delayDays = ChronoUnit.DAYS.between(dueDate, returnDate); // 10
        double expectedLateFee = delayDays * 2000.0; // 20000.0
        // Cargo por reposición = 50000.0
        
        double expectedTotalPenalty = expectedRentalCost + expectedLateFee + 50000.0; // 5000 + 20000 + 50000 = 75000.0

        assertEquals(expectedTotalPenalty, returnedLoan.getTotalPenalty(), 0.01);
        assertEquals(LoanStatus.RECEIVED, returnedLoan.getStatus());
        // RN CRÍTICO: Debe restringir al cliente por el cargo
        verify(clientService, times(1)).updateStatus(clientActive.getId(), ClientStatus.RESTRICTED);
        // Debe marcarse como DECOMMISSIONED (Épica 1)
        verify(toolService, times(1)).markAsDecommissioned(irreparableTool, testUser);
        verify(toolService, never()).incrementStockForReturn(any(), any());
    }
    
    @Test
    void returnLoan_FailsWhenLoanStatusIsClosed() {
        // ARRANGE: Simular un préstamo ya cerrado (CLOSED)
        Long loanId = 9L;
        LoanEntity loan = LoanEntity.builder()
                .id(loanId)
                .tool(toolAvailable) // toolAvailable tiene ID 10L
                .status(LoanStatus.CLOSED) // <-- Estado inválido
                .build();

        when(loanRepository.findById(loanId)).thenReturn(Optional.of(loan));
        
        // ACT & ASSERT: Debe fallar si el estado no es ACTIVE o LATE
        assertThrows(InvalidOperationException.class, () -> 
            // Usamos toolAvailable.getId() (que es 10L)
            loanService.returnLoan(loanId, toolAvailable.getId(), false, false, testUser, LocalDate.now()),
            "Solo se pueden devolver préstamos activos o atrasados.");

        verify(loanRepository, times(1)).findById(loanId);
        verify(loanRepository, never()).save(any());
        verify(toolService, never()).incrementStockForReturn(any(), any());
    }

    // =========================================================================================================
    // ÉPICA 4 / 2: TEST PARA CÁLCULO DE TARIFA DE ARRIENDO (returnLoan)
    // =========================================================================================================

    @Test
    void returnLoan_CalculatesRentalFeeCorrectly_WhenReturnedEarly() {
        // ARRANGE: Préstamo devuelto anticipadamente
        Long loanId = 15L;
        LocalDate startDate = LocalDate.now().minusDays(3); // Inició hace 3 días
        LocalDate dueDate = LocalDate.now().plusDays(5); // Vencimiento en 5 días
        LocalDate returnDate = LocalDate.now(); // Devuelto hoy (anticipado)

        LoanEntity loan = LoanEntity.builder()
            .id(loanId)
            .client(clientActive)
            .tool(toolAvailable)
            .startDate(startDate)
            .dueDate(dueDate)
            .status(LoanStatus.ACTIVE)
            .totalPenalty(0.0)
            .build();

        // MOCKEO:
        when(loanRepository.findById(loanId)).thenReturn(Optional.of(loan));
        when(tariffService.getDailyRentFee()).thenReturn(1000.0);
        when(loanRepository.save(any(LoanEntity.class))).thenReturn(loan);

        // ACT: Devolver la herramienta sin daño y sin atraso
        LoanEntity returnedLoan = loanService.returnLoan(loanId, toolAvailable.getId(), false, false, testUser, returnDate);

        // ASSERT:
        // Días de arriendo (pactados) = 8 (entre startDate y dueDate)
        long rentalDays = ChronoUnit.DAYS.between(startDate, dueDate); // 8
        double expectedRentalCost = rentalDays * 1000.0; // 8000.0

        assertEquals(expectedRentalCost, returnedLoan.getTotalPenalty(), 0.01); // 8000.0
        assertEquals(LoanStatus.RECEIVED, returnedLoan.getStatus()); // Estado debe ser RECEIVED
        
        verify(toolService, times(1)).incrementStockForReturn(toolAvailable, testUser);
        verify(clientService, times(1)).updateStatus(clientActive.getId(), ClientStatus.RESTRICTED);
    }

    @Test
    void returnLoan_AppliesMinimumOneDayRentalFee_WhenStartDateEqualsDueDate() {
        // ARRANGE: Préstamo pactado para el mismo día (startDate = dueDate)
        Long loanId = 16L;
        LocalDate startDate = LocalDate.now();
        LocalDate dueDate = LocalDate.now(); // Vence el mismo día
        LocalDate returnDate = LocalDate.now(); // Devuelto el mismo día

        LoanEntity loan = LoanEntity.builder()
            .id(loanId)
            .client(clientActive)
            .tool(toolAvailable)
            .startDate(startDate)
            .dueDate(dueDate)
            .status(LoanStatus.ACTIVE)
            .totalPenalty(0.0)
            .build();

        when(loanRepository.findById(loanId)).thenReturn(Optional.of(loan));
        when(tariffService.getDailyRentFee()).thenReturn(1000.0); // Tarifa 1000
        when(loanRepository.save(any(LoanEntity.class))).thenReturn(loan);

        // ACT: Devolver sin daño/atraso el mismo día
        LoanEntity returnedLoan = loanService.returnLoan(loanId, toolAvailable.getId(), false, false, testUser, returnDate);

        // ASSERT:
        // Días de arriendo (pactados) = 0.
        // El servicio aplica la regla (if rentalDays < 1) rentalDays = 1.
        double expectedRentalCost = 1 * 1000.0; // 1000.0 (Mínimo 1 día)

        assertEquals(expectedRentalCost, returnedLoan.getTotalPenalty(), 0.01);
        assertEquals(LoanStatus.RECEIVED, returnedLoan.getStatus());
        
        verify(toolService, times(1)).incrementStockForReturn(toolAvailable, testUser);
        verify(clientService, times(1)).updateStatus(clientActive.getId(), ClientStatus.RESTRICTED);
    }

@Test
    void returnLoan_AppliesLateFeeAndRepairFee_WhenLateAndDamagedRepairable() {
        // ARRANGE: Préstamo atrasado 2 días y con daño reparable
        Long loanId = 11L;
        LocalDate startDate = LocalDate.now().minusDays(10); // Inicio hace 10 días
        LocalDate dueDate = LocalDate.now().minusDays(2);  // Vencía hace 2 días
        LocalDate returnDate = LocalDate.now();           // Se devuelve hoy (2 días tarde)

        LoanEntity loan = LoanEntity.builder()
                .id(loanId)
                .client(clientActive) // Cliente activo del setUp
                .tool(toolAvailable) // Herramienta disponible del setUp
                .startDate(startDate)
                .dueDate(dueDate)
                .status(LoanStatus.LATE) // Podría estar LATE o ACTIVE, el cálculo es igual
                .totalPenalty(0.0)
                .build();

        // MOCKEO:
        when(loanRepository.findById(loanId)).thenReturn(Optional.of(loan));
        // Necesitamos toolRepository.findById si returnLoan lo busca, aunque lo obtiene del préstamo
        // when(toolRepository.findById(toolAvailable.getId())).thenReturn(Optional.of(toolAvailable));
        when(tariffService.getDailyLateFee()).thenReturn(2000.0);    // Multa diaria
        when(tariffService.getRepairFee()).thenReturn(1500.0);     // Cargo reparación
        when(tariffService.getDailyRentFee()).thenReturn(1000.0);   // Tarifa arriendo diaria
        when(loanRepository.save(any(LoanEntity.class))).thenReturn(loan); // Simular guardado

        // ACT: Devolver con atraso y daño reparable
        LoanEntity returnedLoan = loanService.returnLoan(loanId, toolAvailable.getId(), true, false, testUser, returnDate);

        // ASSERT: Calcular penalidad total esperada
        // Días de arriendo = 8 (desde startDate hasta dueDate)
        long rentalDays = ChronoUnit.DAYS.between(startDate, dueDate);
        if (rentalDays < 1) rentalDays = 1; // Mínimo 1 día
        double expectedRentalCost = rentalDays * 1000.0; // 8 * 1000 = 8000
        // Días de atraso = 2
        long delayDays = ChronoUnit.DAYS.between(dueDate, returnDate);
        double expectedLateFee = delayDays * 2000.0; // 2 * 2000 = 4000
        // Cargo por reparación
        double expectedRepairFee = 1500.0;
        // Total
        double expectedTotalPenalty = expectedRentalCost + expectedLateFee + expectedRepairFee; // 8000 + 4000 + 1500 = 13500

        assertEquals(expectedTotalPenalty, returnedLoan.getTotalPenalty(), 0.01);
        assertEquals(LoanStatus.RECEIVED, returnedLoan.getStatus()); // Estado cambia a RECEIVED
        assertNotNull(returnedLoan.getReturnDate()); // Fecha de devolución guardada

        // Verificar interacciones con otros servicios
        // Se marca como REPAIRING (NO incrementa stock)
        verify(toolService, times(1)).markAsRepairing(eq(toolAvailable), eq(testUser));
        verify(toolService, never()).incrementStockForReturn(any(), any()); // No debe incrementar stock
        verify(toolService, never()).markAsDecommissioned(any(), any());   // No debe darse de baja
        // Cliente queda RESTRINGIDO
        verify(clientService, times(1)).updateStatus(clientActive.getId(), ClientStatus.RESTRICTED);
        // Se guarda el préstamo
        verify(loanRepository, times(1)).save(loan);
    }

@Test
    void returnLoan_AppliesLateFeeAndReplacementFee_WhenLateAndDamagedIrreparable() {
        // ARRANGE: Préstamo atrasado 3 días y con daño irreparable
        Long loanId = 12L;
        LocalDate startDate = LocalDate.now().minusDays(10); // Inicio hace 10 días
        LocalDate dueDate = LocalDate.now().minusDays(3);  // Vencía hace 3 días
        LocalDate returnDate = LocalDate.now();           // Se devuelve hoy (3 días tarde)

        // Usar la herramienta del setUp que tiene replacementValue = 45000
        LoanEntity loan = LoanEntity.builder()
                .id(loanId)
                .client(clientActive)
                .tool(toolAvailable) // toolAvailable tiene replacementValue = 45000
                .startDate(startDate)
                .dueDate(dueDate)
                .status(LoanStatus.LATE)
                .totalPenalty(0.0)
                .build();

        // MOCKEO:
        when(loanRepository.findById(loanId)).thenReturn(Optional.of(loan));
        // No necesitamos mockear toolRepository.findById si usamos la herramienta del préstamo
        when(tariffService.getDailyLateFee()).thenReturn(2000.0);    // Multa diaria
        when(tariffService.getDailyRentFee()).thenReturn(1000.0);   // Tarifa arriendo diaria
        // NO necesitamos mockear tariffService.getRepairFee()
        when(loanRepository.save(any(LoanEntity.class))).thenReturn(loan); // Simular guardado

        // ACT: Devolver con atraso y daño irreparable
        LoanEntity returnedLoan = loanService.returnLoan(loanId, toolAvailable.getId(), true, true, testUser, returnDate);

        // ASSERT: Calcular penalidad total esperada
        // Días de arriendo = 7 (desde startDate hasta dueDate)
        long rentalDays = ChronoUnit.DAYS.between(startDate, dueDate);
        if (rentalDays < 1) rentalDays = 1;
        double expectedRentalCost = rentalDays * 1000.0; // 7 * 1000 = 7000
        // Días de atraso = 3
        long delayDays = ChronoUnit.DAYS.between(dueDate, returnDate);
        double expectedLateFee = delayDays * 2000.0; // 3 * 2000 = 6000
        // Cargo por reposición (viene de toolAvailable.getReplacementValue())
        double expectedReplacementFee = toolAvailable.getReplacementValue(); // 45000
        // Total
        double expectedTotalPenalty = expectedRentalCost + expectedLateFee + expectedReplacementFee; // 7000 + 6000 + 45000 = 58000

        assertEquals(expectedTotalPenalty, returnedLoan.getTotalPenalty(), 0.01);
        assertEquals(LoanStatus.RECEIVED, returnedLoan.getStatus());
        assertEquals(returnDate, returnedLoan.getReturnDate());

        // Verificar interacciones con otros servicios
        // Se marca como DECOMMISSIONED
        verify(toolService, times(1)).markAsDecommissioned(eq(toolAvailable), eq(testUser));
        verify(toolService, never()).incrementStockForReturn(any(), any()); // No debe incrementar stock
        verify(toolService, never()).markAsRepairing(any(), any());       // No debe marcar para reparar
        // Cliente queda RESTRINGIDO
        verify(clientService, times(1)).updateStatus(clientActive.getId(), ClientStatus.RESTRICTED);
        // Se guarda el préstamo
        verify(loanRepository, times(1)).save(loan);
    }

@Test
    void returnLoan_AppliesOnlyRentalFee_WhenReturnedEarlyNoDamage() {
        // ARRANGE: Préstamo devuelto 2 días ANTES de la fecha de vencimiento
        Long loanId = 13L;
        LocalDate startDate = LocalDate.now().minusDays(5); // Inicio hace 5 días
        LocalDate dueDate = LocalDate.now().plusDays(2);  // Vencía en 2 días más
        LocalDate returnDate = LocalDate.now();           // Se devuelve hoy (2 días antes)

        LoanEntity loan = LoanEntity.builder()
                .id(loanId)
                .client(clientActive)
                .tool(toolAvailable)
                .startDate(startDate)
                .dueDate(dueDate)
                .status(LoanStatus.ACTIVE)
                .totalPenalty(0.0)
                .build();

        // MOCKEO:
        when(loanRepository.findById(loanId)).thenReturn(Optional.of(loan));
        when(tariffService.getDailyRentFee()).thenReturn(1000.0); // Tarifa arriendo diaria
        // NO necesitamos mockear getDailyLateFee ni getRepairFee
        when(loanRepository.save(any(LoanEntity.class))).thenReturn(loan);

        // ACT: Devolver anticipadamente y sin daños
        LoanEntity returnedLoan = loanService.returnLoan(loanId, toolAvailable.getId(), false, false, testUser, returnDate);

        // ASSERT: Calcular penalidad total esperada
        // Días transcurridos = 5 (desde startDate hasta returnDate)
        // La RN dice que se cobra hasta la fecha pactada (dueDate) aunque se devuelva antes
        // ¡CORRECCIÓN SEGÚN RN!: "Si la devolución se realiza antes de la fecha pactada, no hay devoluciones de dinero (tarifa mínima siempre es 1 día)." 
        // Esto implica que se cobra como si se hubiera devuelto en la fecha pactada (dueDate).
        long rentalDaysCharged = ChronoUnit.DAYS.between(startDate, dueDate); // 7 días
        if (rentalDaysCharged < 1) rentalDaysCharged = 1; // Mínimo 1 día
        double expectedRentalCost = rentalDaysCharged * 1000.0; // 7 * 1000 = 7000

        // Multa por atraso debe ser CERO
        double expectedLateFee = 0.0;
        // Cargo por daño debe ser CERO
        double expectedDamagePenalty = 0.0;
        // Total esperado = Solo costo de arriendo hasta fecha pactada
        double expectedTotalPenalty = expectedRentalCost + expectedLateFee + expectedDamagePenalty; // 7000

        assertEquals(expectedTotalPenalty, returnedLoan.getTotalPenalty(), 0.01);
        assertEquals(LoanStatus.RECEIVED, returnedLoan.getStatus()); // Cambia a RECEIVED
        assertEquals(returnDate, returnedLoan.getReturnDate());

        // Verificar interacciones con otros servicios
        // Se incrementa stock
        verify(toolService, times(1)).incrementStockForReturn(eq(toolAvailable), eq(testUser));
        verify(toolService, never()).markAsRepairing(any(), any());
        verify(toolService, never()).markAsDecommissioned(any(), any());
        // Cliente queda RESTRINGIDO porque totalPenalty > 0
        verify(clientService, times(1)).updateStatus(clientActive.getId(), ClientStatus.RESTRICTED);
        // Se guarda el préstamo
        verify(loanRepository, times(1)).save(loan);
    }

    // =========================================================================================================
    // MÉTODO: markLoanAsPaid
    // =========================================================================================================

    @Test
    void markLoanAsPaid_Success_WhenLoanIsReceivedWithPenalty() {
        // ARRANGE: Un préstamo en estado RECEIVED con una penalidad pendiente
        Long loanId = 20L;
        LoanEntity receivedLoanWithPenalty = LoanEntity.builder()
                .id(loanId)
                .client(clientActive) // Cliente asociado (no relevante para la lógica directa, pero sí para el objeto)
                .tool(toolAvailable)  // Herramienta asociada
                .status(LoanStatus.RECEIVED) // Estado CORRECTO para esta operación
                .totalPenalty(5000.0)       // Penalidad PENDIENTE
                .build();

        // Mockeo:
        // 1. Encontrar el préstamo
        when(loanRepository.findById(loanId)).thenReturn(Optional.of(receivedLoanWithPenalty));
        // 2. Simular el guardado, devolviendo el objeto que se le pasa para verificar cambios
        when(loanRepository.save(any(LoanEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // ACT: Llamar al método para marcar como pagado
        LoanEntity paidLoan = loanService.markLoanAsPaid(loanId);

        // ASSERT: Verificar los cambios en el estado y la penalidad
        assertNotNull(paidLoan);
        assertEquals(loanId, paidLoan.getId());
        assertEquals(LoanStatus.CLOSED, paidLoan.getStatus()); // Estado DEBE cambiar a CLOSED
        assertEquals(0.0, paidLoan.getTotalPenalty(), 0.01); // Penalidad DEBE ser 0.0

        // Verificar que se llamó a findById y save
        verify(loanRepository, times(1)).findById(loanId);
        verify(loanRepository, times(1)).save(argThat(loan ->
                loan.getId().equals(loanId) &&
                loan.getStatus().equals(LoanStatus.CLOSED) && // Verificar estado final
                loan.getTotalPenalty() == 0.0                 // Verificar penalidad final
        ));

        // VERIFICACIÓN IMPORTANTE: Asegurarse de que NO se intentó cambiar el estado del cliente
        verify(clientService, never()).updateStatus(anyLong(), any(ClientStatus.class));
    }

    @Test
    void markLoanAsPaid_Fails_WhenLoanStatusIsNotReceived() {
        // ARRANGE: Un préstamo en estado ACTIVE (incorrecto para esta operación) (quizas probar con late o closed)
        Long loanId = 21L;
        LoanEntity activeLoan = LoanEntity.builder()
                .id(loanId)
                .client(clientActive)
                .tool(toolAvailable)
                .status(LoanStatus.ACTIVE) // Estado INCORRECTO
                .totalPenalty(0.0) // Penalidad no relevante aquí, pero la ponemos
                .build();

        // Mockeo: Encontrar el préstamo activo
        when(loanRepository.findById(loanId)).thenReturn(Optional.of(activeLoan));

        // ACT & ASSERT: Esperamos que lance InvalidOperationException
        assertThrows(InvalidOperationException.class, () -> {
            loanService.markLoanAsPaid(loanId);
        }, "Debe lanzar InvalidOperationException si el estado no es RECEIVED.");

        // Verificar que se llamó a findById
        verify(loanRepository, times(1)).findById(loanId);
        // VERIFICACIÓN CRÍTICA: Asegurarse de que NUNCA se intentó guardar (cambiar estado o penalidad)
        verify(loanRepository, never()).save(any(LoanEntity.class));
        // VERIFICACIÓN CRÍTICA: Asegurarse de que NO se intentó cambiar el estado del cliente
        verify(clientService, never()).updateStatus(anyLong(), any(ClientStatus.class));

    }

    @Test
    void markLoanAsPaid_Fails_WhenLoanNotFound() {
        // ARRANGE: Un ID de préstamo que no existe
        Long nonExistentLoanId = 99L;

        // Mockeo: findById devuelve Optional vacío para simular que no se encuentra
        when(loanRepository.findById(nonExistentLoanId)).thenReturn(Optional.empty());

        // ACT & ASSERT: Esperamos que se lance ResourceNotFoundException
        assertThrows(ResourceNotFoundException.class, () -> {
            loanService.markLoanAsPaid(nonExistentLoanId);
        }, "Debe lanzar ResourceNotFoundException si el préstamo no se encuentra.");

        // Verificar que se intentó buscar el préstamo una vez
        verify(loanRepository, times(1)).findById(nonExistentLoanId);
        // VERIFICACIÓN CRÍTICA: Asegurarse de que NUNCA se intentó guardar nada
        verify(loanRepository, never()).save(any(LoanEntity.class));
        // VERIFICACIÓN CRÍTICA: Asegurarse de que NO se intentó cambiar el estado del cliente
        verify(clientService, never()).updateStatus(anyLong(), any(ClientStatus.class));
    }

    // =========================================================================================================
    // MÉTODO: getUnpaidReceivedLoansByClientId
    // =========================================================================================================

    @Test
    void getUnpaidReceivedLoansByClientId_Success_WhenClientHasUnpaidLoans() {
        // ARRANGE: Cliente existente y una lista simulada de préstamos RECEIVED con deuda
        Long clientId = clientActive.getId(); // Usamos el cliente activo del setUp
        LoanEntity unpaidLoan1 = LoanEntity.builder()
                .id(30L)
                .client(clientActive)
                .status(LoanStatus.RECEIVED)
                .totalPenalty(2000.0)
                .build();
        LoanEntity unpaidLoan2 = LoanEntity.builder()
                .id(31L)
                .client(clientActive)
                .status(LoanStatus.RECEIVED)
                .totalPenalty(1500.0)
                .build();
        List<LoanEntity> unpaidLoansList = List.of(unpaidLoan1, unpaidLoan2);

        // Mockeo:
        // 1. Encontrar al cliente
        when(clientRepository.findById(clientId)).thenReturn(Optional.of(clientActive));
        // 2. Simular que el repositorio devuelve la lista de deudas para ese cliente
        when(loanRepository.findByClientAndStatusAndTotalPenaltyGreaterThan(
                clientActive, LoanStatus.RECEIVED, 0.0))
                .thenReturn(unpaidLoansList);

        // ACT: Llamar al método del servicio
        List<LoanEntity> resultList = loanService.getUnpaidReceivedLoansByClientId(clientId);

        // ASSERT: Verificar que la lista devuelta es la esperada
        assertNotNull(resultList);
        assertEquals(2, resultList.size()); // Esperamos 2 préstamos
        // Podemos verificar IDs o penalidades si queremos ser más específicos
        assertTrue(resultList.stream().anyMatch(loan -> loan.getId().equals(30L) && loan.getTotalPenalty() == 2000.0));
        assertTrue(resultList.stream().anyMatch(loan -> loan.getId().equals(31L) && loan.getTotalPenalty() == 1500.0));

        // Verificar que se llamó a los métodos correctos del repositorio
        verify(clientRepository, times(1)).findById(clientId);
        verify(loanRepository, times(1)).findByClientAndStatusAndTotalPenaltyGreaterThan(
                clientActive, LoanStatus.RECEIVED, 0.0);
    }

    @Test
    void getUnpaidReceivedLoansByClientId_Success_ReturnsEmptyListWhenNoUnpaidLoans() {
        // ARRANGE: Cliente existente sin deudas pendientes
        Long clientId = clientActive.getId();

        // Mockeo:
        // 1. Encontrar al cliente
        when(clientRepository.findById(clientId)).thenReturn(Optional.of(clientActive));
        // 2. SIMULAR QUE EL REPOSITORIO DEVUELVE UNA LISTA VACÍA
        when(loanRepository.findByClientAndStatusAndTotalPenaltyGreaterThan(
                clientActive, LoanStatus.RECEIVED, 0.0))
                .thenReturn(Collections.emptyList()); // Lista vacía = sin deudas

        // ACT: Llamar al método del servicio
        List<LoanEntity> resultList = loanService.getUnpaidReceivedLoansByClientId(clientId);

        // ASSERT: Verificar que la lista devuelta está vacía
        assertNotNull(resultList);
        assertTrue(resultList.isEmpty()); // La lista debe estar vacía

        // Verificar que se llamó a los métodos correctos del repositorio
        verify(clientRepository, times(1)).findById(clientId);
        verify(loanRepository, times(1)).findByClientAndStatusAndTotalPenaltyGreaterThan(
                clientActive, LoanStatus.RECEIVED, 0.0);
    }

    @Test
    void getUnpaidReceivedLoansByClientId_Fails_WhenClientNotFound() {
        // ARRANGE: Un ID de cliente que no existe
        Long nonExistentClientId = 99L;

        // Mockeo: findById del cliente devuelve Optional vacío
        when(clientRepository.findById(nonExistentClientId)).thenReturn(Optional.empty());

        // ACT & ASSERT: Esperamos que se lance ResourceNotFoundException
        assertThrows(ResourceNotFoundException.class, () -> {
            loanService.getUnpaidReceivedLoansByClientId(nonExistentClientId);
        }, "Debe lanzar ResourceNotFoundException si el cliente no se encuentra.");

        // Verificar que se intentó buscar al cliente
        verify(clientRepository, times(1)).findById(nonExistentClientId);
        // VERIFICACIÓN CRÍTICA: Asegurarse de que NO se intentó buscar préstamos
        verify(loanRepository, never()).findByClientAndStatusAndTotalPenaltyGreaterThan(
                any(ClientEntity.class), any(LoanStatus.class), anyDouble());
    }

}