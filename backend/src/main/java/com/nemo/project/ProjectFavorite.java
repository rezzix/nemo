package com.nemo.project;

import com.nemo.user.User;
import jakarta.persistence.*;

@Entity
@Table(name = "project_favorites", uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "project_id"}))
public class ProjectFavorite {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    public ProjectFavorite() {}

    public ProjectFavorite(User user, Project project) {
        this.user = user;
        this.project = project;
    }

    public Long getId() { return id; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public Project getProject() { return project; }
    public void setProject(Project project) { this.project = project; }
}