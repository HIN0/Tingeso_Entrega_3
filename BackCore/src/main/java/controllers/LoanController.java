package controllers;

import dtos.LoanRequest;
import dtos.ReturnLoanRequest;
import entities.LoanEntity;
import entities.UserEntity;
import jakarta.validation.Valid;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import services.LoanService;
import app.utils.SecurityUtils;

import java.util.List;

@RestController
@RequestMapping("/loans")
@CrossOrigin("*")
public class LoanController {

    private final LoanService loanService;
    private final SecurityUtils securityUtils; 

    public LoanController(LoanService loanService, SecurityUtils securityUtils) { 
        this.loanService = loanService;
        this.securityUtils = securityUtils;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public List<LoanEntity> getAllLoans() {
        List<LoanEntity> active = loanService.getActiveLoans();
        List<LoanEntity> late = loanService.getLateLoans();
        active.addAll(late);
        return active;
        }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public ResponseEntity<LoanEntity> getLoanById(@PathVariable Long id) {
        LoanEntity loan = loanService.getLoanById(id);
        return ResponseEntity.ok(loan);
    }

    @GetMapping("/client/{clientId}/unpaid")
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public ResponseEntity<List<LoanEntity>> getUnpaidLoansForClient(@PathVariable Long clientId) {
        List<LoanEntity> unpaidLoans = loanService.getUnpaidReceivedLoansByClientId(clientId);
        return ResponseEntity.ok(unpaidLoans);
    }

    @PostMapping(consumes = "application/json", produces = "application/json")
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public LoanEntity createLoanJson(@RequestBody @Valid LoanRequest req, Authentication authentication) {
        UserEntity currentUser = securityUtils.getUserFromAuthentication(authentication);
        return loanService.createLoan(req.clientId(), req.toolId(), req.startDate(), req.dueDate(), currentUser);
    }

    @PutMapping(path = "/{id}/return", consumes = "application/json", produces = "application/json")
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public LoanEntity returnLoanJson(@PathVariable Long id, @RequestBody @Valid ReturnLoanRequest req, Authentication authentication) {
        UserEntity currentUser = securityUtils.getUserFromAuthentication(authentication);
        return loanService.returnLoan(
            id,
            req.toolId(),
            req.damaged(),
            req.irreparable(),
            currentUser,
            req.returnDate()
            );
        }

    @PatchMapping("/{loanId}/pay")
    @PreAuthorize("hasAnyRole('ADMIN')")
    public ResponseEntity<LoanEntity> markLoanAsPaid(@PathVariable Long loanId) {
        LoanEntity updatedLoan = loanService.markLoanAsPaid(loanId);
        // Devuelve el préstamo actualizado (con estado CLOSED y penalty 0)
        return ResponseEntity.ok(updatedLoan);
    }
}