package com.nemo.pmo;

import com.nemo.common.dto.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/pmo")
public class PmoController {

    private final PmoService pmoService;
    private final RaidItemMapper raidItemMapper;

    public PmoController(PmoService pmoService, RaidItemMapper raidItemMapper) {
        this.pmoService = pmoService;
        this.raidItemMapper = raidItemMapper;
    }

    @GetMapping("/evm/{projectId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EXECUTIVE')")
    public ResponseEntity<ApiResponse<PmoService.EvmMetrics>> getEvmMetrics(@PathVariable Long projectId) {
        return ResponseEntity.ok(ApiResponse.of(pmoService.computeEvm(projectId)));
    }

    @GetMapping("/portfolio")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EXECUTIVE')")
    public ResponseEntity<ApiResponse<PmoService.PortfolioSummary>> getPortfolioSummary() {
        return ResponseEntity.ok(ApiResponse.of(pmoService.getPortfolioSummary()));
    }

    @GetMapping("/raid")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EXECUTIVE')")
    public ResponseEntity<ApiResponse<List<RaidItemDto>>> getPortfolioRaidItems(
            @RequestParam(required = false) RaidItem.RaidType type) {
        List<RaidItem> items = pmoService.getPortfolioRaidItems(type);
        return ResponseEntity.ok(ApiResponse.of(raidItemMapper.toDtoList(items)));
    }

    @GetMapping("/portfolio/by-company")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EXECUTIVE')")
    public ResponseEntity<ApiResponse<List<PmoService.CompanyPortfolioSummary>>> getPortfolioByCompany() {
        return ResponseEntity.ok(ApiResponse.of(pmoService.getPortfolioByCompany()));
    }

    @GetMapping("/portfolio/timeline")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EXECUTIVE')")
    public ResponseEntity<ApiResponse<List<PmoService.ProjectTimelineEntry>>> getPortfolioTimeline() {
        return ResponseEntity.ok(ApiResponse.of(pmoService.getPortfolioTimeline()));
    }
}