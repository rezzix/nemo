package com.nemo.reconciliation;

import com.nemo.banktransaction.BankTransaction;
import com.nemo.common.dto.ApiResponse;
import com.nemo.payment.ProjectPayment;
import com.nemo.security.AuthHelper;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reconciliation")
public class ReconciliationController {

    private final ReconciliationService reconciliationService;
    private final AuthHelper authHelper;

    public ReconciliationController(ReconciliationService reconciliationService, AuthHelper authHelper) {
        this.reconciliationService = reconciliationService;
        this.authHelper = authHelper;
    }

    @GetMapping("/unreconciled-count")
    @PreAuthorize("hasRole('FINANCE')")
    public ResponseEntity<ApiResponse<ReconciliationDto.UnreconciledCountDto>> getUnreconciledCount(
            @AuthenticationPrincipal UserDetails currentUser) {
        Long companyId = authHelper.getCurrentCompanyId(currentUser);
        long count = reconciliationService.getUnreconciledCount(companyId);
        return ResponseEntity.ok(ApiResponse.of(new ReconciliationDto.UnreconciledCountDto(count)));
    }

    @GetMapping("/view")
    @PreAuthorize("hasRole('FINANCE')")
    public ResponseEntity<ApiResponse<ReconciliationDto.ReconciliationViewDto>> getReconciliationView(
            @AuthenticationPrincipal UserDetails currentUser) {
        Long companyId = authHelper.getCurrentCompanyId(currentUser);
        List<BankTransaction> transactions = reconciliationService.getUnreconciledTransactions(companyId);
        List<ProjectPayment> unmatched = reconciliationService.getUnmatchedPayments(companyId);
        long count = reconciliationService.getUnreconciledCount(companyId);

        ReconciliationDto.ReconciliationViewDto view = new ReconciliationDto.ReconciliationViewDto(
                transactions.stream().map(reconciliationService::toTransactionDto).toList(),
                unmatched.stream().map(reconciliationService::toPaymentDto).toList(),
                count
        );
        return ResponseEntity.ok(ApiResponse.of(view));
    }

    @GetMapping("/suggest/{transactionId}")
    @PreAuthorize("hasRole('FINANCE')")
    public ResponseEntity<ApiResponse<List<ReconciliationDto.UnmatchedPaymentDto>>> suggestMatches(
            @PathVariable Long transactionId,
            @AuthenticationPrincipal UserDetails currentUser) {
        Long companyId = authHelper.getCurrentCompanyId(currentUser);
        List<ProjectPayment> matches = reconciliationService.suggestMatches(transactionId, companyId);
        List<ReconciliationDto.UnmatchedPaymentDto> dtos = matches.stream()
                .map(reconciliationService::toPaymentDto).toList();
        return ResponseEntity.ok(ApiResponse.of(dtos));
    }

    @GetMapping("/reconciled")
    @PreAuthorize("hasRole('FINANCE')")
    public ResponseEntity<ApiResponse<List<ReconciliationDto.UnreconciledTransactionDto>>> getReconciledTransactions(
            @AuthenticationPrincipal UserDetails currentUser) {
        Long companyId = authHelper.getCurrentCompanyId(currentUser);
        List<BankTransaction> transactions = reconciliationService.getReconciledTransactions(companyId);
        List<ReconciliationDto.UnreconciledTransactionDto> dtos = transactions.stream()
                .map(reconciliationService::toTransactionDto).toList();
        return ResponseEntity.ok(ApiResponse.of(dtos));
    }

    @PostMapping("/bank-transactions/{id}/reconcile")
    @PreAuthorize("hasRole('FINANCE')")
    public ResponseEntity<ApiResponse<ReconciliationDto.UnreconciledTransactionDto>> reconcile(
            @PathVariable Long id,
            @Valid @RequestBody ReconciliationDto.ReconcileRequest request) {
        BankTransaction result;
        if (request.paymentId() != null) {
            result = reconciliationService.reconcileWithPayment(id, request.paymentId());
        } else if (request.externalNote() != null && !request.externalNote().isBlank()) {
            result = reconciliationService.reconcileAsExternal(id, request.externalNote());
        } else {
            throw new IllegalArgumentException("Either paymentId or externalNote must be provided");
        }
        return ResponseEntity.ok(ApiResponse.of(reconciliationService.toTransactionDto(result)));
    }

    @PostMapping("/bank-transactions/{id}/unreconcile")
    @PreAuthorize("hasRole('FINANCE')")
    public ResponseEntity<ApiResponse<ReconciliationDto.UnreconciledTransactionDto>> unreconcile(
            @PathVariable Long id) {
        BankTransaction result = reconciliationService.unreconcile(id);
        return ResponseEntity.ok(ApiResponse.of(reconciliationService.toTransactionDto(result)));
    }
}