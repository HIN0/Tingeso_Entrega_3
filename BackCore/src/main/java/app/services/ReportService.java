package app.services;

import org.springframework.stereotype.Service;

import app.entities.ClientEntity;
import app.entities.LoanEntity;
import app.entities.enums.ClientStatus;
import app.entities.enums.LoanStatus;
import app.repositories.ClientRepository;
import app.repositories.LoanRepository;

import java.time.LocalDate;
import java.util.List;

@Service
public class ReportService {

    private final LoanRepository loanRepository;
    private final ClientRepository clientRepository; 

    public ReportService(LoanRepository loanRepository, ClientRepository clientRepository) {
        this.loanRepository = loanRepository;
        this.clientRepository = clientRepository;
    }

    // --- RF6.1: Préstamos por estado (CON FILTRO DE FECHA OPCIONAL) ---
    public List<LoanEntity> getLoansByStatus(String status, LocalDate from, LocalDate to) {
        LoanStatus loanStatus = LoanStatus.valueOf(status);
        // Si las fechas son nulas, llama al método sin filtro
        if (from == null || to == null) {
            return loanRepository.findByStatus(loanStatus);
        } else {
            // Si hay fechas, llama al nuevo método con filtro
            // Validar que 'from' no sea posterior a 'to'
            if (from.isAfter(to)) {
                throw new IllegalArgumentException("Start date cannot be after end date.");
            }
            return loanRepository.findByStatusAndStartDateBetween(loanStatus, from, to);
        }
    }

    // --- RF6.2: Clientes con préstamos atrasados (CON FILTRO DE FECHA OPCIONAL) ---
    public List<ClientEntity> getClientsWithLateLoans(LocalDate from, LocalDate to) {
        // Si las fechas son nulas, busca todos los clientes con préstamos LATE
        if (from == null || to == null) {
            return loanRepository.findByStatus(LoanStatus.LATE).stream()
                    .map(LoanEntity::getClient)
                    .distinct()
                    .toList();
        } else {
            // Si hay fechas, llama al nuevo método del repositorio
            if (from.isAfter(to)) {
                throw new IllegalArgumentException("Start date cannot be after end date.");
            }
            return loanRepository.findDistinctClientsByStatusAndStartDateBetween(LoanStatus.LATE, from, to);
        }
    }

    // --- RF6.3: Ranking (sin cambios, ya acepta fechas) ---
    public List<Object[]> getTopTools(LocalDate from, LocalDate to) {
        if (from == null || to == null) {
            throw new IllegalArgumentException("Date range is required for Top Tools report.");
        }
        if (from.isAfter(to)) {
            throw new IllegalArgumentException("Start date cannot be after end date.");
        }
        return loanRepository.findTopToolsByDateRange(from, to);
    }

    // --- Clientes restringidos ---
    public List<ClientEntity> getRestrictedClients() {
        return clientRepository.findByStatus(ClientStatus.RESTRICTED);
    }
}