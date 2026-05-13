package com.nemo.task;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.Instant;

public interface TaskRepository extends JpaRepository<Task, Long> {
    long countByProjectIdAndStatusId(Long projectId, Long statusId);

    Page<Task> findByProjectId(Long projectId, Pageable pageable);

    long countByProjectId(Long projectId);

    @Query("SELECT MAX(CAST(SUBSTRING(t.taskKey, LOCATE('-', t.taskKey) + 1) AS int)) FROM Task t WHERE t.project.id = :projectId")
    Integer findMaxSequenceByProjectId(Long projectId);

    @Query("SELECT t FROM Task t WHERE " +
           "t.project.id = :projectId AND " +
           "(:search IS NULL OR LOWER(t.title) LIKE LOWER(CONCAT('%', :search, '%'))) AND " +
           "(:statusId IS NULL OR t.status.id = :statusId) AND " +
           "(:assigneeId IS NULL OR t.assignee.id = :assigneeId) AND " +
           "(:typeId IS NULL OR t.type.id = :typeId) AND " +
           "(:priority IS NULL OR t.priority = :priority) AND " +
           "(:sprintId IS NULL OR t.sprint.id = :sprintId) AND " +
           "(:labelId IS NULL OR :labelId IN (SELECT l.id FROM t.labels l)) AND " +
           "(:createdAfter IS NULL OR t.createdAt >= :createdAfter) AND " +
           "(:createdBefore IS NULL OR t.createdAt <= :createdBefore) AND " +
           "(:external IS NULL OR t.external = :external)")
    Page<Task> search(Long projectId, String search, Long statusId, Long assigneeId, Long typeId,
                       Task.Priority priority, Long sprintId, Long labelId, Instant createdAfter, Instant createdBefore,
                       Boolean external, Pageable pageable);

    Page<Task> findByProjectIdAndSprintIdIsNull(Long projectId, Pageable pageable);
}