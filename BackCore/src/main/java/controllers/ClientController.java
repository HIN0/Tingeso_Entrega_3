package controllers;

import dtos.UpdateClientRequest;
import entities.ClientEntity;
import entities.enums.ClientStatus;
import jakarta.validation.Valid; 
import services.ClientService;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/clients")
@CrossOrigin("*")
@PreAuthorize("hasRole('ADMIN')")
public class ClientController {

    private final ClientService clientService;

    public ClientController(ClientService clientService) { 
        this.clientService = clientService;
    }

    @GetMapping
    public List<ClientEntity> getAllClients() {
        return clientService.getAllClients();
    }

    @GetMapping("/{id}")
    public ClientEntity getClientById(@PathVariable Long id) {
        return clientService.getClientById(id);
    }

    @PostMapping
    public ClientEntity createClient(@Valid @RequestBody ClientEntity client) {
        return clientService.createClient(client);
    }

    @PutMapping("/{id}")
    public ClientEntity updateClientDetails(@PathVariable Long id, @Valid @RequestBody UpdateClientRequest updateRequest) {
        return clientService.updateClientDetails(id, updateRequest);
    }

    @PatchMapping("/{id}/status")
    public ClientEntity updateClientStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        String statusStr = body.get("status");
        if (statusStr == null) {
            throw new IllegalArgumentException("Status is required");
        }
        try {
            ClientStatus status = ClientStatus.valueOf(statusStr.toUpperCase());
            return clientService.updateStatus(id, status);
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid status value: " + statusStr + ". Must be ACTIVE or RESTRICTED.");
        }
    }

    @PatchMapping("/{id}/activate")
    public ResponseEntity<ClientEntity> attemptReactivation(@PathVariable Long id) {
        ClientEntity potentiallyUpdatedClient = clientService.attemptClientReactivation(id);
        // Devuelve el estado final del cliente: puede seguir RESTRICTED si falló, o ACTIVE si tuvo éxito
        return ResponseEntity.ok(potentiallyUpdatedClient);
    }
}