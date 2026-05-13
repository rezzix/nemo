package com.nemo.project;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LabelRepository extends JpaRepository<Label, Long> {
    List<Label> findByProjectId(Long projectId);
}