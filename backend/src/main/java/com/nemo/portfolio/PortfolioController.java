package com.nemo.portfolio;

import com.nemo.common.dto.ApiResponse;
import com.nemo.pmo.PmoService;
import com.nemo.pmo.RaidItem;
import com.nemo.pmo.RaidItemMapper;
import com.nemo.security.AuthHelper;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/portfolio")
public class PortfolioController {

    private final PmoService pmoService;
    private final RaidItemMapper raidItemMapper;
    private final AuthHelper authHelper;

    public PortfolioController(PmoService pmoService, RaidItemMapper raidItemMapper, AuthHelper authHelper) {
        this.pmoService = pmoService;
        this.raidItemMapper = raidItemMapper;
        this.authHelper = authHelper;
    }

    @GetMapping("/overview")
    @PreAuthorize("hasAnyRole('ADMIN', 'EXECUTIVE', 'MANAGER', 'HR')")
    public ResponseEntity<ApiResponse<PmoService.PortfolioSummary>> getOverview(
            @AuthenticationPrincipal UserDetails currentUser) {
        Long companyId = authHelper.hasAnyRole(currentUser, "ADMIN", "EXECUTIVE") ? null : authHelper.getCurrentCompanyId(currentUser);
        return ResponseEntity.ok(ApiResponse.of(pmoService.getPortfolioSummary(companyId)));
    }

    @GetMapping("/projects")
    @PreAuthorize("hasAnyRole('ADMIN', 'EXECUTIVE', 'MANAGER', 'HR')")
    public ResponseEntity<ApiResponse<List<PmoService.CompanyPortfolioSummary>>> getProjects(
            @AuthenticationPrincipal UserDetails currentUser) {
        Long companyId = authHelper.hasAnyRole(currentUser, "ADMIN", "EXECUTIVE") ? null : authHelper.getCurrentCompanyId(currentUser);
        return ResponseEntity.ok(ApiResponse.of(pmoService.getPortfolioByCompany(companyId)));
    }

    @GetMapping("/evm")
    @PreAuthorize("hasAnyRole('ADMIN', 'EXECUTIVE', 'MANAGER', 'HR')")
    public ResponseEntity<ApiResponse<List<PmoService.ProgramEvmMetrics>>> getEvmRollup(
            @AuthenticationPrincipal UserDetails currentUser) {
        Long companyId = authHelper.hasAnyRole(currentUser, "ADMIN", "EXECUTIVE") ? null : authHelper.getCurrentCompanyId(currentUser);
        return ResponseEntity.ok(ApiResponse.of(pmoService.getProgramEvmRollup(companyId)));
    }

    @GetMapping("/timeline")
    @PreAuthorize("hasAnyRole('ADMIN', 'EXECUTIVE', 'MANAGER', 'HR')")
    public ResponseEntity<ApiResponse<List<PmoService.ProjectTimelineEntry>>> getTimeline(
            @AuthenticationPrincipal UserDetails currentUser) {
        Long companyId = authHelper.hasAnyRole(currentUser, "ADMIN", "EXECUTIVE") ? null : authHelper.getCurrentCompanyId(currentUser);
        return ResponseEntity.ok(ApiResponse.of(pmoService.getPortfolioTimeline(companyId)));
    }

    @GetMapping("/raid")
    @PreAuthorize("hasAnyRole('ADMIN', 'EXECUTIVE', 'MANAGER', 'HR')")
    public ResponseEntity<ApiResponse<List<com.nemo.pmo.RaidItemDto>>> getRaidItems(
            @RequestParam(required = false) RaidItem.RaidType type,
            @AuthenticationPrincipal UserDetails currentUser) {
        Long companyId = authHelper.hasAnyRole(currentUser, "ADMIN", "EXECUTIVE") ? null : authHelper.getCurrentCompanyId(currentUser);
        List<RaidItem> items = pmoService.getPortfolioRaidItems(type, companyId);
        return ResponseEntity.ok(ApiResponse.of(raidItemMapper.toDtoList(items)));
    }
}