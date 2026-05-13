package com.nemo.timetracking;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;

public record TimeLogDto(
        Long id, BigDecimal hours, LocalDate logDate, String description,
        Long taskId, String taskKey, String taskTitle,
        Long presaleId, String presaleName,
        Long userId, String userName,
        String createdAt, String updatedAt
) {
    public record CreateRequest(
            Long taskId,
            Long presaleId,
            @DecimalMin("0.01") BigDecimal hours,
            @NotNull LocalDate logDate,
            String description
    ) {}

    public record UpdateRequest(
            BigDecimal hours, LocalDate logDate, String description
    ) {}
}