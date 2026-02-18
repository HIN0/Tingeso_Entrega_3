package app.services;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import app.entities.KardexEntity;
import app.entities.ToolEntity;
import app.entities.UserEntity;
import app.entities.enums.MovementType;
import app.exceptions.ResourceNotFoundException;
import app.repositories.KardexRepository;
import app.repositories.ToolRepository;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class KardexService {

    private final KardexRepository kardexRepository;
    private final ToolRepository toolRepository;

    public KardexService(KardexRepository kardexRepository, ToolRepository toolRepository) {
        this.kardexRepository = kardexRepository;
        this.toolRepository = toolRepository;
    }

    // ---------------------------------------------------------------------------------------------------------------------
    @Transactional
    public void registerMovement(ToolEntity tool, MovementType type, int quantity, UserEntity user) {
        // 1. Validar si la herramienta existe antes de registrar
        if (tool == null || tool.getId() == null || !toolRepository.existsById(tool.getId())) {
            throw new ResourceNotFoundException("Cannot register movement for non-existent tool.");
        }
        // 2. Crear y guardar el movimiento en Kardex
        KardexEntity movement = KardexEntity.builder()
                .tool(tool)
                .type(type)
                .movementDate(LocalDateTime.now())
                .quantity(quantity)
                .user(user)
                .build();
        kardexRepository.save(movement);
    }

    // ---------------------------------------------------------------------------------------------------------------------
    @Transactional(readOnly = true)
    public List<KardexEntity> getMovementsByTool(ToolEntity tool) {
        if (tool == null || tool.getId() == null) {
            throw new IllegalArgumentException("Tool entity cannot be null.");
        }
        return kardexRepository.findByTool_Id(tool.getId());
    }

    // ---------------------------------------------------------------------------------------------------------------------
    @Transactional(readOnly = true)
    public List<KardexEntity> getMovementsByToolId(Long toolId) {
        // 1. Validar que el ID no sea nulo
        if (toolId == null) {
            throw new IllegalArgumentException("Tool ID cannot be null.");
        }
        // 2. Verificar si la herramienta existe
        if (!toolRepository.existsById(toolId)) {
            throw new ResourceNotFoundException("Tool not found with id: " + toolId);
        }
        // 3. Buscar los movimientos por el ID de la herramienta
        return kardexRepository.findByTool_Id(toolId);
    }

    // ---------------------------------------------------------------------------------------------------------------------
    @Transactional(readOnly = true)
    public List<KardexEntity> getMovementsByDate(LocalDateTime startDate, LocalDateTime endDate) {
        // 1. Validar fechas 
        if (startDate == null || endDate == null) {
            throw new IllegalArgumentException("Start and end dates cannot be null.");
        }
        // 2. Validar que la fecha de fin no sea anterior a la de inicio
        if (endDate.isBefore(startDate)) {
            throw new IllegalArgumentException("End date cannot be before start date.");
        }
        // 3. Consultar movimientos en el rango de fechas
        return kardexRepository.findByMovementDateBetween(startDate, endDate);
    }
}