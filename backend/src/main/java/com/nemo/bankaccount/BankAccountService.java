package com.nemo.bankaccount;

import com.nemo.common.exception.EntityNotFoundException;
import com.nemo.company.Company;
import com.nemo.company.CompanyRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
public class BankAccountService {

    private final BankAccountRepository bankAccountRepository;
    private final CompanyRepository companyRepository;

    public BankAccountService(BankAccountRepository bankAccountRepository,
                               CompanyRepository companyRepository) {
        this.bankAccountRepository = bankAccountRepository;
        this.companyRepository = companyRepository;
    }

    @Transactional(readOnly = true)
    public Page<BankAccount> search(String search, Long companyId, int page, int size, String sort) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(sort));
        return bankAccountRepository.search(search, companyId, pageable);
    }

    @Transactional(readOnly = true)
    public List<BankAccount> listByCompany(Long companyId) {
        return bankAccountRepository.findByCompanyIdAndActiveTrue(companyId);
    }

    @Transactional(readOnly = true)
    public BankAccount getById(Long id) {
        return bankAccountRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("BankAccount", id));
    }

    @Transactional
    public BankAccount create(BankAccountDto.CreateRequest request, Long companyId) {
        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new EntityNotFoundException("Company", companyId));
        BankAccount account = new BankAccount();
        account.setCompany(company);
        account.setName(request.name());
        account.setIban(request.iban());
        account.setCurrency(request.currency());
        account.setCurrentBalance(request.openingBalance() != null ? request.openingBalance() : BigDecimal.ZERO);
        return bankAccountRepository.save(account);
    }

    @Transactional
    public BankAccount update(Long id, BankAccountDto.UpdateRequest request) {
        BankAccount account = getById(id);
        if (request.name() != null) account.setName(request.name());
        if (request.iban() != null) account.setIban(request.iban());
        if (request.currency() != null) account.setCurrency(request.currency());
        return bankAccountRepository.save(account);
    }

    @Transactional
    public void deactivate(Long id) {
        BankAccount account = getById(id);
        account.setActive(false);
        bankAccountRepository.save(account);
    }
}