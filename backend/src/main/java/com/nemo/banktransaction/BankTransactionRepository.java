package com.nemo.banktransaction;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BankTransactionRepository extends JpaRepository<BankTransaction, Long> {

    Page<BankTransaction> findByBankAccountIdOrderByDateDesc(Long bankAccountId, Pageable pageable);

    long countByBankAccountId(Long bankAccountId);
}