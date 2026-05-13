package com.nemo.company;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CompanyRepository extends JpaRepository<Company, Long> {
    boolean existsByKey(String key);
    boolean existsByName(String name);
    Page<Company> findByActive(boolean active, Pageable pageable);
    Page<Company> findByNameContainingIgnoreCaseOrKeyContainingIgnoreCase(String name, String key, Pageable pageable);
}