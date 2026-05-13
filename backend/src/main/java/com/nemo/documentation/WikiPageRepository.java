package com.nemo.documentation;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface WikiPageRepository extends JpaRepository<WikiPage, Long> {
    List<WikiPage> findByProjectId(Long projectId);

    List<WikiPage> findByProjectIdAndParentIdIsNullOrderByPosition(Long projectId);

    List<WikiPage> findByParentIdOrderByPosition(Long parentId);

    @Query("SELECT w FROM WikiPage w WHERE w.project.id = :projectId AND " +
           "(LOWER(w.title) LIKE LOWER(CONCAT('%', :q, '%')) OR LOWER(w.content) LIKE LOWER(CONCAT('%', :q, '%')))")
    List<WikiPage> search(Long projectId, String q);
}