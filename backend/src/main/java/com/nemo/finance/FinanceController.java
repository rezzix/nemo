package com.nemo.finance;

import com.nemo.common.dto.ApiResponse;
import com.nemo.expense.ProjectExpense;
import com.nemo.expense.ProjectExpenseDto;
import com.nemo.expense.ProjectExpenseMapper;
import com.nemo.expense.ProjectExpenseRepository;
import com.nemo.security.AuthHelper;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

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
}