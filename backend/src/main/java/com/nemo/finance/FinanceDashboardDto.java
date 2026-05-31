package com.nemo.finance;

import java.math.BigDecimal;
import java.util.List;

public class FinanceDashboardDto {

    public record DashboardSummary(
            BigDecimal totalBudget,
            BigDecimal totalExpenses,
            BigDecimal totalPaymentsReceived,
            BigDecimal totalPaymentsPending,
            BigDecimal collectionRate,
            long pendingExpenseApprovals
    ) {}

    public record ProjectFinance(
            Long projectId,
            String projectName,
            BigDecimal budget,
            BigDecimal laborCost,
            BigDecimal expenses,
            BigDecimal paymentsReceived,
            BigDecimal collectionProgress,
            BigDecimal cpi,
            BigDecimal spi,
            long pendingExpenses
    ) {}

    public record OverduePayment(
            Long paymentId,
            Long projectId,
            String projectName,
            String title,
            BigDecimal amount,
            String dueDate,
            long daysOverdue
    ) {}

    public record DashboardResponse(
            DashboardSummary summary,
            List<ProjectFinance> byProject,
            List<OverduePayment> overduePayments
    ) {}

    public record PaymentDto(
            Long id,
            Long projectId,
            String projectName,
            String title,
            java.math.BigDecimal amount,
            String currency,
            String dueDate,
            String receivedDate,
            String status,
            String invoiceRef,
            Long createdById,
            String createdByName,
            String createdAt,
            String updatedAt,
            Long delayDays
    ) {}

    public record YearPaymentsResponse(
            int year,
            List<PaymentDto> pending,
            List<PaymentDto> received,
            List<PaymentDto> overdue
    ) {}
}