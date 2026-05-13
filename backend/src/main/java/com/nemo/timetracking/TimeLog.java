package com.nemo.timetracking;

import com.nemo.task.Task;
import com.nemo.user.User;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "time_log")
public class TimeLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, precision = 5, scale = 2)
    private BigDecimal hours;

    @Column(name = "log_date", nullable = false)
    private LocalDate logDate;

    @Column(columnDefinition = "TEXT")
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "task_id")
    private Task task;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "presale_id")
    private com.nemo.presale.PreSale presale;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public TimeLog() {}

    public Long getId() { return id; }
    public BigDecimal getHours() { return hours; }
    public void setHours(BigDecimal hours) { this.hours = hours; }
    public LocalDate getLogDate() { return logDate; }
    public void setLogDate(LocalDate logDate) { this.logDate = logDate; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public Task getTask() { return task; }
    public void setTask(Task task) { this.task = task; }
    public com.nemo.presale.PreSale getPresale() { return presale; }
    public void setPresale(com.nemo.presale.PreSale presale) { this.presale = presale; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}