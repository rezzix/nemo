package com.nemo.client;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ClientRepository extends JpaRepository<Client, Long> {
    boolean existsByName(String name);

    @Query("SELECT c FROM Client c WHERE " +
            "(:search IS NULL OR LOWER(c.name) LIKE LOWER(CONCAT('%', :search, '%')) " +
            "OR LOWER(c.industry) LIKE LOWER(CONCAT('%', :search, '%'))) AND " +
            "(:companyId IS NULL OR c.company.id = :companyId)")
    Page<Client> search(@Param("search") String search, @Param("companyId") Long companyId, Pageable pageable);
}