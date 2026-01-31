package services;

import entities.ClientEntity;
import entities.LoanEntity;
import entities.ToolEntity;
import entities.UserEntity;
import entities.enums.ClientStatus;
import entities.enums.LoanStatus;
import entities.enums.ToolStatus;
import repositories.LoanRepository;
import repositories.ClientRepository;
import repositories.ToolRepository;
import app.exceptions.InvalidOperationException; 
import app.exceptions.ResourceNotFoundException;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class LoanService {

    private final LoanRepository loanRepository;
    private final ClientRepository clientRepository;
    private final ToolRepository toolRepository;
    private final ToolService toolService;
    private final TariffService tariffService;
    private final ClientService clientService;

    // --- Constructor ---
    public LoanService(LoanRepository loanRepository,
                       ClientRepository clientRepository,
                       ToolRepository toolRepository,
                       ToolService toolService,
                       KardexService kardexService,
                       TariffService tariffService,
                       ClientService clientService) {
        this.loanRepository = loanRepository;
        this.clientRepository = clientRepository;
        this.toolRepository = toolRepository;
        this.toolService = toolService;
        this.tariffService = tariffService;
        this.clientService = clientService;
    }

    // ########################################################################################################################################################
    // ####################################################### MÉTODOS DE PRÉSTAMO ############################################################################
    // ########################################################################################################################################################
    // METODO ENVOLVENTE PARA CREAR PRÉSTAMO CON FECHA DE INICIO HOY
    @Transactional
    public LoanEntity createLoan(Long clientId, Long toolId, LocalDate dueDate, UserEntity user) {
        return createLoan(clientId, toolId, LocalDate.now(), dueDate, user);
    }

    // MÉTODO PRINCIPAL PARA CREAR PRÉSTAMO
    @Transactional
    public LoanEntity createLoan(Long clientId, Long toolId, LocalDate startDate, LocalDate dueDate, UserEntity user) {
        // 0. Obtener Cliente y Herramienta ---
        ClientEntity client = clientRepository.findById(clientId)
                .orElseThrow(() -> new ResourceNotFoundException("Client not found with id: " + clientId));
        ToolEntity tool = toolRepository.findById(toolId)
                .orElseThrow(() -> new ResourceNotFoundException("Tool not found with id: " + toolId));

        //  ############################################# Validaciones de Negocio #############################################
        // 1. Estado General del Cliente
        if (client.getStatus() == ClientStatus.RESTRICTED) {
            throw new InvalidOperationException("Client is restricted and cannot request loans.");
        }

        // 2. Verificar préstamos ATRASADOS (STATUS LATE)
        long lateLoanCount = loanRepository.countByClientAndStatus(client, LoanStatus.LATE);
        if (lateLoanCount > 0) {
            throw new InvalidOperationException("Client has " + lateLoanCount + " late loan(s) that must be returned.");
        }

        // 3. Verificar DEUDAS PENDIENTES (STATUS RECEIVED con totalPenalty > 0)
        List<LoanEntity> unpaidReceivedLoans = loanRepository.findByClientAndStatusAndTotalPenaltyGreaterThan(client, LoanStatus.RECEIVED, 0.0);
        if (!unpaidReceivedLoans.isEmpty()) {
            throw new InvalidOperationException("Client has outstanding payments due for " + unpaidReceivedLoans.size() + " previous loan(s).");
        }

        // 4. Disponibilidad de Herramienta
        if (tool.getStatus() != ToolStatus.AVAILABLE || tool.getStock() == null || tool.getStock() <= 0) {
            throw new InvalidOperationException("Tool is not available or out of stock.");
        }

        // 5. Fechas Válidas
        if (startDate == null) startDate = LocalDate.now();
        if (dueDate == null) throw new IllegalArgumentException("dueDate is required.");
        if (dueDate.isBefore(startDate)) {
            throw new IllegalArgumentException("Due date cannot be before start date.");
        }

        // 6. Límite de 5 Préstamos Activos/Atrasados (Ya incluye LATE, está bien)
        long activeOrLateCount = loanRepository.findByClientAndStatus(client, LoanStatus.ACTIVE).size() + lateLoanCount;
        if (activeOrLateCount >= 5) {
            throw new InvalidOperationException("Client has reached the maximum number of active/late loans (5).");
        }

        // 7. No Repetir Herramienta Activa/Atrasada (Ya incluye LATE, está bien)
        boolean hasSameToolActiveOrLate = loanRepository.findByClientAndStatus(client, LoanStatus.ACTIVE).stream()
                .anyMatch(l -> l.getTool() != null && l.getTool().getId().equals(toolId))
                ||
                loanRepository.findByClientAndStatus(client, LoanStatus.LATE).stream() // Re-chequeo por si acaso
                .anyMatch(l -> l.getTool() != null && l.getTool().getId().equals(toolId));
        if (hasSameToolActiveOrLate) {
            throw new InvalidOperationException("Client already has an active or late loan for this tool.");
        }

        // --- Crear y Guardar Préstamo ---
        LoanEntity loan = LoanEntity.builder()
                .client(client)
                .tool(tool)
                .startDate(startDate)
                .dueDate(dueDate)
                .status(LoanStatus.ACTIVE)
                .totalPenalty(0.0)
                .build();

        toolService.decrementStockForLoan(tool, user);
        return loanRepository.save(loan);
    }

    // ########################################################################################################################################################
    // ####################################################### MÉTODOS DE DEVOLUCION ##########################################################################
    // ########################################################################################################################################################
    // MÉTODO ENVOLVENTE PARA DEVOLVER PRÉSTAMO CON FECHA DE DEVOLUCIÓN HOY
    @Transactional
    public LoanEntity returnLoan(Long loanId, Long toolId, boolean damaged, boolean irreparable, UserEntity user) {
        return returnLoan(loanId, toolId, damaged, irreparable, user, LocalDate.now());
    }

    // MÉTODO PRINCIPAL PARA DEVOLVER PRÉSTAMO
    @Transactional
    public LoanEntity returnLoan(Long loanId, Long toolId, boolean damaged, boolean irreparable, UserEntity user, LocalDate returnDate) {
        // 0. Obtener Préstamo y Herramienta ---
        LoanEntity loan = loanRepository.findById(loanId)
                .orElseThrow(() -> new ResourceNotFoundException("Loan not found with id: " + loanId));

        // 1. Verificar que el toolId recibido coincida con el del préstamo original
        if (!loan.getTool().getId().equals(toolId)) {
            throw new IllegalArgumentException("Tool ID (" + toolId + ") does not match the tool ID in the loan (" + loan.getTool().getId() + ").");
        }
        ToolEntity tool = loan.getTool(); // Ya tenemos la herramienta desde el préstamo

        // --- Validar estado del préstamo ---
        if (loan.getStatus() != LoanStatus.ACTIVE && loan.getStatus() != LoanStatus.LATE) {
            throw new InvalidOperationException("Loan is already closed and cannot be returned again.");
        }

        // --- Validar fecha de devolución ---
        if (returnDate == null) returnDate = LocalDate.now();
        if (returnDate.isBefore(loan.getStartDate())) {
            throw new IllegalArgumentException("Return date cannot be before the loan start date.");
        }

        // ----------------------------------------------------------------------------------------------------------------------------------------------------
        // --- Calcular Costo de Arriendo (ÉPICA 4 / RN Épica 2) ---
        long rentalDays = ChronoUnit.DAYS.between(loan.getStartDate(), loan.getDueDate());
        // RN: tarifa mínima siempre es 1 día
        if (rentalDays < 1) {
            rentalDays = 1;
        }
        // Obtener la tarifa diaria de arriendo (Necesita método en TariffService)
        double rentalCost = rentalDays * tariffService.getDailyRentFee();
        
        // ----------------------------------------------------------------------------------------------------------------------------------------------------
        // --- Calcular Multa por Atraso (ÉPICA 2 / 4) ---
        long delayDays = ChronoUnit.DAYS.between(loan.getDueDate(), returnDate);
        double lateFee = 0.0;
        if (delayDays > 0) {
            lateFee = delayDays * tariffService.getDailyLateFee();
        }

        // ----------------------------------------------------------------------------------------------------------------------------------------------------
        // --- Calcular Penalidades por Daño (ÉPICA 1 / 2 / 4) ---
        double damagePenalty = 0.0;
        if (damaged) {
            if (irreparable) {
                // Baja definitiva: cobrar reposición
                damagePenalty = tool.getReplacementValue();
                toolService.markAsDecommissioned(tool, user); // Esto ya registra DECOMMISSION en Kardex
            } else {
                // Reparación: cobrar tarifa de reparación
                damagePenalty = tariffService.getRepairFee();
                toolService.markAsRepairing(tool, user); // Esto ya registra REPAIR en Kardex y ajusta stock
            }
        } else {
            // Devuelta en buen estado: vuelve a stock
            toolService.incrementStockForReturn(tool, user); // Esto ya registra RETURN en Kardex
        }

        // ----------------------------------------------------------------------------------------------------------------------------------------------------
        // --- Calcular Total a Pagar y Actualizar Préstamo ---
        boolean ON_TIME = returnDate.isBefore(loan.getDueDate()) || returnDate.isEqual(loan.getDueDate());
        boolean DELAYED = returnDate.isAfter(loan.getDueDate());
        
        if (ON_TIME) {
            double totalAmountDue = rentalCost + damagePenalty;
            loan.setTotalPenalty(totalAmountDue);
        } else if (DELAYED) {
            double totalAmountDue = rentalCost + lateFee + damagePenalty;
            loan.setTotalPenalty(totalAmountDue);
        }

        loan.setReturnDate(returnDate);
        loan.setStatus(LoanStatus.RECEIVED); // Se recibe la herramienta, pendiente de pago

        // --- Guardar Préstamo ---
        LoanEntity savedLoan = loanRepository.save(loan);
        clientService.updateStatus(loan.getClient().getId(), ClientStatus.RESTRICTED); // Cliente queda RESTRINGIDO hasta pagar

        // Devolver el préstamo actualizado
        return savedLoan;
    }

    // ########################################################################################################################################################
    // ####################################################### OTROS METODOS ##################################################################################
    // ########################################################################################################################################################
    // --------------------------------------------------------------------------------------------------------------------------------------------------------
    // --- MÉTODO MODIFICADO PARA MARCAR COMO PAGADO (SOLO PAGA, NO ACTIVA) ---
    @Transactional
    public LoanEntity markLoanAsPaid(Long loanId) {
        // 1. Encontrar el préstamo
        LoanEntity loan = loanRepository.findById(loanId)
                .orElseThrow(() -> new ResourceNotFoundException("Loan not found with id: " + loanId));

        // 2. Validar que sea un préstamo RECIBIDO y con deuda
        if (loan.getStatus() != LoanStatus.RECEIVED) {
            throw new InvalidOperationException("Only received loans can be marked as paid. Current status: " + loan.getStatus());
        }

        // 3. Marcar como pagado (penalidad a 0) y CERRAR el préstamo
        loan.setTotalPenalty(0.0);
        loan.setStatus(LoanStatus.CLOSED); // <- Importante: pasa a CLOSED
        LoanEntity savedLoan = loanRepository.save(loan);

        // 4. NO intentamos reactivar al cliente aquí. Devolvemos el préstamo actualizado.
        return savedLoan;
    }


    @Transactional(readOnly = true)
        public List<LoanEntity> getUnpaidReceivedLoansByClientId(Long clientId) {
        // 1. Buscar el cliente para asegurarse de que existe
        ClientEntity client = clientRepository.findById(clientId)
                .orElseThrow(() -> new ResourceNotFoundException("Client not found with id: " + clientId));

        // 2. Usar el método del repositorio para buscar préstamos RECEIVED con penalidad > 0
        return loanRepository.findByClientAndStatusAndTotalPenaltyGreaterThan(
                client,
                LoanStatus.RECEIVED,
                0.0 // Umbral de penalidad
        );
    }

    @Transactional(readOnly = true)
    public LoanEntity getLoanById(Long loanId) {
        return loanRepository.findById(loanId)
                .orElseThrow(() -> new ResourceNotFoundException("Loan not found with id: " + loanId));
    }

    @Transactional(readOnly = true)
    public List<LoanEntity> getActiveLoans() {
        return loanRepository.findByStatus(LoanStatus.ACTIVE);
    }

    @Transactional(readOnly = true)
    public List<LoanEntity> getLateLoans() {
        return loanRepository.findByStatus(LoanStatus.LATE);
    }
}