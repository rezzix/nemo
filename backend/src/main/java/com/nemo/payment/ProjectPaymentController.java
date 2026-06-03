package com.nemo.payment;

import com.nemo.common.dto.ApiResponse;
import com.nemo.common.exception.ForbiddenException;
import com.nemo.security.AuthHelper;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/projects/{projectId}/payments")
public class ProjectPaymentController {

    private final ProjectPaymentService paymentService;
    private final AuthHelper authHelper;

    public ProjectPaymentController(ProjectPaymentService paymentService, AuthHelper authHelper) {
        this.paymentService = paymentService;
        this.authHelper = authHelper;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('MANAGER', 'EXECUTIVE', 'FINANCE')")
    public ResponseEntity<ApiResponse<List<ProjectPaymentDto.Response>>> list(
            @PathVariable Long projectId,
            @AuthenticationPrincipal UserDetails currentUser) {
        authHelper.requireProjectReadAccess(currentUser, projectId);
        List<ProjectPaymentDto.Response> dtos = paymentService.getByProjectId(projectId).stream()
                .map(this::toDto).toList();
        return ResponseEntity.ok(ApiResponse.of(dtos));
    }

    @PostMapping
    @PreAuthorize("hasRole('FINANCE')")
    public ResponseEntity<ApiResponse<ProjectPaymentDto.Response>> create(
            @PathVariable Long projectId,
            @RequestBody ProjectPaymentDto.CreateRequest request,
            @AuthenticationPrincipal UserDetails currentUser) {
        Long userId = authHelper.getCurrentUserId(currentUser);
        ProjectPayment payment = paymentService.create(projectId, userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.of(toDto(payment)));
    }

    @PutMapping("/{paymentId}")
    @PreAuthorize("hasRole('FINANCE')")
    public ResponseEntity<ApiResponse<ProjectPaymentDto.Response>> update(
            @PathVariable Long projectId,
            @PathVariable Long paymentId,
            @RequestBody ProjectPaymentDto.UpdateRequest request) {
        ProjectPayment payment = paymentService.update(paymentId, request);
        return ResponseEntity.ok(ApiResponse.of(toDto(payment)));
    }

    @PatchMapping("/{paymentId}/receive")
    @PreAuthorize("hasRole('FINANCE')")
    public ResponseEntity<ApiResponse<ProjectPaymentDto.Response>> markReceived(
            @PathVariable Long projectId,
            @PathVariable Long paymentId) {
        ProjectPayment payment = paymentService.markReceived(paymentId);
        return ResponseEntity.ok(ApiResponse.of(toDto(payment)));
    }

    @DeleteMapping("/{paymentId}")
    @PreAuthorize("hasRole('FINANCE')")
    public ResponseEntity<Void> cancel(
            @PathVariable Long projectId,
            @PathVariable Long paymentId) {
        paymentService.cancel(paymentId);
        return ResponseEntity.noContent().build();
    }

    private ProjectPaymentDto.Response toDto(ProjectPayment p) {
        return new ProjectPaymentDto.Response(
                p.getId(), p.getProject().getId(), p.getProject().getName(),
                p.getTitle(), p.getAmount(), p.getCurrency(),
                p.getDueDate() != null ? p.getDueDate().toString() : null,
                p.getReceivedDate() != null ? p.getReceivedDate().toString() : null,
                p.getStatus().name(),
                p.getInvoiceRef(), p.getNotes(),
                p.isReconciled(),
                p.getCreatedBy() != null ? p.getCreatedBy().getId() : null,
                p.getCreatedBy() != null ? p.getCreatedBy().getFirstName() + " " + p.getCreatedBy().getLastName() : null,
                p.getCreatedAt() != null ? p.getCreatedAt().toString() : null,
                p.getUpdatedAt() != null ? p.getUpdatedAt().toString() : null
        );
    }
}