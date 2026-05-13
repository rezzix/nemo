package com.nemo.asset;

import com.nemo.common.dto.ApiResponse;
import com.nemo.security.AuthHelper;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/assets")
public class AssetController {

    private final AssetService assetService;
    private final AssetMapper assetMapper;
    private final AuthHelper authHelper;

    public AssetController(AssetService assetService, AssetMapper assetMapper, AuthHelper authHelper) {
        this.assetService = assetService;
        this.assetMapper = assetMapper;
        this.authHelper = authHelper;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<ApiResponse<List<AssetDto>>> list(
            @RequestParam(required = false) Long companyId,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long locationId,
            @RequestParam(required = false) Long userId,
            @AuthenticationPrincipal UserDetails currentUser) {
        Asset.Type typeEnum = type != null ? Asset.Type.valueOf(type) : null;
        Asset.Status statusEnum = status != null ? Asset.Status.valueOf(status) : null;
        List<Asset> assets = assetService.listByFilters(companyId, typeEnum, statusEnum, locationId, userId);
        return ResponseEntity.ok(ApiResponse.of(assetMapper.toDtoList(assets)));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<ApiResponse<AssetDto>> get(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails currentUser) {
        Asset asset = assetService.getById(id);
        return ResponseEntity.ok(ApiResponse.of(assetMapper.toDto(asset)));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<AssetDto>> create(
            @Valid @RequestBody AssetDto.CreateRequest request,
            @AuthenticationPrincipal UserDetails currentUser) {
        Asset created = assetService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.of(assetMapper.toDto(created)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<AssetDto>> update(
            @PathVariable Long id,
            @RequestBody AssetDto.UpdateRequest request,
            @AuthenticationPrincipal UserDetails currentUser) {
        Asset updated = assetService.update(id, request);
        return ResponseEntity.ok(ApiResponse.of(assetMapper.toDto(updated)));
    }

    @PutMapping("/{id}/assign")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<ApiResponse<AssetDto>> assign(
            @PathVariable Long id,
            @Valid @RequestBody AssetDto.AssignRequest request,
            @AuthenticationPrincipal UserDetails currentUser) {
        Asset assigned = assetService.assignToUser(id, request.userId());
        return ResponseEntity.ok(ApiResponse.of(assetMapper.toDto(assigned)));
    }

    @PutMapping("/{id}/unassign")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<ApiResponse<AssetDto>> unassign(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails currentUser) {
        Asset unassigned = assetService.unassign(id);
        return ResponseEntity.ok(ApiResponse.of(assetMapper.toDto(unassigned)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails currentUser) {
        assetService.deactivate(id);
        return ResponseEntity.noContent().build();
    }
}