package app.services;

import jakarta.validation.Valid;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.validation.annotation.Validated;

import app.exceptions.ResourceNotFoundException;
import app.repositories.ToolRepository;
import app.dtos.UpdateToolRequest;
import app.entities.ToolEntity;
import app.entities.UserEntity;
import app.entities.enums.MovementType;
import app.entities.enums.ToolStatus;
import app.exceptions.InvalidOperationException;

import java.util.List;

@Service
@Validated
public class ToolService {

    private final ToolRepository toolRepository;
    private final KardexService kardexService;

    public ToolService(ToolRepository toolRepository, KardexService kardexService) {
        this.toolRepository = toolRepository;
        this.kardexService = kardexService;
    }

    // --- MÉTODOS DE CONSULTA ---

    public List<ToolEntity> getAllTools() {
        return toolRepository.findAll();
    }

    public ToolEntity getToolById(Long id) {
        return toolRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Tool not found with id: " + id));
    }

    // --- MÉTODOS DE MODIFICACIÓN ---

    @Transactional
    public ToolEntity createTool(@Valid ToolEntity tool, UserEntity user) {

        // --- Asegurar valor default para inRepair ANTES de guardar ---
        if (tool.getInRepair() == null) {
            tool.setInRepair(0); // Establecer 0 si viene nulo
        }
        // Asignación de estado inicial (si es null)
        if (tool.getStatus() == null) {
            // Si stock > 0 -> AVAILABLE, si stock == 0 -> AVAILABLE (según @Min(0) para cargar datos iniciales pero eso frena con el frontend)
            tool.setStatus(ToolStatus.AVAILABLE);
        } else if (tool.getStock() > 0 && tool.getStatus() != ToolStatus.AVAILABLE) {
             // Forzar AVAILABLE si hay stock pero se envió otro estado (ej. LOANED)
            tool.setStatus(ToolStatus.AVAILABLE);
        }

        // ------ Guardar herramienta y registrar movimiento en Kardex ------
        // Si se envía stock 0 y estado AVAILABLE, es válido.
        ToolEntity saved = toolRepository.save(tool);
        // Registrar movimiento en Kardex solo si el stock inicial es mayor que 0
        if (saved.getStock() > 0) {
            kardexService.registerMovement(saved, MovementType.INCOME, saved.getStock(), user);
        }
        return saved;
    }

    @Transactional
    public ToolEntity updateTool(Long id, UpdateToolRequest updateRequest, UserEntity user) {
        ToolEntity existingTool = getToolById(id);

        if (existingTool.getReplacementValue() < 1000) {
            throw new InvalidOperationException("Cannot update a tool with replacement value less than $1000.");
        }

        existingTool.setName(updateRequest.name());
        existingTool.setCategory(updateRequest.category());
        existingTool.setReplacementValue(updateRequest.replacementValue()); // @Min(1000) se valida en el DTO/Controller
        return toolRepository.save(existingTool);
    }

    @Transactional
    public ToolEntity decommissionTool(Long id, UserEntity user) {
        ToolEntity tool = getToolById(id);

        if (tool.getStatus() == ToolStatus.DECOMMISSIONED) {
            throw new InvalidOperationException("Tool is already decommissioned.");
        }
        if (tool.getStatus() == ToolStatus.LOANED || tool.getStatus() == ToolStatus.REPAIRING) {
            throw new InvalidOperationException("Cannot decommission a tool while loaned or under repair.");
        }

        int quantityToDecommission = tool.getStock() > 0 ? tool.getStock() : 1;
        tool.setStatus(ToolStatus.DECOMMISSIONED);
        tool.setStock(0);
        ToolEntity saved = toolRepository.save(tool);

        kardexService.registerMovement(saved, MovementType.DECOMMISSION, quantityToDecommission, user);
        return saved;
    }

    // ===== Métodos de soporte para préstamos/devoluciones =====

    @Transactional
    public void incrementStockForReturn(ToolEntity tool, UserEntity user) {
        int newStock = (tool.getStock() == null ? 0 : tool.getStock()) + 1;
        // Si estaba en estado LOANED, y ahora hay stock, cambiar a AVAILABLE
        if (tool.getStatus() == ToolStatus.LOANED) {
            tool.setStatus(ToolStatus.AVAILABLE);
        }
        tool.setStock(newStock);
        toolRepository.save(tool);
        kardexService.registerMovement(tool, MovementType.RETURN, 1, user);
    }

    @Transactional
    public void decrementStockForLoan(ToolEntity tool, UserEntity user) {
        tool.setStock(tool.getStock() - 1);

        if (tool.getStock() == 0) {
            tool.setStatus(ToolStatus.LOANED);
        }
        toolRepository.save(tool);
        kardexService.registerMovement(tool, MovementType.LOAN, 1, user);
    }

    @Transactional
    public void markAsRepairing(ToolEntity tool, UserEntity user) {
        if (tool.getStatus() == ToolStatus.DECOMMISSIONED) {
            throw new InvalidOperationException("Cannot mark a decommissioned tool as repairing.");
        }
        //Aumento unidades en reparación y no toco stock disponible
        tool.setInRepair(tool.getInRepair() + 1);
        kardexService.registerMovement(tool, MovementType.REPAIR, 1, user); // Registra que 1 unidad entró a reparación
    }

    @Transactional
    public void markAsDecommissioned(ToolEntity tool, UserEntity user) {
        // Solo permito dar de baja si no está ya de baja
        if (tool.getStatus() == ToolStatus.DECOMMISSIONED) {
            throw new InvalidOperationException("Tool is already decommissioned.");
        }
        kardexService.registerMovement(tool, MovementType.DECOMMISSION, 1, user);
    }


    // --- MÉTODO PARA AJUSTE MANUAL DE STOCK ---
    @Transactional
    public ToolEntity adjustStock(Long id, int quantityChange, MovementType movementType, UserEntity user) {
        if (quantityChange == 0) {
            throw new InvalidOperationException("Quantity change cannot be zero.");
        }

        if (quantityChange > 0 && movementType != MovementType.INCOME) {
            throw new InvalidOperationException("Positive stock adjustment requires INCOME movement type.");
        }
        if (quantityChange < 0 && movementType != MovementType.MANUAL_DECREASE) {
            throw new InvalidOperationException("Negative stock adjustment requires MANUAL_DECREASE movement type.");
        }

        ToolEntity tool = getToolById(id);
        if (tool.getStatus() == ToolStatus.DECOMMISSIONED) {
            throw new InvalidOperationException("Cannot adjust stock for a decommissioned tool.");
        }

        int newStock = tool.getStock() + quantityChange;
        if (newStock < 0) {
            throw new InvalidOperationException("Stock adjustment would result in negative stock.");
        }

        tool.setStock(newStock);

        // Actualizar estado basado en el nuevo stock
        if (newStock > 0 && tool.getStatus() != ToolStatus.REPAIRING) {
            tool.setStatus(ToolStatus.AVAILABLE);
        } else if (newStock == 0 && (tool.getStatus() == ToolStatus.AVAILABLE || tool.getStatus() == ToolStatus.LOANED) ) {
            tool.setStatus(ToolStatus.LOANED);
        }

        ToolEntity saved = toolRepository.save(tool);
        kardexService.registerMovement(saved, movementType, Math.abs(quantityChange), user);

        return saved;
    }
}