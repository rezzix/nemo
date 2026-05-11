package com.jari.project;

import com.jari.company.Company;
import com.jari.program.Program;
import com.jari.user.User;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "project")
public class Project {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(name = "key_", nullable = false, unique = true)
    private String key;

    @Column(columnDefinition = "TEXT")
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "program_id")
    private Program program;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "manager_id", nullable = false)
    private User manager;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id")
    private Company company;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Stage stage = Stage.INITIATION;

    @Column(name = "strategic_score")
    private Integer strategicScore;

    @Column(name = "planned_value", precision = 12, scale = 2)
    private BigDecimal plannedValue;

    @Column(name = "budget", precision = 12, scale = 2)
    private BigDecimal budget;

    @Column(name = "budget_spent", precision = 12, scale = 2)
    private BigDecimal budgetSpent;

    @Column(name = "target_start_date")
    private LocalDate targetStartDate;

    @Column(name = "target_end_date")
    private LocalDate targetEndDate;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public Project() {}

    public Long getId() { return id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getKey() { return key; }
    public void setKey(String key) { this.key = key; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public Program getProgram() { return program; }
    public void setProgram(Program program) { this.program = program; }
    public User getManager() { return manager; }
    public void setManager(User manager) { this.manager = manager; }
    public Stage getStage() { return stage; }
    public void setStage(Stage stage) { this.stage = stage; }
    public Integer getStrategicScore() { return strategicScore; }
    public void setStrategicScore(Integer strategicScore) { this.strategicScore = strategicScore; }
    public BigDecimal getPlannedValue() { return plannedValue; }
    public void setPlannedValue(BigDecimal plannedValue) { this.plannedValue = plannedValue; }
    public BigDecimal getBudget() { return budget; }
    public void setBudget(BigDecimal budget) { this.budget = budget; }
    public BigDecimal getBudgetSpent() { return budgetSpent; }
    public void setBudgetSpent(BigDecimal budgetSpent) { this.budgetSpent = budgetSpent; }
    public LocalDate getTargetStartDate() { return targetStartDate; }
    public void setTargetStartDate(LocalDate targetStartDate) { this.targetStartDate = targetStartDate; }
    public LocalDate getTargetEndDate() { return targetEndDate; }
    public void setTargetEndDate(LocalDate targetEndDate) { this.targetEndDate = targetEndDate; }
    public Company getCompany() { return company; }
    public void setCompany(Company company) { this.company = company; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }

    public enum Stage { INITIATION, PLANNING, EXECUTION, CLOSING }
}