package com.nemo.bankaccount;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record BankAccountDto(
        Long id,
        Long companyId,
        String companyName,
        String name,
        String iban,
        String currency,
        BigDecimal currentBalance,
        boolean active,
        String createdAt,
        String updatedAt
) {
    public record CreateRequest(
            Long companyId,
            @NotBlank String name,
            @NotBlank @Size(min = 5, max = 34) String iban,
            @NotBlank @Size(min = 3, max = 3) String currency,
            @NotNull BigDecimal openingBalance
    ) {}

    public record UpdateRequest(
            String name,
            String iban,
            String currency
    ) {}
}