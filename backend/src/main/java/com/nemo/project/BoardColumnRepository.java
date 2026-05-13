package com.nemo.project;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BoardColumnRepository extends JpaRepository<BoardColumn, Long> {
    List<BoardColumn> findByProjectIdOrderByPosition(Long projectId);
    void deleteByProjectId(Long projectId);
}