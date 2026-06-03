package com.nemo.bankstatement;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.Optional;

public interface BankStatementRepository extends JpaRepository<BankStatement, Long> {

    Page<BankStatement> findByBankAccountIdOrderByCreatedAtDesc(Long bankAccountId, Pageable pageable);

    @Query("SELECT MAX(s.createdAt) FROM BankStatement s WHERE s.bankAccount.id = :bankAccountId")
    Optional<Instant> findMaxCreatedAtByBankAccountId(@Param("bankAccountId") Long bankAccountId);

    @Query("SELECT MAX(s.createdAt) FROM BankStatement s " +
            "WHERE (:companyId IS NULL OR s.bankAccount.company.id = :companyId)")
    Optional<Instant> findMaxCreatedAtByCompany(@Param("companyId") Long companyId);
}