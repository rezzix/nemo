package com.nemo.project;

import jakarta.persistence.*;

@Entity
@Table(name = "label", uniqueConstraints = @UniqueConstraint(columnNames = {"project_id", "name"}))
public class Label {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String color;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    public Label() {}

    public Long getId() { return id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getColor() { return color; }
    public void setColor(String color) { this.color = color; }
    public Project getProject() { return project; }
    public void setProject(Project project) { this.project = project; }
}