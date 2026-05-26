package com.nemo.expense;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

public record ProjectExpenseDto(
        Long id,
        Long projectId,
        String category,
        String amount,
        String description,
        String expenseDate,
        Long createdById,
        String createdByName,
        String createdAt,
        String updatedAt
) {
    public record CreateRequest(
            @NotNull String category,
            @NotNull @DecimalMin("0.01") String amount,
            String description,
            @NotNull String expenseDate
    ) {}

    public record UpdateRequest(
            String category,
            String amount,
            String description,
            String expenseDate
    ) {}
}