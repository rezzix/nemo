package com.jari.presale;

import com.jari.common.dto.ApiResponse;
import com.jari.common.dto.PaginatedResponse;
import com.jari.common.dto.PaginatedResponse.PaginationInfo;
import com.jari.security.AuthHelper;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/presales")
public class PreSaleController {

    private final PreSaleService preSaleService;
    private final PreSaleMapper preSaleMapper;
    private final AuthHelper authHelper;

    public PreSaleController(PreSaleService preSaleService, PreSaleMapper preSaleMapper, AuthHelper authHelper) {
        this.preSaleService = preSaleService;
        this.preSaleMapper = preSaleMapper;
        this.authHelper = authHelper;
    }

    @GetMapping
    public ResponseEntity<PaginatedResponse<PreSaleDto>> list(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String stage,
            @RequestParam(required = false) Long managerId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt,desc") String sort,
            @AuthenticationPrincipal UserDetails currentUser) {
        Long companyId = null;
        if (!authHelper.hasAnyRole(currentUser, "ADMIN")) {
            companyId = authHelper.getCurrentCompanyId(currentUser);
        }
        PreSale.PreSaleStage stageEnum = stage != null ? PreSale.PreSaleStage.valueOf(stage) : null;
        Page<PreSale> result = preSaleService.search(search, stageEnum, managerId, companyId, page, size, sort);
        return ResponseEntity.ok(PaginatedResponse.of(
                preSaleMapper.toDtoList(result.getContent()),
                new PaginationInfo(page, size, result.getTotalElements(), result.getTotalPages())
        ));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PreSaleDto>> get(@PathVariable Long id) {
        PreSale preSale = preSaleService.getById(id);
        return ResponseEntity.ok(ApiResponse.of(preSaleMapper.toDto(preSale)));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EXECUTIVE')")
    public ResponseEntity<ApiResponse<PreSaleDto>> create(
            @Valid @RequestBody PreSaleDto.CreateRequest request,
            @AuthenticationPrincipal UserDetails currentUser) {
        Long companyId = request.companyId();
        if (companyId == null && !authHelper.hasAnyRole(currentUser, "ADMIN")) {
            companyId = authHelper.getCurrentCompanyId(currentUser);
        }
        PreSale created = preSaleService.create(request, companyId);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.of(preSaleMapper.toDto(created)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EXECUTIVE')")
    public ResponseEntity<ApiResponse<PreSaleDto>> update(
            @PathVariable Long id, @RequestBody PreSaleDto.UpdateRequest request) {
        PreSale updated = preSaleService.update(id, request);
        return ResponseEntity.ok(ApiResponse.of(preSaleMapper.toDto(updated)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        preSaleService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/convert")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EXECUTIVE')")
    public ResponseEntity<ApiResponse<PreSaleDto>> convertToProject(
            @PathVariable Long id,
            @Valid @RequestBody PreSaleDto.ConvertRequest request,
            @AuthenticationPrincipal UserDetails currentUser) {
        Long companyId = authHelper.getCurrentCompanyId(currentUser);
        if (authHelper.hasAnyRole(currentUser, "ADMIN")) companyId = null;
        PreSale updated = preSaleService.convertToProject(id, request, companyId);
        return ResponseEntity.ok(ApiResponse.of(preSaleMapper.toDto(updated)));
    }

    @GetMapping("/{id}/cost-summary")
    public ResponseEntity<ApiResponse<PreSaleDto.CostSummaryDto>> getCostSummary(@PathVariable Long id) {
        PreSaleDto.CostSummaryDto summary = preSaleService.getCostSummary(id);
        return ResponseEntity.ok(ApiResponse.of(summary));
    }
}