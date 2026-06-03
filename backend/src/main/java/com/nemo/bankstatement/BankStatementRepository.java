package com.nemo.bankstatement;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BankStatementRepository extends JpaRepository<BankStatement, Long> {

    Page<BankStatement> findByBankAccountIdOrderByCreatedAtDesc(Long bankAccountId, Pageable pageable);
}