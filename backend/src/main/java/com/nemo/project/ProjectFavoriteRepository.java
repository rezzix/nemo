package com.nemo.project;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Set;

public interface ProjectFavoriteRepository extends JpaRepository<ProjectFavorite, Long> {

    List<ProjectFavorite> findByUserId(Long userId);
    boolean existsByUserIdAndProjectId(Long userId, Long projectId);
    void deleteByUserIdAndProjectId(Long userId, Long projectId);

    default Set<Long> findProjectIdsByUserId(Long userId) {
        return findByUserId(userId).stream()
                .map(pf -> pf.getProject().getId())
                .collect(java.util.stream.Collectors.toSet());
    }
}