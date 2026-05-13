package com.nemo.sprint;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SprintRepository extends JpaRepository<Sprint, Long> {
    List<Sprint> findByProjectId(Long projectId);
    List<Sprint> findByProjectIdAndStatus(Long projectId, Sprint.SprintStatus status);
}