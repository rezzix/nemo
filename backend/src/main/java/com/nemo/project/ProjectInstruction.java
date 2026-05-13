package com.nemo.project;

import com.nemo.user.User;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "project_instruction")
public class ProjectInstruction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id", nullable = false)
    private User author;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;

    @Column(name = "important")
    private boolean important = false;

    @Column(name = "visible_from")
    private LocalDate visibleFrom;

    @Column(name = "visible_to")
    private LocalDate visibleTo;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public ProjectInstruction() {}

    public Long getId() { return id; }
    public Project getProject() { return project; }
    public void setProject(Project project) { this.project = project; }
    public User getAuthor() { return author; }
    public void setAuthor(User author) { this.author = author; }
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
    public boolean isImportant() { return important; }
    public void setImportant(boolean important) { this.important = important; }
    public LocalDate getVisibleFrom() { return visibleFrom; }
    public void setVisibleFrom(LocalDate visibleFrom) { this.visibleFrom = visibleFrom; }
    public LocalDate getVisibleTo() { return visibleTo; }
    public void setVisibleTo(LocalDate visibleTo) { this.visibleTo = visibleTo; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}