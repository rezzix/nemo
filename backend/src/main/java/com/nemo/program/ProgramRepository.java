package com.nemo.program;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface ProgramRepository extends JpaRepository<Program, Long> {
    boolean existsByKey(String key);

    @Query("SELECT p FROM Program p WHERE " +
           "LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(p.key) LIKE LOWER(CONCAT('%', :search, '%'))")
    Page<Program> search(String search, Pageable pageable);

    @Query("SELECT p FROM Program p WHERE " +
           "(:companyId IS NULL OR p.company.id = :companyId) AND " +
           "(LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(p.key) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Program> searchByCompany(String search, Long companyId, Pageable pageable);

    @Query("SELECT p FROM Program p WHERE (:companyId IS NULL OR p.company.id = :companyId)")
    Page<Program> findByCompanyIdOrNull(Long companyId, Pageable pageable);

    @Query("SELECT p FROM Program p WHERE p.manager.id = :managerId AND (:search IS NULL OR LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(p.key) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Program> findByManagerIdWithSearch(Long managerId, String search, Pageable pageable);

    Page<Program> findByManagerId(Long managerId, Pageable pageable);
}