package com.nemo.bankstatement;

import java.math.BigDecimal;

public record BankStatementDto(
        Long id,
        Long bankAccountId,
        String fileName,
        String periodStart,
        String periodEnd,
        BigDecimal totalDebits,
        BigDecimal totalCredits,
        BigDecimal openingBalance,
        BigDecimal closingBalance,
        BigDecimal computedDebits,
        BigDecimal computedCredits,
        boolean matched,
        int transactionCount,
        String createdAt,
        String updatedAt
) {
    public record ImportResult(
            Long statementId,
            int importedCount,
            boolean matched,
            String warning
    ) {}
}