package com.nemo.finance;

import com.nemo.expense.ProjectExpense;
import com.nemo.expense.ProjectExpenseRepository;
import com.nemo.payment.ProjectPayment;
import com.nemo.payment.ProjectPaymentRepository;
import com.nemo.payment.ProjectPaymentService;
import com.nemo.pmo.PmoService;
import com.nemo.project.Project;
import com.nemo.project.ProjectRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

@Service
public class FinanceService {

    private final ProjectRepository projectRepository;
    private final ProjectExpenseRepository expenseRepository;
    private final ProjectPaymentRepository paymentRepository;
    private final ProjectPaymentService paymentService;
    private final PmoService pmoService;

    public FinanceService(ProjectRepository projectRepository,
                         ProjectExpenseRepository expenseRepository,
                         ProjectPaymentRepository paymentRepository,
                         ProjectPaymentService paymentService,
                         PmoService pmoService) {
        this.projectRepository = projectRepository;
        this.expenseRepository = expenseRepository;
        this.paymentRepository = paymentRepository;
        this.paymentService = paymentService;
        this.pmoService = pmoService;
    }

    @Transactional(readOnly = true)
    public FinanceDashboardDto.YearPaymentsResponse getYearPayments(int year) {
        LocalDate start = LocalDate.of(year, 1, 1);
        LocalDate end = LocalDate.of(year, 12, 31);
        LocalDate today = LocalDate.now();

        List<ProjectPayment> dueInYear = paymentRepository.findByDueDateBetweenOrderByDueDateAsc(start, end).stream()
                .filter(p -> p.getStatus() != ProjectPayment.PaymentStatus.RECEIVED)
                .toList();

        // Split overdue (past due) vs pending (due today/future or no due date)
        List<ProjectPayment> overdueList = dueInYear.stream()
                .filter(p -> p.getDueDate() != null && p.getDueDate().isBefore(today))
                .toList();
        List<ProjectPayment> pendingList = dueInYear.stream()
                .filter(p -> p.getDueDate() == null || !p.getDueDate().isBefore(today))
                .toList();

        List<ProjectPayment> receivedList = paymentRepository.findByReceivedDateBetweenOrderByReceivedDateAsc(start, end);

        return new FinanceDashboardDto.YearPaymentsResponse(
                year,
                pendingList.stream().map(this::toPaymentDto).toList(),
                receivedList.stream().map(this::toPaymentDto).toList(),
                overdueList.stream().map(p -> toOverduePaymentDto(p, today)).toList()
        );
    }

    private FinanceDashboardDto.PaymentDto toOverduePaymentDto(ProjectPayment p, LocalDate today) {
        Long delayDays = p.getDueDate() != null ? ChronoUnit.DAYS.between(p.getDueDate(), today) : 0;

        return new FinanceDashboardDto.PaymentDto(
                p.getId(),
                p.getProject().getId(),
                p.getProject().getName(),
                p.getTitle(),
                p.getAmount(),
                p.getCurrency(),
                p.getDueDate() != null ? p.getDueDate().toString() : null,
                null,
                p.getStatus().name(),
                p.getInvoiceRef(),
                p.getCreatedBy() != null ? p.getCreatedBy().getId() : null,
                p.getCreatedBy() != null ? p.getCreatedBy().getFirstName() + " " + p.getCreatedBy().getLastName() : null,
                p.getCreatedAt() != null ? p.getCreatedAt().toString() : null,
                p.getUpdatedAt() != null ? p.getUpdatedAt().toString() : null,
                delayDays
        );
    }

