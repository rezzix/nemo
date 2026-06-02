package com.nemo.bankaccount;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface BankAccountRepository extends JpaRepository<BankAccount, Long> {

    List<BankAccount> findByCompanyIdAndActiveTrue(Long companyId);

    @Query("SELECT b FROM BankAccount b WHERE b.active = true AND " +
            "(:companyId IS NULL OR b.company.id = :companyId) AND " +
            "(:search IS NULL OR LOWER(b.name) LIKE LOWER(CONCAT('%', :search, '%')) " +
            "OR LOWER(b.iban) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<BankAccount> search(@Param("search") String search, @Param("companyId") Long companyId, Pageable pageable);
}