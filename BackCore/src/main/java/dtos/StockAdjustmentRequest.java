package dtos;

import jakarta.validation.constraints.NotNull;

public record StockAdjustmentRequest(
    @NotNull(message = "Quantity change cannot be null")
    Integer quantityChange // Puede ser positivo (añadir) o negativo (quitar)
) {}