    private FinanceDashboardDto.PaymentDto toPaymentDto(ProjectPayment p) {
        Long delayDays = null;
        if (p.getReceivedDate() != null && p.getDueDate() != null) {
            delayDays = ChronoUnit.DAYS.between(p.getDueDate(), p.getReceivedDate());
        }

        return new FinanceDashboardDto.PaymentDto(
                p.getId(),
                p.getProject().getId(),
                p.getProject().getName(),
                p.getTitle(),
                p.getAmount(),
                p.getCurrency(),
                p.getDueDate() != null ? p.getDueDate().toString() : null,
                p.getReceivedDate() != null ? p.getReceivedDate().toString() : null,
                p.getStatus().name(),
                p.getInvoiceRef(),
                p.getCreatedBy() != null ? p.getCreatedBy().getId() : null,
                p.getCreatedBy() != null ? p.getCreatedBy().getFirstName() + " " + p.getCreatedBy().getLastName() : null,
                p.getCreatedAt() != null ? p.getCreatedAt().toString() : null,
                p.getUpdatedAt() != null ? p.getUpdatedAt().toString() : null,
                delayDays
        );
    }

    @Transactional(readOnly = true)
    public FinanceDashboardDto.DashboardResponse getDashboard(Long companyId) {
        List<Project> projects = projectRepository.findAllByCompanyIdOrNull(companyId);

        BigDecimal totalBudget = BigDecimal.ZERO;
        BigDecimal totalExpenses = BigDecimal.ZERO;
        BigDecimal totalPaymentsReceived = BigDecimal.ZERO;
        BigDecimal totalPaymentsPending = BigDecimal.ZERO;
        long pendingExpenseApprovals = 0;

        List<FinanceDashboardDto.ProjectFinance> byProject = new ArrayList<>();

        for (Project project : projects) {
            Long pid = project.getId();
            PmoService.EvmMetrics evm = pmoService.computeEvm(pid);

            BigDecimal budget = evm.budget() != null ? evm.budget() : BigDecimal.ZERO;
            BigDecimal laborCost = evm.laborCost();
            BigDecimal expenses = evm.expenseCost();
            BigDecimal paymentsReceived = evm.paymentsReceived();
            BigDecimal collectionProgress = evm.collectionProgress();
            BigDecimal cpi = evm.cpi();
            BigDecimal spi = evm.spi();

            long pendingExpenses = expenseRepository.countByProjectIdAndApprovalStatus(pid, ProjectExpense.ApprovalStatus.PENDING_REVIEW);

            totalBudget = totalBudget.add(budget);
            totalExpenses = totalExpenses.add(expenses);
            totalPaymentsReceived = totalPaymentsReceived.add(paymentsReceived);

            BigDecimal pending = paymentRepository.sumAmountByProjectIdAndStatus(pid, ProjectPayment.PaymentStatus.PENDING);
            totalPaymentsPending = totalPaymentsPending.add(pending);

            pendingExpenseApprovals += pendingExpenses;

            byProject.add(new FinanceDashboardDto.ProjectFinance(
                    pid, project.getName(), budget, laborCost, expenses,
                    paymentsReceived, collectionProgress, cpi, spi, pendingExpenses
            ));
        }

        BigDecimal collectionRate = totalBudget.compareTo(BigDecimal.ZERO) > 0
                ? totalPaymentsReceived.multiply(BigDecimal.valueOf(100)).divide(totalBudget, 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        // Overdue payments
        List<ProjectPayment> overduePayments = paymentRepository.findOverduePayments(ProjectPayment.PaymentStatus.PENDING, LocalDate.now());
        List<FinanceDashboardDto.OverduePayment> overdue = overduePayments.stream()
                .filter(p -> companyId == null || (p.getProject().getCompany() != null && p.getProject().getCompany().getId().equals(companyId)))
                .map(p -> new FinanceDashboardDto.OverduePayment(
                        p.getId(),
                        p.getProject().getId(),
                        p.getProject().getName(),
                        p.getTitle(),
                        p.getAmount(),
                        p.getDueDate() != null ? p.getDueDate().toString() : null,
                        p.getDueDate() != null ? ChronoUnit.DAYS.between(p.getDueDate(), LocalDate.now()) : 0
                ))
                .toList();

        FinanceDashboardDto.DashboardSummary summary = new FinanceDashboardDto.DashboardSummary(
                totalBudget, totalExpenses, totalPaymentsReceived, totalPaymentsPending, collectionRate, pendingExpenseApprovals
        );

        return new FinanceDashboardDto.DashboardResponse(summary, byProject, overdue);
    }
}