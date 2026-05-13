package com.nemo.config;

import com.nemo.common.dto.ApiResponse;
import com.nemo.common.exception.EntityNotFoundException;
import com.nemo.company.Company;
import com.nemo.company.CompanyRepository;
import com.nemo.security.AuthHelper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/organization")
public class OrganizationConfigController {

    private final OrganizationConfigRepository repository;
    private final CompanyRepository companyRepository;
    private final AuthHelper authHelper;
    private final boolean devMode;
    private final String version;
    private final String build;

    public OrganizationConfigController(OrganizationConfigRepository repository, CompanyRepository companyRepository, AuthHelper authHelper,
                                        @Value("${nemo.devmode:false}") boolean devMode,
                                        @Value("${nemo.version:0.9.0}") String version,
                                        @Value("${nemo.build:}") String build) {
        this.repository = repository;
        this.companyRepository = companyRepository;
        this.authHelper = authHelper;
        this.devMode = devMode;
        this.version = version;
        this.build = build;
    }

    @GetMapping("/public")
    public ResponseEntity<ApiResponse<PublicConfigDto>> getPublic() {
        OrganizationConfig config = repository.findByCompanyIdIsNull()
                .orElse(null);
        String currency = config != null ? config.getCurrency() : "DH";
        return ResponseEntity.ok(ApiResponse.of(new PublicConfigDto(config, devMode, version, build, currency)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<OrganizationConfig>> get(@AuthenticationPrincipal UserDetails currentUser) {
        Long companyId = authHelper.getCurrentCompanyId(currentUser);
        OrganizationConfig config;
        if (companyId != null) {
            config = repository.findByCompanyId(companyId)
                    .orElseGet(() -> repository.findByCompanyIdIsNull()
                            .orElseThrow(() -> new EntityNotFoundException("Organization config not found")));
        } else {
            config = repository.findByCompanyIdIsNull()
                    .orElseThrow(() -> new EntityNotFoundException("Organization config not found"));
        }
        return ResponseEntity.ok(ApiResponse.of(config));
    }

    @PutMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<OrganizationConfig>> update(
            @RequestBody OrganizationConfig updated,
            @AuthenticationPrincipal UserDetails currentUser) {
        Long companyId = authHelper.getCurrentCompanyId(currentUser);
        OrganizationConfig config;
        if (companyId != null) {
            config = repository.findByCompanyId(companyId).orElse(null);
            if (config == null) {
                config = new OrganizationConfig();
                Company company = companyRepository.findById(companyId)
                        .orElseThrow(() -> new EntityNotFoundException("Company", companyId));
                config.setCompany(company);
            }
        } else {
            config = repository.findByCompanyIdIsNull()
                    .orElseThrow(() -> new EntityNotFoundException("Organization config not found"));
        }
        config.setName(updated.getName());
        config.setAddress(updated.getAddress());
        config.setWebsite(updated.getWebsite());
        config.setLogo(updated.getLogo());
        config.setCurrency(updated.getCurrency());
        return ResponseEntity.ok(ApiResponse.of(repository.save(config)));
    }
}