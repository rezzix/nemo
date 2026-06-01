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
public class ClientPaymentController {

    private final ClientPaymentService paymentService;
    private final ClientPaymentMapper paymentMapper;
    private final PhaseService phaseService;
    private final AuthHelper authHelper;

    public ClientPaymentController(ClientPaymentService paymentService, ClientPaymentMapper paymentMapper,
                                  PhaseService phaseService, AuthHelper authHelper) {
        this.paymentService = paymentService;
        this.paymentMapper = paymentMapper;
        this.phaseService = phaseService;
        this.authHelper = authHelper;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<ClientPaymentDto>>> list(
            @PathVariable Long projectId,
            @PathVariable Long phaseId,
            @AuthenticationPrincipal UserDetails currentUser) {
        authHelper.requireProjectReadAccess(currentUser, projectId);
        return ResponseEntity.ok(ApiResponse.of(paymentMapper.toDtoList(paymentService.getByPhaseId(phaseId))));
    }

    @PostMapping
    @PreAuthorize("hasRole('FINANCE')")
    public ResponseEntity<ApiResponse<ClientPaymentDto>> create(
            @PathVariable Long projectId,
            @PathVariable Long phaseId,
            @RequestBody ClientPaymentDto.CreateRequest request,
            @AuthenticationPrincipal UserDetails currentUser) {
        authHelper.requireProjectReadAccess(currentUser, projectId);
        ClientPayment created = paymentService.create(phaseId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.of(paymentMapper.toDto(created)));
    }

    @PutMapping("/{paymentId}")
    @PreAuthorize("hasRole('FINANCE')")
    public ResponseEntity<ApiResponse<ClientPaymentDto>> update(
            @PathVariable Long projectId,
            @PathVariable Long phaseId,
            @PathVariable Long paymentId,
            @RequestBody ClientPaymentDto.UpdateRequest request,
            @AuthenticationPrincipal UserDetails currentUser) {
        authHelper.requireProjectReadAccess(currentUser, projectId);
        ClientPayment updated = paymentService.update(paymentId, request);
        return ResponseEntity.ok(ApiResponse.of(paymentMapper.toDto(updated)));
    }

    @DeleteMapping("/{paymentId}")
    @PreAuthorize("hasRole('FINANCE')")
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