package com.nemo.banktransaction;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record BankTransactionDto(
        Long id,
        Long bankAccountId,
        Long bankStatementId,
        String date,
        String description,
        BigDecimal amount,
        String currency,
        String reference,
        String status,
        Long projectPaymentId,
        String projectPaymentTitle,
        String externalNote,
        String createdAt,
        String updatedAt
) {
    public record CreateRequest(
            @NotBlank String date,
            @NotBlank String description,
            @NotNull BigDecimal amount,
            String currency,
            String reference
    ) {}

    public record UpdateRequest(
            String description,
            String reference,
            String status
    ) {}
}