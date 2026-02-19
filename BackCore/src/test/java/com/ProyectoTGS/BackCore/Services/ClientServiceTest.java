package com.ProyectoTGS.BackCore.Services;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import app.services.ClientService;
import app.dtos.UpdateClientRequest;
import app.entities.ClientEntity;
import app.entities.LoanEntity;
import app.entities.enums.ClientStatus;
import app.entities.enums.LoanStatus;
import app.exceptions.InvalidOperationException;
import app.exceptions.ResourceNotFoundException;
import app.repositories.ClientRepository;
import app.repositories.LoanRepository;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyDouble;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class ClientServiceTest {

    @Mock
    private ClientRepository clientRepository;

    @InjectMocks
    private ClientService clientService;

    private ClientEntity newClient;
    private ClientEntity existingClient;

    @BeforeEach
    void setUp() {
        // Cliente nuevo con todos los campos requeridos
        newClient = ClientEntity.builder()
                .name("Juan Perez")
                .rut("11.111.111-1")
                .phone("912345678")
                .email("juan@example.com")
                .status(null) // Para probar asignación de estado por defecto
                .build();

        // Cliente existente
        existingClient = ClientEntity.builder()
                .id(1L)
                .name("Maria Lopez")
                .rut("22.222.222-2")
                .phone("988887777")
                .email("maria@example.com")
                .status(ClientStatus.ACTIVE)
                .build();
    }

    // =======================================================================
    // MÉTODO: createClient
    // =======================================================================

    @Test
    void createClient_Success() {
        // ARRANGE: Simular que el RUT no existe y que la persistencia devuelve el objeto guardado
        when(clientRepository.existsByRut(newClient.getRut())).thenReturn(false);
        // Capturar el argumento pasado a save para verificar el estado
        when(clientRepository.save(any(ClientEntity.class))).thenAnswer(invocation -> {
            ClientEntity clientToSave = invocation.getArgument(0);
            // Simular asignación de ID por la BD
            if (clientToSave.getId() == null) clientToSave.setId(99L);
             // Asegurar estado ACTIVE si era null
            if (clientToSave.getStatus() == null) clientToSave.setStatus(ClientStatus.ACTIVE);
            return clientToSave;
        });

        // ACT
        ClientEntity created = clientService.createClient(newClient);

        // ASSERT: Verifica que se guarde como ACTIVE (estado por defecto)
        assertNotNull(created);
        assertEquals(ClientStatus.ACTIVE, created.getStatus());
        verify(clientRepository, times(1)).save(newClient);
    }

    @Test
    void createClient_FailsIfRutAlreadyExists() {
        // ARRANGE: Simular que el RUT ya está en la base de datos
        when(clientRepository.existsByRut(newClient.getRut())).thenReturn(true);

        // ACT & ASSERT
        assertThrows(IllegalArgumentException.class, () -> {
            clientService.createClient(newClient);
        }, "Debe fallar si el RUT ya existe.");
        verify(clientRepository, never()).save(any());
    }

    @Test
    void createClient_FailsIfRequiredFieldIsNull_Name() {
        // ARRANGE: Probar nombre nulo
        newClient.setName(null);

        // ACT & ASSERT
        assertThrows(IllegalArgumentException.class, () -> {
            clientService.createClient(newClient);
        }, "Debe fallar si falta el nombre.");
        verify(clientRepository, never()).save(any());
    }

    @Test
    void createClient_FailsIfRequiredFieldIsNull_Rut() {
        // ARRANGE: Probar RUT nulo
        newClient.setRut(null);

        // ACT & ASSERT
        assertThrows(IllegalArgumentException.class, () -> {
            clientService.createClient(newClient);
        }, "Debe fallar si falta el RUT.");
        verify(clientRepository, never()).save(any());
    }

    @Test
    void createClient_FailsIfRequiredFieldIsNull_Phone() {
        // ARRANGE: Probar teléfono nulo
        newClient.setPhone(null);

        // ACT & ASSERT
        assertThrows(IllegalArgumentException.class, () -> {
            clientService.createClient(newClient);
        }, "Debe fallar si falta el teléfono.");
        verify(clientRepository, never()).save(any());
    }

     @Test
    void createClient_FailsIfRequiredFieldIsNull_Email() {
        // ARRANGE: Probar email nulo
        newClient.setEmail(null);

        // ACT & ASSERT
        assertThrows(IllegalArgumentException.class, () -> {
            clientService.createClient(newClient);
        }, "Debe fallar si falta el email.");
        verify(clientRepository, never()).save(any());
    }

    // =======================================================================
    // MÉTODO: updateStatus
    // =======================================================================

    @Test
    void updateStatus_ToRestricted_Success() {
        // ARRANGE: Simular que el cliente existe y está activo
        when(clientRepository.findById(1L)).thenReturn(Optional.of(existingClient));
        when(clientRepository.save(any(ClientEntity.class))).thenReturn(existingClient);

        // ACT: Cambiar estado a RESTRICTED
        ClientEntity updated = clientService.updateStatus(1L, ClientStatus.RESTRICTED);

        // ASSERT
        assertEquals(ClientStatus.RESTRICTED, updated.getStatus());
        verify(clientRepository, times(1)).save(existingClient);
    }

    @Test
    void updateStatus_ToActive_Success() {
        // ARRANGE: Simular que el cliente existe y cambiar estado a ACTIVE
        existingClient.setStatus(ClientStatus.RESTRICTED);
        when(clientRepository.findById(1L)).thenReturn(Optional.of(existingClient));
        when(clientRepository.save(any(ClientEntity.class))).thenReturn(existingClient);

        // ACT: Cambiar estado a ACTIVE
        ClientEntity updated = clientService.updateStatus(1L, ClientStatus.ACTIVE);

        // ASSERT
        assertEquals(ClientStatus.ACTIVE, updated.getStatus());
        verify(clientRepository, times(1)).save(existingClient);
    }

    @Test
    void updateStatus_FailsIfClientNotFound() {
        // ARRANGE: Simular que el cliente NO existe
        when(clientRepository.findById(99L)).thenReturn(Optional.empty());

        // ACT & ASSERT: Espera ResourceNotFoundException
        assertThrows(ResourceNotFoundException.class, () -> {
            clientService.updateStatus(99L, ClientStatus.RESTRICTED);
        }, "Debe fallar si el cliente no es encontrado.");
        verify(clientRepository, never()).save(any());
    }

    // =======================================================================
    // MÉTODO: updateClientDetails
    // =======================================================================
    @Test
    void updateClientDetails_Success() {
        // ARRANGE: Datos para actualizar y mockeo del repositorio
        Long clientId = 1L;
        UpdateClientRequest updateRequest = new UpdateClientRequest(
                "Maria Lopez Actualizada", // Nuevo nombre
                "987654321",                // Nuevo teléfono
                "maria.actualizada@example.com" // Nuevo email
        );

        // Cliente existente ANTES de la actualización (con RUT y Status originales)
        ClientEntity clientBeforeUpdate = ClientEntity.builder()
                .id(clientId)
                .name("Maria Lopez")
                .rut("22.222.222-2")
                .phone("911223344")
                .email("maria@example.com")
                .status(ClientStatus.ACTIVE)
                .build();

        when(clientRepository.findById(clientId)).thenReturn(Optional.of(clientBeforeUpdate));
        // Simular que save devuelve la entidad que se le pasa para verificarla
        when(clientRepository.save(any(ClientEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // ACT: Llamar al método del servicio
        ClientEntity updatedClient = clientService.updateClientDetails(clientId, updateRequest);

        // ASSERT: Verificar los campos actualizados y los que NO deben cambiar
        assertNotNull(updatedClient);
        assertEquals(clientId, updatedClient.getId()); // ID no cambia
        assertEquals("Maria Lopez Actualizada", updatedClient.getName()); // Nombre actualizado
        assertEquals("987654321", updatedClient.getPhone());               // Teléfono actualizado
        assertEquals("maria.actualizada@example.com", updatedClient.getEmail()); // Email actualizado
        assertEquals("22.222.222-2", updatedClient.getRut());             // RUT NO debe cambiar
        assertEquals(ClientStatus.ACTIVE, updatedClient.getStatus());      // Status NO debe cambiar

        // Verificar que se llamó a save una vez con la entidad correcta
        verify(clientRepository, times(1)).findById(clientId);
        verify(clientRepository, times(1)).save(argThat(client ->
                client.getId().equals(clientId) &&
                client.getName().equals("Maria Lopez Actualizada") &&
                client.getPhone().equals("987654321") &&
                client.getEmail().equals("maria.actualizada@example.com") &&
                client.getRut().equals("22.222.222-2") && // Asegurarse que los campos no editables siguen igual
                client.getStatus().equals(ClientStatus.ACTIVE)
        ));
    }

    @Test
    void updateClientDetails_FailsWhenClientNotFound() {
        // ARRANGE: Un ID de cliente que no existe y datos de actualización
        Long nonExistentClientId = 99L;
        UpdateClientRequest updateRequest = new UpdateClientRequest(
                "Nombre No Importa",
                "123456789",
                "noexiste@example.com"
        );

        // Mockeo: findById devuelve Optional vacío para simular que no se encuentra
        when(clientRepository.findById(nonExistentClientId)).thenReturn(Optional.empty());

        // ACT & ASSERT: Esperamos que se lance ResourceNotFoundException
        assertThrows(ResourceNotFoundException.class, () -> {
            clientService.updateClientDetails(nonExistentClientId, updateRequest);
        }, "Debe lanzar ResourceNotFoundException si el cliente no se encuentra.");

        // Verificar que findById fue llamado
        verify(clientRepository, times(1)).findById(nonExistentClientId);
        // VERIFICACIÓN CRÍTICA: Asegurarse de que NUNCA se intentó guardar nada
        verify(clientRepository, never()).save(any(ClientEntity.class));
    }

// =======================================================================
    // MÉTODO: attemptClientReactivation
    // =======================================================================

    @Mock // Necesitamos mockear LoanRepository también
    private LoanRepository loanRepository;

    @Test
    void attemptClientReactivation_Success_WhenNoDebtsOrLateLoans() {
        // ARRANGE: Cliente restringido pero sin deudas ni atrasos
        Long clientId = 3L;
        ClientEntity restrictedClient = ClientEntity.builder()
                .id(clientId)
                .name("Pedro Restringido")
                .status(ClientStatus.RESTRICTED)
                .build();

        // Mockeo:
        // 1. Encontrar al cliente
        when(clientRepository.findById(clientId)).thenReturn(Optional.of(restrictedClient));
        // 2. Verificar que no hay préstamos LATE
        when(loanRepository.countByClientAndStatus(restrictedClient, LoanStatus.LATE)).thenReturn(0L); // 0 préstamos LATE
        // 3. Verificar que no hay préstamos RECEIVED con deuda
        when(loanRepository.findByClientAndStatusAndTotalPenaltyGreaterThan(restrictedClient, LoanStatus.RECEIVED, 0.0))
                .thenReturn(Collections.emptyList()); // Lista vacía = sin deudas
        // 4. Simular el guardado (cuando se llama a updateStatus internamente)
        //    Devuelve el cliente con el estado ya cambiado a ACTIVE
        when(clientRepository.save(any(ClientEntity.class))).thenAnswer(invocation -> {
            ClientEntity clientToSave = invocation.getArgument(0);
            clientToSave.setStatus(ClientStatus.ACTIVE); // Simulamos el cambio de estado
            return clientToSave;
        });


        // ACT: Intentar reactivar al cliente
        ClientEntity reactivatedClient = clientService.attemptClientReactivation(clientId);

        // ASSERT: Verificar que el estado cambió a ACTIVE
        assertNotNull(reactivatedClient);
        assertEquals(ClientStatus.ACTIVE, reactivatedClient.getStatus());

        // Verificar que se realizaron las comprobaciones necesarias
        verify(clientRepository, times(2)).findById(clientId);
        verify(loanRepository, times(1)).countByClientAndStatus(restrictedClient, LoanStatus.LATE);
        verify(loanRepository, times(1)).findByClientAndStatusAndTotalPenaltyGreaterThan(restrictedClient, LoanStatus.RECEIVED, 0.0);
        // Verificar que se guardó el cambio de estado
        verify(clientRepository, times(1)).save(argThat(client ->
                client.getId().equals(clientId) && client.getStatus().equals(ClientStatus.ACTIVE)
        ));
    }

    @Test
    void attemptClientReactivation_DoesNothing_WhenClientAlreadyActive() {
        // ARRANGE: Cliente que ya está ACTIVO
        Long clientId = 4L;
        ClientEntity activeClient = ClientEntity.builder()
                .id(clientId)
                .name("Ana Activa")
                .status(ClientStatus.ACTIVE) // Estado inicial es ACTIVE
                .build();

        // Mockeo: Encontrar al cliente activo
        when(clientRepository.findById(clientId)).thenReturn(Optional.of(activeClient));

        // ACT: Intentar reactivar al cliente ya activo
        ClientEntity resultClient = clientService.attemptClientReactivation(clientId);

        // ASSERT: Verificar que el cliente devuelto sigue siendo el mismo y está ACTIVO
        assertNotNull(resultClient);
        assertEquals(clientId, resultClient.getId());
        assertEquals(ClientStatus.ACTIVE, resultClient.getStatus());

        // Verificar que solo se llamó a findById una vez
        verify(clientRepository, times(1)).findById(clientId);
        // VERIFICACIÓN CRÍTICA: Asegurarse de que NO se hicieron chequeos de préstamos
        verify(loanRepository, never()).countByClientAndStatus(any(ClientEntity.class), any(LoanStatus.class));
        verify(loanRepository, never()).findByClientAndStatusAndTotalPenaltyGreaterThan(any(ClientEntity.class), any(LoanStatus.class), anyDouble());
        // VERIFICACIÓN CRÍTICA: Asegurarse de que NO se intentó guardar nada
        verify(clientRepository, never()).save(any(ClientEntity.class));
    }

    @Test
    void attemptClientReactivation_Fails_WhenClientHasLateLoans() {
        // ARRANGE: Cliente restringido con préstamos atrasados
        Long clientId = 5L;
        ClientEntity restrictedClientWithLateLoan = ClientEntity.builder()
                .id(clientId)
                .name("Carlos Atrasado")
                .status(ClientStatus.RESTRICTED)
                .build();

        // Mockeo:
        // 1. Encontrar al cliente
        when(clientRepository.findById(clientId)).thenReturn(Optional.of(restrictedClientWithLateLoan));
        // 2. SIMULAR QUE TIENE PRÉSTAMOS LATE (devolver > 0)
        when(loanRepository.countByClientAndStatus(restrictedClientWithLateLoan, LoanStatus.LATE)).thenReturn(1L); // Tiene 1 préstamo LATE

        // ACT & ASSERT: Esperamos que lance InvalidOperationException
        assertThrows(InvalidOperationException.class, () -> {
            clientService.attemptClientReactivation(clientId);
        }, "Debe lanzar InvalidOperationException porque el cliente tiene préstamos LATE.");

        // Verificar que se hicieron las comprobaciones hasta el punto de fallo
        verify(clientRepository, times(1)).findById(clientId);
        verify(loanRepository, times(1)).countByClientAndStatus(restrictedClientWithLateLoan, LoanStatus.LATE);
        // VERIFICACIÓN CRÍTICA: Asegurarse de que NO continuó verificando deudas RECEIVED
        verify(loanRepository, never()).findByClientAndStatusAndTotalPenaltyGreaterThan(any(ClientEntity.class), any(LoanStatus.class), anyDouble());
        // VERIFICACIÓN CRÍTICA: Asegurarse de que NO se intentó guardar (cambiar estado)
        verify(clientRepository, never()).save(any(ClientEntity.class));
    }

    @Test
    void attemptClientReactivation_Fails_WhenClientHasUnpaidReceivedLoans() {
        // ARRANGE: Cliente restringido sin atrasos LATE, pero con deudas RECEIVED
        Long clientId = 6L;
        ClientEntity restrictedClientWithDebt = ClientEntity.builder()
                .id(clientId)
                .name("Daniela Deudora")
                .status(ClientStatus.RESTRICTED)
                .build();

        // Simular un préstamo RECEIVED con penalidad pendiente
        LoanEntity unpaidLoan = LoanEntity.builder()
                .id(101L)
                .client(restrictedClientWithDebt)
                .status(LoanStatus.RECEIVED)
                .totalPenalty(5000.0) // Tiene deuda pendiente
                .build();

        // Mockeo:
        // 1. Encontrar al cliente
        when(clientRepository.findById(clientId)).thenReturn(Optional.of(restrictedClientWithDebt));
        // 2. No tiene préstamos LATE
        when(loanRepository.countByClientAndStatus(restrictedClientWithDebt, LoanStatus.LATE)).thenReturn(0L);
        // 3. SIMULAR QUE TIENE DEUDAS PENDIENTES (lista NO vacía)
        when(loanRepository.findByClientAndStatusAndTotalPenaltyGreaterThan(restrictedClientWithDebt, LoanStatus.RECEIVED, 0.0))
                .thenReturn(List.of(unpaidLoan)); // Devuelve una lista con el préstamo pendiente

        // ACT & ASSERT: Esperamos que lance InvalidOperationException
        assertThrows(InvalidOperationException.class, () -> {
            clientService.attemptClientReactivation(clientId);
        }, "Debe lanzar InvalidOperationException porque el cliente tiene deudas pendientes.");

        // Verificar que se hicieron las comprobaciones hasta el punto de fallo
        verify(clientRepository, times(1)).findById(clientId);
        verify(loanRepository, times(1)).countByClientAndStatus(restrictedClientWithDebt, LoanStatus.LATE);
        verify(loanRepository, times(1)).findByClientAndStatusAndTotalPenaltyGreaterThan(restrictedClientWithDebt, LoanStatus.RECEIVED, 0.0);
        // VERIFICACIÓN CRÍTICA: Asegurarse de que NO se intentó guardar (cambiar estado)
        verify(clientRepository, never()).save(any(ClientEntity.class));
    }

    @Test
    void attemptClientReactivation_Fails_WhenClientNotFound() {
        // ARRANGE: Un ID de cliente que no existe
        Long nonExistentClientId = 99L;

        // Mockeo: findById devuelve Optional vacío para simular que no se encuentra
        when(clientRepository.findById(nonExistentClientId)).thenReturn(Optional.empty());

        // ACT & ASSERT: Esperamos que se lance ResourceNotFoundException directamente desde getClientById
        assertThrows(ResourceNotFoundException.class, () -> {
            clientService.attemptClientReactivation(nonExistentClientId);
        }, "Debe lanzar ResourceNotFoundException si el cliente no se encuentra.");

        // Verificar que solo se intentó buscar al cliente una vez
        verify(clientRepository, times(1)).findById(nonExistentClientId);
        // VERIFICACIÓN CRÍTICA: Asegurarse de que NO se hicieron chequeos de préstamos
        verify(loanRepository, never()).countByClientAndStatus(any(ClientEntity.class), any(LoanStatus.class));
        verify(loanRepository, never()).findByClientAndStatusAndTotalPenaltyGreaterThan(any(ClientEntity.class), any(LoanStatus.class), anyDouble());
        // VERIFICACIÓN CRÍTICA: Asegurarse de que NO se intentó guardar nada
        verify(clientRepository, never()).save(any(ClientEntity.class));
    }

    // =======================================================================
    // MÉTODO: getAllClients
    // =======================================================================

    @Test
    void getAllClients_ReturnsListOfClients() {
        // ARRANGE: Crear una lista de clientes simulada
        ClientEntity client1 = ClientEntity.builder().id(1L).name("Cliente Uno").build();
        ClientEntity client2 = ClientEntity.builder().id(2L).name("Cliente Dos").build();
        List<ClientEntity> mockClientList = Arrays.asList(client1, client2);

        // Mockeo: findAll() devuelve la lista simulada
        when(clientRepository.findAll()).thenReturn(mockClientList);

        // ACT: Llamar al método del servicio
        List<ClientEntity> resultList = clientService.getAllClients();

        // ASSERT: Verificar que la lista devuelta no sea nula y contenga el número esperado de elementos
        assertNotNull(resultList);
        assertEquals(2, resultList.size());
        assertEquals("Cliente Uno", resultList.get(0).getName());
        assertEquals("Cliente Dos", resultList.get(1).getName());

        // Verificar que findAll() fue llamado exactamente una vez
        verify(clientRepository, times(1)).findAll();
    }

    @Test
    void getAllClients_ReturnsEmptyListWhenNoClients() {
        // ARRANGE: Mockeo para devolver una lista vacía
        when(clientRepository.findAll()).thenReturn(Collections.emptyList());

        // ACT: Llamar al método del servicio
        List<ClientEntity> resultList = clientService.getAllClients();

        // ASSERT: Verificar que la lista devuelta no sea nula y esté vacía
        assertNotNull(resultList);
        assertTrue(resultList.isEmpty());

        // Verificar que findAll() fue llamado exactamente una vez
        verify(clientRepository, times(1)).findAll();
    }

    // =======================================================================
    // MÉTODO: getClientById
    // =======================================================================

    @Test
    void getClientById_Success_WhenClientExists() {
        // ARRANGE: Un cliente existente
        Long clientId = 1L;
        ClientEntity existingClientTest = ClientEntity.builder()
                .id(clientId)
                .name("Cliente Existente")
                .rut("11.111.111-1")
                .status(ClientStatus.ACTIVE)
                .build();

        // Mockeo: findById devuelve el Optional con el cliente
        when(clientRepository.findById(clientId)).thenReturn(Optional.of(existingClientTest));

        // ACT: Llamar al método del servicio
        ClientEntity foundClient = clientService.getClientById(clientId);

        // ASSERT: Verificar que el cliente devuelto es el esperado
        assertNotNull(foundClient);
        assertEquals(clientId, foundClient.getId());
        assertEquals("Cliente Existente", foundClient.getName());

        // Verificar que findById fue llamado una vez
        verify(clientRepository, times(1)).findById(clientId);
    }

    @Test
    void getClientById_Fails_WhenClientNotFound() {
        // ARRANGE: Un ID de cliente que no existe
        Long nonExistentClientId = 99L;

        // Mockeo: findById devuelve Optional vacío
        when(clientRepository.findById(nonExistentClientId)).thenReturn(Optional.empty());

        // ACT & ASSERT: Esperamos que se lance ResourceNotFoundException
        assertThrows(ResourceNotFoundException.class, () -> {
            clientService.getClientById(nonExistentClientId);
        }, "Debe lanzar ResourceNotFoundException si el cliente no se encuentra.");

        // Verificar que findById fue llamado una vez
        verify(clientRepository, times(1)).findById(nonExistentClientId);
    }
}