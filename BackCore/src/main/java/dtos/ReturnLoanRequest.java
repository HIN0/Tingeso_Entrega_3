package dtos;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public record ReturnLoanRequest(
    @NotNull Long toolId,
    @NotNull Boolean damaged,
    @NotNull Boolean irreparable,
    @JsonFormat(pattern = "yyyy-MM-dd") LocalDate returnDate
) {}
