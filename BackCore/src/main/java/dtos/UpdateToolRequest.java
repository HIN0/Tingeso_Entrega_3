package dtos;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

// Este DTO solo incluye los campos que se pueden editar
public record UpdateToolRequest(
    @NotBlank(message = "Name cannot be blank")
    String name,

    @NotBlank(message = "Category cannot be blank")
    String category,

    @NotNull(message = "Replacement value cannot be null")
    @Min(value = 1000, message = "Replacement value cannot be negative")
    Integer replacementValue
) {}