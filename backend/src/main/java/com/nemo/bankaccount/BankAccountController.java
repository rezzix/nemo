package com.nemo.bankaccount;

import com.nemo.common.dto.ApiResponse;
import com.nemo.common.dto.PaginatedResponse;
import com.nemo.common.dto.PaginatedResponse.PaginationInfo;
import com.nemo.config.OrganizationConfig;
import com.nemo.config.OrganizationConfigRepository;
import com.nemo.security.AuthHelper;
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
@RequestMapping("/api/bank-accounts")
public class BankAccountController {

    private final BankAccountService bankAccountService;
    private final BankAccountMapper bankAccountMapper;
    private final AuthHelper authHelper;
    private final OrganizationConfigRepository configRepository;

    public BankAccountController(BankAccountService bankAccountService,
                                  BankAccountMapper bankAccountMapper,
                                  AuthHelper authHelper,
                                  OrganizationConfigRepository configRepository) {
        this.bankAccountService = bankAccountService;
        this.bankAccountMapper = bankAccountMapper;
        this.authHelper = authHelper;
        this.configRepository = configRepository;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('FINANCE', 'EXECUTIVE')")
    public ResponseEntity<PaginatedResponse<BankAccountDto>> list(
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "name,asc") String sort,
            @AuthenticationPrincipal UserDetails currentUser) {
        Long companyId = authHelper.getCurrentCompanyId(currentUser);
        Page<BankAccount> result = bankAccountService.search(search, companyId, page, size, sort);
        List<BankAccountDto> dtos = bankAccountMapper.toDtoList(result.getContent());
        return ResponseEntity.ok(PaginatedResponse.of(dtos,
                new PaginationInfo(page, size, result.getTotalElements(), result.getTotalPages())));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('FINANCE', 'EXECUTIVE')")
    public ResponseEntity<ApiResponse<BankAccountDto>> get(@PathVariable Long id) {
        BankAccount account = bankAccountService.getById(id);
        return ResponseEntity.ok(ApiResponse.of(bankAccountMapper.toDto(account)));
    }

    @PostMapping
    @PreAuthorize("hasRole('FINANCE')")
    public ResponseEntity<ApiResponse<BankAccountDto>> create(
            @Valid @RequestBody BankAccountDto.CreateRequest request,
            @AuthenticationPrincipal UserDetails currentUser) {
        Long companyId = authHelper.getCurrentCompanyId(currentUser);
        BankAccountDto.CreateRequest resolvedRequest = request;
        if (request.currency() == null || request.currency().isBlank()) {
            String defaultCurrency = resolveCurrency(companyId);
            resolvedRequest = new BankAccountDto.CreateRequest(
                    request.name(), request.iban(), defaultCurrency, request.openingBalance());
        }
        BankAccount created = bankAccountService.create(resolvedRequest, companyId);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.of(bankAccountMapper.toDto(created)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('FINANCE')")
    public ResponseEntity<ApiResponse<BankAccountDto>> update(
            @PathVariable Long id,
            @RequestBody BankAccountDto.UpdateRequest request) {
        BankAccount updated = bankAccountService.update(id, request);
        return ResponseEntity.ok(ApiResponse.of(bankAccountMapper.toDto(updated)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('FINANCE')")
    public ResponseEntity<Void> deactivate(@PathVariable Long id) {
        bankAccountService.deactivate(id);
        return ResponseEntity.noContent().build();
    }

    private String resolveCurrency(Long companyId) {
        if (companyId != null) {
            String currency = configRepository.findByCompanyId(companyId)
                    .map(OrganizationConfig::getCurrency).orElse(null);
            if (currency != null) return currency;
        }
        return configRepository.findByCompanyIdIsNull()
                .map(OrganizationConfig::getCurrency).orElse("USD");
    }
}