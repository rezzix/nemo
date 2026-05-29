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
}