package com.nemo.pmo;

import com.nemo.common.dto.ApiResponse;
import com.nemo.security.AuthHelper;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/pmo")
public class PmoController {

    private final PmoService pmoService;
    private final RaidItemMapper raidItemMapper;
    private final AuthHelper authHelper;

    public PmoController(PmoService pmoService, RaidItemMapper raidItemMapper, AuthHelper authHelper) {
        this.pmoService = pmoService;
        this.raidItemMapper = raidItemMapper;
        this.authHelper = authHelper;
    }

    @GetMapping("/evm/{projectId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EXECUTIVE')")
    public ResponseEntity<ApiResponse<PmoService.EvmMetrics>> getEvmMetrics(@PathVariable Long projectId) {
        return ResponseEntity.ok(ApiResponse.of(pmoService.computeEvm(projectId)));
    }

    @GetMapping("/portfolio")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EXECUTIVE')")
    public ResponseEntity<ApiResponse<PmoService.PortfolioSummary>> getPortfolioSummary(
            @AuthenticationPrincipal UserDetails currentUser) {
        Long companyId = authHelper.hasAnyRole(currentUser, "ADMIN") ? null : authHelper.getCurrentCompanyId(currentUser);
        return ResponseEntity.ok(ApiResponse.of(pmoService.getPortfolioSummary(companyId)));
    }

    @GetMapping("/raid")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EXECUTIVE')")
    public ResponseEntity<ApiResponse<List<RaidItemDto>>> getPortfolioRaidItems(
            @RequestParam(required = false) RaidItem.RaidType type,
            @AuthenticationPrincipal UserDetails currentUser) {
        Long companyId = authHelper.hasAnyRole(currentUser, "ADMIN") ? null : authHelper.getCurrentCompanyId(currentUser);
        List<RaidItem> items = pmoService.getPortfolioRaidItems(type, companyId);
        return ResponseEntity.ok(ApiResponse.of(raidItemMapper.toDtoList(items)));
    }

    @GetMapping("/portfolio/by-company")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EXECUTIVE')")
    public ResponseEntity<ApiResponse<List<PmoService.CompanyPortfolioSummary>>> getPortfolioByCompany(
            @AuthenticationPrincipal UserDetails currentUser) {
        Long companyId = authHelper.hasAnyRole(currentUser, "ADMIN") ? null : authHelper.getCurrentCompanyId(currentUser);
        return ResponseEntity.ok(ApiResponse.of(pmoService.getPortfolioByCompany(companyId)));
    }

    @GetMapping("/portfolio/timeline")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EXECUTIVE')")
    public ResponseEntity<ApiResponse<List<PmoService.ProjectTimelineEntry>>> getPortfolioTimeline(
            @AuthenticationPrincipal UserDetails currentUser) {
        Long companyId = authHelper.hasAnyRole(currentUser, "ADMIN") ? null : authHelper.getCurrentCompanyId(currentUser);
        return ResponseEntity.ok(ApiResponse.of(pmoService.getPortfolioTimeline(companyId)));
    }
}