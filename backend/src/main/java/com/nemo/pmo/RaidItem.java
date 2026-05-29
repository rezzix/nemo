package com.nemo.pmo;

import com.nemo.project.Project;
import com.nemo.user.User;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "raid_item")
public class RaidItem {

    public enum RaidType { RISK, ASSUMPTION, ISSUE, TASK, DEPENDENCY }
    public enum RaidStatus { OPEN, MITIGATING, RESOLVED, CLOSED }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @Enumerated(EnumType.STRING)
    @Column(name = "type_", nullable = false)
    private RaidType type;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RaidStatus status = RaidStatus.OPEN;

    @Column(name = "probability")
    private Integer probability;

    @Column(name = "impact")
    private Integer impact;

    @Column(name = "mitigation_plan", columnDefinition = "TEXT")
    private String mitigationPlan;

    @Column(name = "depends_on_project_id")
    private Long dependsOnProjectId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id")
    private User owner;

    @Column(name = "due_date")
    private LocalDate dueDate;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public RaidItem() {}

    public Long getId() { return id; }
    public Project getProject() { return project; }
    public void setProject(Project project) { this.project = project; }
    public RaidType getType() { return type; }
    public void setType(RaidType type) { this.type = type; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public RaidStatus getStatus() { return status; }
    public void setStatus(RaidStatus status) { this.status = status; }
    public Integer getProbability() { return probability; }
    public void setProbability(Integer probability) { this.probability = probability; }
    public Integer getImpact() { return impact; }
    public void setImpact(Integer impact) { this.impact = impact; }
    public String getMitigationPlan() { return mitigationPlan; }
    public void setMitigationPlan(String mitigationPlan) { this.mitigationPlan = mitigationPlan; }
    public Long getDependsOnProjectId() { return dependsOnProjectId; }
    public void setDependsOnProjectId(Long dependsOnProjectId) { this.dependsOnProjectId = dependsOnProjectId; }
    public User getOwner() { return owner; }
    public void setOwner(User owner) { this.owner = owner; }
    public LocalDate getDueDate() { return dueDate; }
    public void setDueDate(LocalDate dueDate) { this.dueDate = dueDate; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }

    public int getRiskScore() {
        return (probability != null && impact != null) ? probability * impact : 0;
    }
}