package com.nemo.reports;

import com.nemo.common.dto.ApiResponse;
import com.nemo.pmo.PmoService;
import com.nemo.security.AuthHelper;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/reports")
public class ReportController {

    private final PmoService pmoService;
    private final AuthHelper authHelper;

    public ReportController(PmoService pmoService, AuthHelper authHelper) {
        this.pmoService = pmoService;
        this.authHelper = authHelper;
    }

    @GetMapping("/evm")
    @PreAuthorize("hasAnyRole('ADMIN', 'EXECUTIVE', 'MANAGER', 'HR', 'FINANCE')")
    public ResponseEntity<ApiResponse<PmoService.PortfolioSummary>> getEvmReport(
            @AuthenticationPrincipal UserDetails currentUser) {
        Long companyId = authHelper.hasAnyRole(currentUser, "ADMIN", "EXECUTIVE", "FINANCE") ? null : authHelper.getCurrentCompanyId(currentUser);
        return ResponseEntity.ok(ApiResponse.of(pmoService.getPortfolioSummary(companyId)));
    }

    @GetMapping("/budget")
    @PreAuthorize("hasAnyRole('ADMIN', 'EXECUTIVE', 'MANAGER', 'HR', 'FINANCE')")
    public ResponseEntity<ApiResponse<PmoService.PortfolioSummary>> getBudgetReport(
            @AuthenticationPrincipal UserDetails currentUser) {
        Long companyId = authHelper.hasAnyRole(currentUser, "ADMIN", "EXECUTIVE", "FINANCE") ? null : authHelper.getCurrentCompanyId(currentUser);
        return ResponseEntity.ok(ApiResponse.of(pmoService.getPortfolioSummary(companyId)));
    }
}