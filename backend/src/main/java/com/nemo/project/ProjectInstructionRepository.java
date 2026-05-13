package com.nemo.project;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProjectInstructionRepository extends JpaRepository<ProjectInstruction, Long> {
    List<ProjectInstruction> findByProjectIdOrderByImportantDescCreatedAtDesc(Long projectId);
}