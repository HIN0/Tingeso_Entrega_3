package app.services;

import app.dtos.UpdateClientRequest;
import app.entities.ClientEntity;
import app.entities.LoanEntity;
import app.entities.enums.ClientStatus;
import app.entities.enums.LoanStatus;
import app.exceptions.InvalidOperationException;
import app.exceptions.ResourceNotFoundException;
import app.repositories.ClientRepository;
import app.repositories.LoanRepository;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional; 
import org.springframework.validation.annotation.Validated;

@Service
@Validated
@Slf4j
public class ClientService {

    private final ClientRepository clientRepository;
    private final LoanRepository loanRepository;

    public ClientService(ClientRepository clientRepository, LoanRepository loanRepository) {
        this.clientRepository = clientRepository;
        this.loanRepository = loanRepository;
    }

    public List<ClientEntity> getAllClients() {
        return clientRepository.findAll();
    }

    public ClientEntity getClientById(Long id) {
        return clientRepository.findById(id)
        .orElseThrow(() -> new ResourceNotFoundException("Client not found with id: " + id));
    }

    @Transactional
    public ClientEntity createClient(@Valid ClientEntity client) {
        // Validaciones básicas ya en la entidad o vía @Valid
        if (client.getName() == null || client.getRut() == null || client.getPhone() == null || client.getEmail() == null) {
            throw new IllegalArgumentException("Client must have name, rut, phone, and email");
        }
        if (clientRepository.existsByRut(client.getRut())) {
            // Excepción personalizada
            throw new IllegalArgumentException("Client with this RUT already exists");
        }
        // Asignar estado inicial explícitamente si no viene (aunque ya lo hace)
        if (client.getStatus() == null) {
            client.setStatus(ClientStatus.ACTIVE);
        }
        return clientRepository.save(client);
    }

    @Transactional 
    public ClientEntity updateStatus(Long id, ClientStatus status) {
        // Usar método auxiliar getClientById
        ClientEntity client = getClientById(id);
        client.setStatus(status);
        return clientRepository.save(client);
    }

    @Transactional
    public ClientEntity updateClientDetails(Long id, @Valid UpdateClientRequest updateRequest) {
        ClientEntity client = getClientById(id);
        // Actualizar solo los campos permitidos desde el DTO
        client.setName(updateRequest.name());
        client.setPhone(updateRequest.phone());
        client.setEmail(updateRequest.email());
        // RUT y Status no se modifican aquí segun RF 3.2
        return clientRepository.save(client); // Guardar cambios
    }

    @Transactional
    public ClientEntity attemptClientReactivation(Long clientId) {
        // 1. Obtener el cliente
        ClientEntity client = getClientById(clientId);

        // 2. Si ya está activo, no hacer nada
        if (client.getStatus() == ClientStatus.ACTIVE) {
            log.info("Client with id {} is already active.", clientId);
            return client;
        }

        // 3. Verificar si tiene préstamos ATRASADOS (LATE)
        long lateLoanCount = loanRepository.countByClientAndStatus(client, LoanStatus.LATE);
        if (lateLoanCount > 0) {
            throw new InvalidOperationException("Cannot reactivate client: " + lateLoanCount + " late loan(s) found.");
        }

        // 4. Verificar si tiene deudas PENDIENTES (RECEIVED con totalPenalty > 0)
        List<LoanEntity> unpaidReceivedLoans = loanRepository.findByClientAndStatusAndTotalPenaltyGreaterThan(
                client, LoanStatus.RECEIVED, 0.0);
        if (!unpaidReceivedLoans.isEmpty()) {
            throw new InvalidOperationException("Cannot reactivate client: " + unpaidReceivedLoans.size() + " unpaid loan(s) found.");
        }

        // 5. Si pasa las validaciones, reactivar el cliente
        // En lugar de llamar a updateStatus(clientId, ...),
        // modificamos el objeto 'client' que ya tenemos en memoria y lo guardamos.
        // Esto evita la autoinvocación y asegura que la transacción sea válida.
        client.setStatus(ClientStatus.ACTIVE);
        return clientRepository.save(client);
    }
}