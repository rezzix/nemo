package com.nemo.reconciliation;

import java.math.BigDecimal;
import java.util.List;

public class ReconciliationDto {

    public record UnreconciledTransactionDto(
            Long id,
            Long bankAccountId,
            String bankAccountName,
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
    ) {}

    public record UnmatchedPaymentDto(
            Long id,
            Long projectId,
            String projectName,
            String title,
            BigDecimal amount,
            String currency,
            String dueDate,
            String receivedDate,
            String status,
            String invoiceRef,
            boolean reconciled
    ) {}

    public record ReconcileRequest(
            Long paymentId,
            String externalNote
    ) {}

    public record UnreconciledCountDto(
            long count
    ) {}

    public record ReconciliationViewDto(
            List<UnreconciledTransactionDto> transactions,
            List<UnmatchedPaymentDto> unmatchedPayments,
            long unreconciledCount
    ) {}
}