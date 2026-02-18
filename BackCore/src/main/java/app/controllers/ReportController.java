package app.controllers;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import app.entities.ClientEntity;
import app.entities.LoanEntity;
import app.services.ReportService;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/reports")
public class ReportController {

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    // --- RF6.1: Modificado para aceptar fechas opcionales ---
    @GetMapping("/loans")
    public List<LoanEntity> getLoansByStatus(
            @RequestParam String status,
            // Usar required = false para que las fechas sean opcionales
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        // Pasar las fechas (que pueden ser null) al servicio
        return reportService.getLoansByStatus(status.toUpperCase(), from, to);
    }

    // --- RF6.2: Modificado para aceptar fechas opcionales ---
    @GetMapping("/clients/late")
    public List<ClientEntity> getLateClients(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        // Pasar las fechas (que pueden ser null) al servicio
        return reportService.getClientsWithLateLoans(from, to);
    }

    // --- RF6.3: Herramientas más Prestadas ---
    @GetMapping("/tools/top")
    public List<Object[]> getTopTools(
            // Mantener required = true o quitarlo si @RequestParam es obligatorio por defecto
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return reportService.getTopTools(from, to);
    }
}