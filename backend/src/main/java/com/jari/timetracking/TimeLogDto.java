package com.jari.timetracking;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;

public record TimeLogDto(
        Long id, BigDecimal hours, LocalDate logDate, String description,
        Long issueId, String issueKey, String issueTitle,
        Long presaleId, String presaleName,
        Long userId, String userName,
        String createdAt, String updatedAt
) {
    public record CreateRequest(
            Long issueId,
            Long presaleId,
            @DecimalMin("0.01") BigDecimal hours,
            @NotNull LocalDate logDate,
            String description
    ) {}

    public record UpdateRequest(
            BigDecimal hours, LocalDate logDate, String description
    ) {}
}