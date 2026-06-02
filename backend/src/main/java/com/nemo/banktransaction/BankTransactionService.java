package com.nemo.banktransaction;

import com.nemo.bankaccount.BankAccount;
import com.nemo.bankaccount.BankAccountRepository;
import com.nemo.common.exception.EntityNotFoundException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Service
public class BankTransactionService {

    private final BankTransactionRepository bankTransactionRepository;
    private final BankAccountRepository bankAccountRepository;

    public BankTransactionService(BankTransactionRepository bankTransactionRepository,
                                   BankAccountRepository bankAccountRepository) {
        this.bankTransactionRepository = bankTransactionRepository;
        this.bankAccountRepository = bankAccountRepository;
    }

    @Transactional(readOnly = true)
    public Page<BankTransaction> list(Long bankAccountId, int page, int size, String sort) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(sort));
        return bankTransactionRepository.findByBankAccountIdOrderByDateDesc(bankAccountId, pageable);
    }

    @Transactional(readOnly = true)
    public BankTransaction getById(Long id) {
        return bankTransactionRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("BankTransaction", id));
    }

    @Transactional
    public BankTransaction create(Long bankAccountId, BankTransactionDto.CreateRequest request) {
        BankAccount account = bankAccountRepository.findById(bankAccountId)
                .orElseThrow(() -> new EntityNotFoundException("BankAccount", bankAccountId));
        BankTransaction transaction = new BankTransaction();
        transaction.setBankAccount(account);
        transaction.setDate(LocalDate.parse(request.date()));
        transaction.setDescription(request.description());
        transaction.setAmount(request.amount());
        transaction.setCurrency(request.currency() != null && !request.currency().isBlank()
                ? request.currency() : account.getCurrency());
        transaction.setReference(request.reference());
        return bankTransactionRepository.save(transaction);
    }

    @Transactional
    public BankTransaction update(Long id, BankTransactionDto.UpdateRequest request) {
        BankTransaction transaction = getById(id);
        if (request.description() != null) transaction.setDescription(request.description());
        if (request.reference() != null) transaction.setReference(request.reference());
        if (request.status() != null) transaction.setStatus(BankTransaction.Status.valueOf(request.status()));
        return bankTransactionRepository.save(transaction);
    }

    @Transactional
    public void delete(Long id) {
        BankTransaction transaction = getById(id);
        bankTransactionRepository.delete(transaction);
    }
}