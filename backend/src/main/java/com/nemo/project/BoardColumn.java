package com.nemo.project;

import com.nemo.config.TaskStatus;
import jakarta.persistence.*;

@Entity
@Table(name = "board_column", uniqueConstraints = @UniqueConstraint(columnNames = {"project_id", "status_id"}))
public class BoardColumn {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "status_id", nullable = false)
    private TaskStatus status;

    @Column(nullable = false)
    private int position;

    public BoardColumn() {}

    public BoardColumn(Project project, TaskStatus status, int position) {
        this.project = project;
        this.status = status;
        this.position = position;
    }

    public Long getId() { return id; }
    public Project getProject() { return project; }
    public TaskStatus getStatus() { return status; }
    public void setStatus(TaskStatus status) { this.status = status; }
    public int getPosition() { return position; }
    public void setPosition(int position) { this.position = position; }
}