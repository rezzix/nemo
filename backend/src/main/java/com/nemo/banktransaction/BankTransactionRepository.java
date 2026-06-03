package com.nemo.banktransaction;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface BankTransactionRepository extends JpaRepository<BankTransaction, Long> {

    Page<BankTransaction> findByBankAccountIdOrderByDateDesc(Long bankAccountId, Pageable pageable);

    long countByBankAccountId(Long bankAccountId);

    @Query("SELECT COUNT(t) FROM BankTransaction t WHERE t.status = :status " +
            "AND (:companyId IS NULL OR t.bankAccount.company.id = :companyId)")
    long countByStatusAndCompany(@Param("status") BankTransaction.Status status, @Param("companyId") Long companyId);

    @Query("SELECT t FROM BankTransaction t LEFT JOIN FETCH t.projectPayment " +
            "WHERE t.status = :status AND (:companyId IS NULL OR t.bankAccount.company.id = :companyId) " +
            "ORDER BY t.date DESC")
    List<BankTransaction> findByStatusAndCompany(@Param("status") BankTransaction.Status status, @Param("companyId") Long companyId);
}