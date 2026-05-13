package com.nemo.project;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProjectNoteRepository extends JpaRepository<ProjectNote, Long> {
    List<ProjectNote> findByProjectIdAndOwnerIdOrderByPinnedDescCreatedAtDesc(Long projectId, Long ownerId);
    void deleteByIdAndOwnerId(Long id, Long ownerId);
}