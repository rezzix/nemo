package com.nemo.common.activity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

@Entity
@Table(name = "activity_log")
public class ActivityLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "username", nullable = false)
    private String username;

    @Column(name = "method", nullable = false, length = 10)
    private String method;

    @Column(name = "path", nullable = false)
    private String path;

    @Column(name = "status")
    private Integer status;

    @Column(name = "ip", length = 45)
    private String ip;

    @Column(name = "duration")
    private Long duration;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    public ActivityLog() {}

    public Long getId() { return id; }
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getMethod() { return method; }
    public void setMethod(String method) { this.method = method; }
    public String getPath() { return path; }
    public void setPath(String path) { this.path = path; }
    public Integer getStatus() { return status; }
    public void setStatus(Integer status) { this.status = status; }
    public String getIp() { return ip; }
    public void setIp(String ip) { this.ip = ip; }
    public Long getDuration() { return duration; }
    public void setDuration(Long duration) { this.duration = duration; }
    public Instant getCreatedAt() { return createdAt; }
}