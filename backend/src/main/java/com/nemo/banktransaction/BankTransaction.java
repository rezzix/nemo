package com.nemo.banktransaction;

import com.nemo.bankaccount.BankAccount;
import com.nemo.bankstatement.BankStatement;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "bank_transaction")
public class BankTransaction {

    public enum Status { NEW, RECONCILED, IGNORED }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bank_account_id", nullable = false)
    private BankAccount bankAccount;

    @Column(nullable = false)
    private LocalDate date;

    @Column(nullable = false)
    private String description;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal amount;

    @Column(nullable = false, length = 3)
    private String currency;

    @Column(length = 50)
    private String reference;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Status status = Status.NEW;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bank_statement_id")
    private BankStatement bankStatement;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_payment_id")
    private com.nemo.payment.ProjectPayment projectPayment;

    @Column(name = "external_note", columnDefinition = "TEXT")
    private String externalNote;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public BankTransaction() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public BankAccount getBankAccount() { return bankAccount; }
    public void setBankAccount(BankAccount bankAccount) { this.bankAccount = bankAccount; }
    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }
    public String getReference() { return reference; }
    public void setReference(String reference) { this.reference = reference; }
    public Status getStatus() { return status; }
    public void setStatus(Status status) { this.status = status; }
    public BankStatement getBankStatement() { return bankStatement; }
    public void setBankStatement(BankStatement bankStatement) { this.bankStatement = bankStatement; }
    public com.nemo.payment.ProjectPayment getProjectPayment() { return projectPayment; }
    public void setProjectPayment(com.nemo.payment.ProjectPayment projectPayment) { this.projectPayment = projectPayment; }
    public String getExternalNote() { return externalNote; }
    public void setExternalNote(String externalNote) { this.externalNote = externalNote; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}