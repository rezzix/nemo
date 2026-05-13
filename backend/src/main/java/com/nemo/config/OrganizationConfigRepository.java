package com.nemo.config;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface OrganizationConfigRepository extends JpaRepository<OrganizationConfig, Long> {
    Optional<OrganizationConfig> findByCompanyId(Long companyId);
    Optional<OrganizationConfig> findByCompanyIdIsNull();
}