package com.nemo.phase;

import com.nemo.common.dto.ApiResponse;
import com.nemo.security.AuthHelper;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/projects/{projectId}/phases/{phaseId}/payments")
public class PhasePaymentController {

    private final PhasePaymentService paymentService;
    private final PhasePaymentMapper paymentMapper;
    private final PhaseService phaseService;
    private final AuthHelper authHelper;

    public PhasePaymentController(PhasePaymentService paymentService, PhasePaymentMapper paymentMapper,
                                  PhaseService phaseService, AuthHelper authHelper) {
        this.paymentService = paymentService;
        this.paymentMapper = paymentMapper;
        this.phaseService = phaseService;
        this.authHelper = authHelper;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<PhasePaymentDto>>> list(
            @PathVariable Long projectId,
            @PathVariable Long phaseId,
            @AuthenticationPrincipal UserDetails currentUser) {
        authHelper.requireProjectReadAccess(currentUser, projectId);
        return ResponseEntity.ok(ApiResponse.of(paymentMapper.toDtoList(paymentService.getByPhaseId(phaseId))));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<PhasePaymentDto>> create(
            @PathVariable Long projectId,
            @PathVariable Long phaseId,
            @RequestBody PhasePaymentDto.CreateRequest request,
            @AuthenticationPrincipal UserDetails currentUser) {
        authHelper.requireProjectReadAccess(currentUser, projectId);
        PhasePayment created = paymentService.create(phaseId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.of(paymentMapper.toDto(created)));
    }

    @PutMapping("/{paymentId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<PhasePaymentDto>> update(
            @PathVariable Long projectId,
            @PathVariable Long phaseId,
            @PathVariable Long paymentId,
            @RequestBody PhasePaymentDto.UpdateRequest request,
            @AuthenticationPrincipal UserDetails currentUser) {
        authHelper.requireProjectReadAccess(currentUser, projectId);
        PhasePayment updated = paymentService.update(paymentId, request);
        return ResponseEntity.ok(ApiResponse.of(paymentMapper.toDto(updated)));
    }

    @DeleteMapping("/{paymentId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<Void> delete(
            @PathVariable Long projectId,
            @PathVariable Long phaseId,
            @PathVariable Long paymentId,
            @AuthenticationPrincipal UserDetails currentUser) {
        authHelper.requireProjectReadAccess(currentUser, projectId);
        paymentService.delete(paymentId);
        return ResponseEntity.noContent().build();
    }
}