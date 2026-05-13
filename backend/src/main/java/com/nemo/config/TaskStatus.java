package com.nemo.config;

import jakarta.persistence.*;

@Entity
@Table(name = "task_status")
public class TaskStatus {

    public enum Category { TODO, IN_PROGRESS, DONE, CLOSED }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Category category;

    @Column(name = "is_default", nullable = false)
    private boolean isDefault;

    public TaskStatus() {}

    public Long getId() { return id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public Category getCategory() { return category; }
    public void setCategory(Category category) { this.category = category; }
    public boolean isDefault() { return isDefault; }
    public void setDefault(boolean aDefault) { isDefault = aDefault; }
}