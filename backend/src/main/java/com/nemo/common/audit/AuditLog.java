package com.nemo.common.audit;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "audit_log")
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "entity_type", nullable = false)
    private String entityType;

    @Column(name = "entity_id", nullable = false)
    private Long entityId;

    @Column(name = "action_", nullable = false)
    private String action;

    @Column(name = "old_value", columnDefinition = "TEXT")
    private String oldValue;

    @Column(name = "new_value", columnDefinition = "TEXT")
    private String newValue;

    @Column(name = "performed_by", nullable = false)
    private Long performedBy;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    public AuditLog() {}

    public AuditLog(String entityType, Long entityId, String action, String oldValue, String newValue, Long performedBy) {
        this.entityType = entityType;
        this.entityId = entityId;
        this.action = action;
        this.oldValue = oldValue;
        this.newValue = newValue;
        this.performedBy = performedBy;
        this.createdAt = Instant.now();
    }

    public Long getId() { return id; }
    public String getEntityType() { return entityType; }
    public Long getEntityId() { return entityId; }
    public String getAction() { return action; }
    public String getOldValue() { return oldValue; }
    public String getNewValue() { return newValue; }
    public Long getPerformedBy() { return performedBy; }
    public Instant getCreatedAt() { return createdAt; }
}