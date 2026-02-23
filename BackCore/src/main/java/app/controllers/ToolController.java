package app.controllers;

import jakarta.validation.Valid;
import app.services.ToolService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import app.dtos.StockAdjustmentRequest;
import app.dtos.UpdateToolRequest;
import app.entities.ToolEntity;
import app.entities.UserEntity;
import app.entities.enums.MovementType;
import app.utils.SecurityUtils;

import java.util.List;

@RestController
@RequestMapping("/tools")
public class ToolController {

    private final ToolService toolService;
    private final SecurityUtils securityUtils;

    public ToolController(ToolService toolService, SecurityUtils securityUtils) {
        this.toolService = toolService;
        this.securityUtils = securityUtils;
    }

    @GetMapping
    public List<ToolEntity> getAllTools() {
        return toolService.getAllTools();
    }

    @GetMapping("/{id}")
    public ToolEntity getToolById(@PathVariable Long id) {
        return toolService.getToolById(id);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public ToolEntity createTool(@Valid @RequestBody ToolEntity tool, Authentication authentication) {
        UserEntity currentUser = securityUtils.getUserFromAuthentication(authentication);
        return toolService.createTool(tool, currentUser);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ToolEntity updateTool(@PathVariable Long id, @Valid @RequestBody UpdateToolRequest updateRequest, Authentication authentication) {
        UserEntity currentUser = securityUtils.getUserFromAuthentication(authentication);
        return toolService.updateTool(id, updateRequest, currentUser);
    }

    @PatchMapping("/{id}/stock")
    @PreAuthorize("hasRole('ADMIN')")
    public ToolEntity adjustStock(@PathVariable Long id, @Valid @RequestBody StockAdjustmentRequest request, Authentication authentication) {
        UserEntity currentUser = securityUtils.getUserFromAuthentication(authentication);

        // Determina el tipo de movimiento correcto basado en el signo de quantityChange
        MovementType type;
        if (request.quantityChange() > 0) {
            type = MovementType.INCOME; // Usa INCOME para aumentos manuales
        } else if (request.quantityChange() < 0) {
            type = MovementType.MANUAL_DECREASE; // Usa el nuevo tipo para disminuciones
        } else {
            // El servicio ya valida quantityChange != 0, pero por si acaso
            throw new IllegalArgumentException("Quantity change cannot be zero.");
        }
        return toolService.adjustStock(id, request.quantityChange(), type, currentUser);
    }

    @PatchMapping("/{id}/decommission")
    @PreAuthorize("hasRole('ADMIN')")
    public ToolEntity decommissionTool(@PathVariable Long id, Authentication authentication) {
        UserEntity currentUser = securityUtils.getUserFromAuthentication(authentication);
        return toolService.decommissionTool(id, currentUser);
    }
}