package com.nemo.banktransaction;

import com.nemo.bankaccount.BankAccountService;
import com.nemo.common.dto.ApiResponse;
import com.nemo.common.dto.PaginatedResponse;
import com.nemo.common.dto.PaginatedResponse.PaginationInfo;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/bank-accounts/{bankAccountId}/transactions")
public class BankTransactionController {

    private final BankTransactionService bankTransactionService;
    private final BankTransactionMapper bankTransactionMapper;
    private final BankAccountService bankAccountService;

    public BankTransactionController(BankTransactionService bankTransactionService,
                                      BankTransactionMapper bankTransactionMapper,
                                      BankAccountService bankAccountService) {
        this.bankTransactionService = bankTransactionService;
        this.bankTransactionMapper = bankTransactionMapper;
        this.bankAccountService = bankAccountService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('FINANCE', 'EXECUTIVE')")
    public ResponseEntity<PaginatedResponse<BankTransactionDto>> list(
            @PathVariable Long bankAccountId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "date,desc") String sort) {
        bankAccountService.getById(bankAccountId); // validate parent exists
        Page<BankTransaction> result = bankTransactionService.list(bankAccountId, page, size, sort);
        List<BankTransactionDto> dtos = bankTransactionMapper.toDtoList(result.getContent());
        return ResponseEntity.ok(PaginatedResponse.of(dtos,
                new PaginationInfo(page, size, result.getTotalElements(), result.getTotalPages())));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('FINANCE', 'EXECUTIVE')")
    public ResponseEntity<ApiResponse<BankTransactionDto>> get(
            @PathVariable Long bankAccountId,
            @PathVariable Long id) {
        bankAccountService.getById(bankAccountId); // validate parent exists
        BankTransaction transaction = bankTransactionService.getById(id);
        return ResponseEntity.ok(ApiResponse.of(bankTransactionMapper.toDto(transaction)));
    }

    @PostMapping
    @PreAuthorize("hasRole('FINANCE')")
    public ResponseEntity<ApiResponse<BankTransactionDto>> create(
            @PathVariable Long bankAccountId,
            @Valid @RequestBody BankTransactionDto.CreateRequest request) {
        BankTransaction created = bankTransactionService.create(bankAccountId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.of(bankTransactionMapper.toDto(created)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('FINANCE')")
    public ResponseEntity<ApiResponse<BankTransactionDto>> update(
            @PathVariable Long bankAccountId,
            @PathVariable Long id,
            @RequestBody BankTransactionDto.UpdateRequest request) {
        bankAccountService.getById(bankAccountId); // validate parent exists
        BankTransaction updated = bankTransactionService.update(id, request);
        return ResponseEntity.ok(ApiResponse.of(bankTransactionMapper.toDto(updated)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('FINANCE')")
    public ResponseEntity<Void> delete(
            @PathVariable Long bankAccountId,
            @PathVariable Long id) {
        bankAccountService.getById(bankAccountId); // validate parent exists
        bankTransactionService.delete(id);
        return ResponseEntity.noContent().build();
    }
}