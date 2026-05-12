package com.jari.phase;

import com.jari.common.dto.ApiResponse;
import com.jari.security.AuthHelper;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/projects/{projectId}/phases")
public class PhaseController {

    private final PhaseService phaseService;
    private final PhaseMapper phaseMapper;
    private final AuthHelper authHelper;

    public PhaseController(PhaseService phaseService, PhaseMapper phaseMapper, AuthHelper authHelper) {
        this.phaseService = phaseService;
        this.phaseMapper = phaseMapper;
        this.authHelper = authHelper;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<PhaseDto>>> list(
            @PathVariable Long projectId,
            @AuthenticationPrincipal UserDetails currentUser) {
        authHelper.requireProjectReadAccess(currentUser, projectId);
        List<PhaseDto> dtos = phaseService.enrichWithComputedFields(
                phaseMapper.toDtoList(phaseService.getByProjectId(projectId)));
        return ResponseEntity.ok(ApiResponse.of(dtos));
    }

    @GetMapping("/{phaseId}")
    public ResponseEntity<ApiResponse<PhaseDto>> get(
            @PathVariable Long projectId,
            @PathVariable Long phaseId,
            @AuthenticationPrincipal UserDetails currentUser) {
        authHelper.requireProjectReadAccess(currentUser, projectId);
        PhaseDto dto = phaseMapper.toDto(phaseService.getById(phaseId));
        dto = phaseService.enrichWithComputedFields(List.of(dto)).get(0);
        return ResponseEntity.ok(ApiResponse.of(dto));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<PhaseDto>> create(
            @PathVariable Long projectId,
            @Valid @RequestBody PhaseDto.CreateRequest request,
            @AuthenticationPrincipal UserDetails currentUser) {
        Phase created = phaseService.create(projectId, request);
        PhaseDto dto = phaseService.enrichWithComputedFields(List.of(phaseMapper.toDto(created))).get(0);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.of(dto));
    }

    @PutMapping("/{phaseId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<PhaseDto>> update(
            @PathVariable Long projectId,
            @PathVariable Long phaseId,
            @RequestBody PhaseDto.UpdateRequest request,
            @AuthenticationPrincipal UserDetails currentUser) {
        Phase updated = phaseService.update(phaseId, request);
        PhaseDto dto = phaseService.enrichWithComputedFields(List.of(phaseMapper.toDto(updated))).get(0);
        return ResponseEntity.ok(ApiResponse.of(dto));
    }

    @DeleteMapping("/{phaseId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<Void> delete(
            @PathVariable Long projectId,
            @PathVariable Long phaseId,
            @AuthenticationPrincipal UserDetails currentUser) {
        phaseService.delete(phaseId);
        return ResponseEntity.noContent().build();
    }
}