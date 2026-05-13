package com.nemo.timetracking;

import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record UserRateDto(
        Long id,
        Long userId,
        String username,
        BigDecimal hourlyRate,
        String effectiveFrom,
        String createdAt,
        String updatedAt
) {
    public record CreateRequest(
            @NotNull Long userId,
            @NotNull BigDecimal hourlyRate,
            @NotNull String effectiveFrom
    ) {}

    public record UpdateRequest(
            BigDecimal hourlyRate,
            String effectiveFrom
    ) {}
}