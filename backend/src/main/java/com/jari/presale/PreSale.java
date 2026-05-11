package com.jari.presale;

import com.jari.client.Client;
import com.jari.client.ClientContact;
import com.jari.company.Company;
import com.jari.program.Program;
import com.jari.project.Project;
import com.jari.user.User;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "presale")
public class PreSale {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(name = "key_", nullable = false, unique = true)
    private String key;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PreSaleStage stage = PreSaleStage.LEAD;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id")
    private Client client;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_contact_id")
    private ClientContact clientContact;

    @Column(name = "estimated_value", precision = 12, scale = 2)
    private BigDecimal estimatedValue;

    @Column(name = "probability")
    private Integer probability;

    @Column(name = "expected_close_date")
    private LocalDate expectedCloseDate;

    @Column(name = "lost_reason", columnDefinition = "TEXT")
    private String lostReason;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "manager_id", nullable = false)
    private User manager;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id")
    private Company company;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "program_id")
    private Program program;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "converted_project_id")
    private Project convertedProject;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public PreSale() {}

    public Long getId() { return id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getKey() { return key; }
    public void setKey(String key) { this.key = key; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public PreSaleStage getStage() { return stage; }
    public void setStage(PreSaleStage stage) { this.stage = stage; }
    public Client getClient() { return client; }
    public void setClient(Client client) { this.client = client; }
    public ClientContact getClientContact() { return clientContact; }
    public void setClientContact(ClientContact clientContact) { this.clientContact = clientContact; }
    public BigDecimal getEstimatedValue() { return estimatedValue; }
    public void setEstimatedValue(BigDecimal estimatedValue) { this.estimatedValue = estimatedValue; }
    public Integer getProbability() { return probability; }
    public void setProbability(Integer probability) { this.probability = probability; }
    public LocalDate getExpectedCloseDate() { return expectedCloseDate; }
    public void setExpectedCloseDate(LocalDate expectedCloseDate) { this.expectedCloseDate = expectedCloseDate; }
    public String getLostReason() { return lostReason; }
    public void setLostReason(String lostReason) { this.lostReason = lostReason; }
    public User getManager() { return manager; }
    public void setManager(User manager) { this.manager = manager; }
    public Company getCompany() { return company; }
    public void setCompany(Company company) { this.company = company; }
    public Program getProgram() { return program; }
    public void setProgram(Program program) { this.program = program; }
    public Project getConvertedProject() { return convertedProject; }
    public void setConvertedProject(Project convertedProject) { this.convertedProject = convertedProject; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }

    public enum PreSaleStage { LEAD, QUALIFIED, PROPOSAL, NEGOTIATION, WON, LOST }
}