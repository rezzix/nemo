package com.nemo.bankstatement;

import com.nemo.bankaccount.BankAccountService;
import com.nemo.common.dto.ApiResponse;
import com.nemo.common.dto.PaginatedResponse;
import com.nemo.common.dto.PaginatedResponse.PaginationInfo;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/bank-accounts/{bankAccountId}/statements")
public class BankStatementController {

    private final StatementImportService importService;
    private final BankStatementRepository bankStatementRepository;
    private final BankStatementMapper bankStatementMapper;
    private final BankAccountService bankAccountService;

    public BankStatementController(StatementImportService importService,
                                    BankStatementRepository bankStatementRepository,
                                    BankStatementMapper bankStatementMapper,
                                    BankAccountService bankAccountService) {
        this.importService = importService;
        this.bankStatementRepository = bankStatementRepository;
        this.bankStatementMapper = bankStatementMapper;
        this.bankAccountService = bankAccountService;
    }

    @PostMapping("/import")
    @PreAuthorize("hasRole('FINANCE')")
    public ResponseEntity<ApiResponse<BankStatementDto.ImportResult>> importStatement(
            @PathVariable Long bankAccountId,
            @RequestParam("file") MultipartFile file) {
        BankStatementDto.ImportResult result = importService.importPdf(bankAccountId, file);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.of(result));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('FINANCE', 'EXECUTIVE')")
    public ResponseEntity<PaginatedResponse<BankStatementDto>> list(
            @PathVariable Long bankAccountId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        bankAccountService.getById(bankAccountId); // validate parent exists
        Page<BankStatement> result = bankStatementRepository.findByBankAccountIdOrderByCreatedAtDesc(bankAccountId,
                org.springframework.data.domain.PageRequest.of(page, size));
        List<BankStatementDto> dtos = bankStatementMapper.toDtoList(result.getContent());
        return ResponseEntity.ok(PaginatedResponse.of(dtos,
                new PaginationInfo(page, size, result.getTotalElements(), result.getTotalPages())));
    }
}