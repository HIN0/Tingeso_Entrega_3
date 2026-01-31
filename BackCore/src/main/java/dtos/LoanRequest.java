package dtos;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.FutureOrPresent;
import java.time.LocalDate;

public record LoanRequest(
    @NotNull Long clientId,
    @NotNull Long toolId,
    @NotNull @JsonFormat(pattern = "yyyy-MM-dd") LocalDate startDate,
    @NotNull @FutureOrPresent @JsonFormat(pattern = "yyyy-MM-dd") LocalDate dueDate
) {}
