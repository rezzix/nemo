package com.nemo.company;

import com.nemo.common.dto.ApiResponse;
import com.nemo.common.dto.PaginatedResponse;
import com.nemo.common.dto.PaginatedResponse.PaginationInfo;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/companies")
public class CompanyController {

    private final CompanyService companyService;
    private final CompanyMapper companyMapper;

    public CompanyController(CompanyService companyService, CompanyMapper companyMapper) {
        this.companyService = companyService;
        this.companyMapper = companyMapper;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'HR', 'EXECUTIVE', 'MANAGER', 'FINANCE')")
    public ResponseEntity<PaginatedResponse<CompanyDto>> list(
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt,desc") String sort) {
        Page<Company> result = companyService.search(search, page, size, sort);
        return ResponseEntity.ok(PaginatedResponse.of(
                companyMapper.toDtoList(result.getContent()),
                new PaginationInfo(page, size, result.getTotalElements(), result.getTotalPages())
        ));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR', 'EXECUTIVE', 'MANAGER')")
    public ResponseEntity<ApiResponse<CompanyDto>> get(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.of(companyMapper.toDto(companyService.getById(id))));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<ApiResponse<CompanyDto>> create(@Valid @RequestBody CompanyDto.CreateRequest request) {
        Company created = companyService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.of(companyMapper.toDto(created)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<ApiResponse<CompanyDto>> update(@PathVariable Long id, @RequestBody CompanyDto.UpdateRequest request) {
        Company updated = companyService.update(id, request);
        return ResponseEntity.ok(ApiResponse.of(companyMapper.toDto(updated)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN')")
    public ResponseEntity<Void> deactivate(@PathVariable Long id) {
        companyService.deactivate(id);
        return ResponseEntity.noContent().build();
    }
}