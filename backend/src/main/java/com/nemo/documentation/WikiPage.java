package com.nemo.documentation;

import com.nemo.task.Task;
import com.nemo.project.Project;
import com.nemo.user.User;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "wiki_page", uniqueConstraints = @UniqueConstraint(columnNames = {"project_id", "slug"}))
public class WikiPage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String content;

    @Column(nullable = false)
    private String slug;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    private WikiPage parent;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id", nullable = false)
    private User author;

    @Column(nullable = false)
    private int position = 0;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(name = "wiki_page_task_link",
            joinColumns = @JoinColumn(name = "wiki_page_id"),
            inverseJoinColumns = @JoinColumn(name = "task_id"))
    private Set<Task> linkedTasks = new HashSet<>();

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public WikiPage() {}

    public Long getId() { return id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
    public String getSlug() { return slug; }
    public void setSlug(String slug) { this.slug = slug; }
    public Project getProject() { return project; }
    public void setProject(Project project) { this.project = project; }
    public WikiPage getParent() { return parent; }
    public void setParent(WikiPage parent) { this.parent = parent; }
    public User getAuthor() { return author; }
    public void setAuthor(User author) { this.author = author; }
    public int getPosition() { return position; }
    public void setPosition(int position) { this.position = position; }
    public Set<Task> getLinkedTasks() { return linkedTasks; }
    public void setLinkedTasks(Set<Task> linkedTasks) { this.linkedTasks = linkedTasks; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}