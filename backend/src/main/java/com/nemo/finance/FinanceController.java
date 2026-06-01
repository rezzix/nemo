package com.nemo.finance;

import com.nemo.common.dto.ApiResponse;
import com.nemo.expense.ProjectExpense;
import com.nemo.expense.ProjectExpenseDto;
import com.nemo.expense.ProjectExpenseMapper;
import com.nemo.expense.ProjectExpenseRepository;
import com.nemo.security.AuthHelper;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.io.PrintWriter;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/finance")
public class FinanceController {

    private final ProjectExpenseRepository expenseRepository;
    private final ProjectExpenseMapper expenseMapper;
    private final FinanceService financeService;
    private final AuthHelper authHelper;

    public FinanceController(ProjectExpenseRepository expenseRepository,
                            ProjectExpenseMapper expenseMapper,
                            FinanceService financeService,
                            AuthHelper authHelper) {
        this.expenseRepository = expenseRepository;
        this.expenseMapper = expenseMapper;
        this.financeService = financeService;
        this.authHelper = authHelper;
    }

    @GetMapping("/expenses")
    @PreAuthorize("hasRole('FINANCE')")
    public ResponseEntity<ApiResponse<List<ProjectExpenseDto>>> listExpenses(
            @RequestParam(required = false) String approvalStatus) {
        List<ProjectExpense> expenses;
        if (approvalStatus != null) {
            expenses = expenseRepository.findByApprovalStatus(ProjectExpense.ApprovalStatus.valueOf(approvalStatus));
        } else {
            expenses = expenseRepository.findAll();
        }
        return ResponseEntity.ok(ApiResponse.of(expenseMapper.toDtoList(expenses)));
    }

    @GetMapping("/dashboard")
    @PreAuthorize("hasRole('FINANCE')")
    public ResponseEntity<ApiResponse<FinanceDashboardDto.DashboardResponse>> getDashboard(
            @AuthenticationPrincipal UserDetails currentUser) {
        Long companyId = authHelper.getCurrentCompanyId(currentUser);
        FinanceDashboardDto.DashboardResponse dashboard = financeService.getDashboard(companyId);
        return ResponseEntity.ok(ApiResponse.of(dashboard));
    }

@GetMapping("/payments")
    @PreAuthorize("hasRole('FINANCE')")
    public ResponseEntity<ApiResponse<FinanceDashboardDto.YearPaymentsResponse>> getPayments(
            @RequestParam(required = false) Integer year) {
        if (year == null) {
            year = java.time.LocalDate.now().getYear();
        }
        return ResponseEntity.ok(ApiResponse.of(financeService.getYearPayments(year)));
    }

    @GetMapping("/export")
    @PreAuthorize("hasRole('FINANCE')")
    public void exportCsv(
            @RequestParam(defaultValue = "csv") String format,
            @AuthenticationPrincipal UserDetails currentUser,
            HttpServletResponse response) throws Exception {
        Long companyId = authHelper.getCurrentCompanyId(currentUser);
        FinanceDashboardDto.DashboardResponse data = financeService.getDashboard(companyId);

        String filename = "finance-report-" + LocalDate.now() + ".csv";

        response.setContentType("text/csv");
        response.setHeader("Content-Disposition", "attachment; filename=\"" + filename + "\"");

        try (PrintWriter writer = response.getWriter()) {
            writer.println("Project,Budget,Expenses,Labor,Payments Received,Collection %,CPI,SPI,Pending Expenses");

            for (FinanceDashboardDto.ProjectFinance pf : data.byProject()) {
                writer.println(
                        csvEscape(pf.projectName()) + ","
                        + pf.budget() + ","
                        + pf.expenses() + ","
                        + pf.laborCost() + ","
                        + pf.paymentsReceived() + ","
                        + pf.collectionProgress() + "%,"
                        + (pf.cpi() != null ? pf.cpi() : "N/A") + ","
                        + (pf.spi() != null ? pf.spi() : "N/A") + ","
                        + pf.pendingExpenses()
                );
            }

            writer.println();
            FinanceDashboardDto.DashboardSummary s = data.summary();
            writer.println("TOTAL,"
                    + s.totalBudget() + ","
                    + s.totalExpenses() + ","
                    + "N/A" + ","
                    + s.totalPaymentsReceived() + ","
                    + s.collectionRate() + "%,"
                    + "N/A" + ","
                    + "N/A" + ","
                    + s.pendingExpenseApprovals()
            );
        }
    }

    @GetMapping("/expenses-by-year")
    @PreAuthorize("hasRole('FINANCE')")
    public ResponseEntity<ApiResponse<FinanceDashboardDto.YearExpensesResponse>> getYearExpenses(
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) String status) {
        if (year == null) year = LocalDate.now().getYear();
        return ResponseEntity.ok(ApiResponse.of(financeService.getYearExpenses(year, status)));
    }

    @GetMapping("/chart-data")
    @PreAuthorize("hasRole('FINANCE')")
    public ResponseEntity<ApiResponse<FinanceDashboardDto.MonthlyFinanceData>> getChartData(
            @RequestParam(required = false) Integer year) {
        if (year == null) year = LocalDate.now().getYear();
        return ResponseEntity.ok(ApiResponse.of(financeService.getMonthlyChartData(year)));
    }

    private String csvEscape(String value) {
        if (value == null) return "";
        if (value.contains(",") || value.contains("\"") || value.contains("\n")) {
            return "\"" + value.replace("\"", "\"\"") + "\"";
        }
        return value;
    }
}