package com.nemo.reconciliation;

import com.nemo.bankaccount.BankAccount;
import com.nemo.banktransaction.BankTransaction;
import com.nemo.banktransaction.BankTransactionRepository;
import com.nemo.common.exception.EntityNotFoundException;
import com.nemo.payment.ProjectPayment;
import com.nemo.payment.ProjectPaymentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.List;

@Service
public class ReconciliationService {

    private static final BigDecimal AMOUNT_TOLERANCE = new BigDecimal("0.01");
    private static final int DATE_WINDOW_DAYS = 3;

    private final BankTransactionRepository transactionRepository;
    private final ProjectPaymentRepository paymentRepository;

    public ReconciliationService(BankTransactionRepository transactionRepository,
                                   ProjectPaymentRepository paymentRepository) {
        this.transactionRepository = transactionRepository;
        this.paymentRepository = paymentRepository;
    }

    @Transactional(readOnly = true)
    public List<BankTransaction> getUnreconciledTransactions(Long companyId) {
        return transactionRepository.findByStatusAndCompany(BankTransaction.Status.NEW, companyId);
    }

    @Transactional(readOnly = true)
    public List<BankTransaction> getReconciledTransactions(Long companyId) {
        return transactionRepository.findByStatusAndCompany(BankTransaction.Status.RECONCILED, companyId);
    }

    @Transactional(readOnly = true)
    public List<ProjectPayment> getUnmatchedPayments(Long companyId) {
        return paymentRepository.findUnreconciledByCompany(companyId, ProjectPayment.PaymentStatus.CANCELLED);
    }

    @Transactional(readOnly = true)
    public long getUnreconciledCount(Long companyId) {
        return transactionRepository.countByStatusAndCompany(BankTransaction.Status.NEW, companyId);
    }

    @Transactional(readOnly = true)
    public List<ProjectPayment> suggestMatches(Long transactionId, Long companyId) {
        BankTransaction tx = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new EntityNotFoundException("BankTransaction", transactionId));

        List<ProjectPayment> candidates = paymentRepository.findUnreconciledByCompany(
                companyId, ProjectPayment.PaymentStatus.CANCELLED);

        LocalDate txDate = tx.getDate();
        BigDecimal absAmount = tx.getAmount().abs();

        return candidates.stream()
                .filter(p -> p.getCurrency() != null && p.getCurrency().equalsIgnoreCase(tx.getCurrency()))
                .filter(p -> p.getAmount().subtract(absAmount).abs().compareTo(AMOUNT_TOLERANCE) <= 0)
                .filter(p -> {
                    LocalDate compareDate = p.getDueDate() != null ? p.getDueDate() : p.getReceivedDate();
                    if (compareDate == null) return true;
                    long daysDiff = Math.abs(ChronoUnit.DAYS.between(txDate, compareDate));
                    return daysDiff <= DATE_WINDOW_DAYS;
                })
                .sorted(Comparator.comparingLong(p -> {
                    LocalDate compareDate = p.getDueDate() != null ? p.getDueDate() : p.getReceivedDate();
                    if (compareDate == null) return Long.MAX_VALUE;
                    return Math.abs(ChronoUnit.DAYS.between(txDate, compareDate));
                }))
                .toList();
    }

    @Transactional
    public BankTransaction reconcileWithPayment(Long transactionId, Long paymentId) {
        BankTransaction tx = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new EntityNotFoundException("BankTransaction", transactionId));

        if (tx.getStatus() != BankTransaction.Status.NEW) {
            throw new IllegalStateException("Transaction is already reconciled or ignored (status: " + tx.getStatus() + ")");
        }

        ProjectPayment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new EntityNotFoundException("ProjectPayment", paymentId));

        if (payment.isReconciled()) {
            throw new IllegalStateException("Payment is already reconciled with another transaction");
        }

        tx.setProjectPayment(payment);
        tx.setExternalNote(null);
        tx.setStatus(BankTransaction.Status.RECONCILED);

        payment.setReconciled(true);
        if (payment.getStatus() == ProjectPayment.PaymentStatus.PENDING
                || payment.getStatus() == ProjectPayment.PaymentStatus.OVERDUE) {
            payment.setStatus(ProjectPayment.PaymentStatus.RECEIVED);
            payment.setReceivedDate(tx.getDate());
        }

        paymentRepository.save(payment);
        return transactionRepository.save(tx);
    }

    @Transactional
    public BankTransaction reconcileAsExternal(Long transactionId, String externalNote) {
        BankTransaction tx = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new EntityNotFoundException("BankTransaction", transactionId));

        if (tx.getStatus() != BankTransaction.Status.NEW) {
            throw new IllegalStateException("Transaction is already reconciled or ignored (status: " + tx.getStatus() + ")");
        }

        tx.setProjectPayment(null);
        tx.setExternalNote(externalNote);
        tx.setStatus(BankTransaction.Status.RECONCILED);
        return transactionRepository.save(tx);
    }

    @Transactional
    public BankTransaction unreconcile(Long transactionId) {
        BankTransaction tx = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new EntityNotFoundException("BankTransaction", transactionId));

        if (tx.getStatus() != BankTransaction.Status.RECONCILED) {
            throw new IllegalStateException("Transaction is not reconciled (status: " + tx.getStatus() + ")");
        }

        if (tx.getProjectPayment() != null) {
            ProjectPayment payment = tx.getProjectPayment();
            payment.setReconciled(false);
            paymentRepository.save(payment);
        }

        tx.setProjectPayment(null);
        tx.setExternalNote(null);
        tx.setStatus(BankTransaction.Status.NEW);
        return transactionRepository.save(tx);
    }

    public ReconciliationDto.UnmatchedPaymentDto toPaymentDto(ProjectPayment p) {
        return new ReconciliationDto.UnmatchedPaymentDto(
                p.getId(),
                p.getProject().getId(),
                p.getProject().getName(),
                p.getTitle(),
                p.getAmount(),
                p.getCurrency(),
                p.getDueDate() != null ? p.getDueDate().toString() : null,
                p.getReceivedDate() != null ? p.getReceivedDate().toString() : null,
                p.getStatus().name(),
                p.getInvoiceRef(),
                p.isReconciled()
        );
    }

    public ReconciliationDto.UnreconciledTransactionDto toTransactionDto(BankTransaction t) {
        BankAccount account = t.getBankAccount();
        return new ReconciliationDto.UnreconciledTransactionDto(
                t.getId(),
                account != null ? account.getId() : null,
                account != null ? account.getName() : null,
                t.getDate() != null ? t.getDate().toString() : null,
                t.getDescription(),
                t.getAmount(),
                t.getCurrency(),
                t.getReference(),
                t.getStatus().name(),
                t.getProjectPayment() != null ? t.getProjectPayment().getId() : null,
                t.getProjectPayment() != null ? t.getProjectPayment().getTitle() : null,
                t.getExternalNote(),
                t.getCreatedAt() != null ? t.getCreatedAt().toString() : null,
                t.getUpdatedAt() != null ? t.getUpdatedAt().toString() : null
        );
    }
}