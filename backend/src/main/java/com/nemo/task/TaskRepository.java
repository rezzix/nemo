package com.nemo.task;

import com.nemo.config.TaskStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;

public interface TaskRepository extends JpaRepository<Task, Long> {
    long countByProjectIdAndStatusId(Long projectId, Long statusId);

    @Query("SELECT t FROM Task t " +
           "LEFT JOIN FETCH t.status LEFT JOIN FETCH t.type LEFT JOIN FETCH t.project " +
           "LEFT JOIN FETCH t.assignee LEFT JOIN FETCH t.reporter LEFT JOIN FETCH t.sprint " +
           "LEFT JOIN FETCH t.phase LEFT JOIN FETCH t.labels " +
           "WHERE t.project.id = :projectId")
    Page<Task> findByProjectId(Long projectId, Pageable pageable);

    long countByProjectId(Long projectId);

    @Query("SELECT MAX(CAST(SUBSTRING(t.taskKey, LOCATE('-', t.taskKey) + 1) AS int)) FROM Task t WHERE t.project.id = :projectId")
    Integer findMaxSequenceByProjectId(Long projectId);

    @Query("SELECT t FROM Task t " +
           "LEFT JOIN FETCH t.status " +
           "LEFT JOIN FETCH t.type " +
           "LEFT JOIN FETCH t.project " +
           "LEFT JOIN FETCH t.assignee " +
           "LEFT JOIN FETCH t.reporter " +
           "LEFT JOIN FETCH t.sprint " +
           "LEFT JOIN FETCH t.phase " +
           "LEFT JOIN FETCH t.labels " +
           "WHERE t.project.id = :projectId AND " +
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

    @Query("SELECT t FROM Task t " +
           "LEFT JOIN FETCH t.status LEFT JOIN FETCH t.type LEFT JOIN FETCH t.project " +
           "LEFT JOIN FETCH t.assignee LEFT JOIN FETCH t.reporter LEFT JOIN FETCH t.sprint " +
           "LEFT JOIN FETCH t.phase LEFT JOIN FETCH t.labels " +
           "WHERE t.project.id = :projectId AND t.sprint.id IS NULL")
    Page<Task> findByProjectIdAndSprintIdIsNull(Long projectId, Pageable pageable);

    @Query("SELECT t.sprint.id, COUNT(t) FROM Task t WHERE t.sprint.id IN :sprintIds GROUP BY t.sprint.id")
    List<Object[]> countBySprintIds(@Param("sprintIds") List<Long> sprintIds);

    @Query("SELECT t.sprint.id, COUNT(t) FROM Task t WHERE t.sprint.id IN :sprintIds AND t.status.category IN :categories GROUP BY t.sprint.id")
    List<Object[]> countCompletedBySprintIds(@Param("sprintIds") List<Long> sprintIds, @Param("categories") List<TaskStatus.Category> categories);

    @Query("SELECT t.sprint.id, COALESCE(SUM(t.storyPoints), 0) FROM Task t WHERE t.sprint.id IN :sprintIds GROUP BY t.sprint.id")
    List<Object[]> sumStoryPointsBySprintIds(@Param("sprintIds") List<Long> sprintIds);

    @Query("SELECT t.sprint.id, COALESCE(SUM(t.storyPoints), 0) FROM Task t WHERE t.sprint.id IN :sprintIds AND t.status.category IN :categories GROUP BY t.sprint.id")
    List<Object[]> sumCompletedStoryPointsBySprintIds(@Param("sprintIds") List<Long> sprintIds, @Param("categories") List<TaskStatus.Category> categories);

    // Member performance: total tasks, completed tasks, total SP, completed SP per assignee
    @Query("SELECT t.assignee.id, COUNT(t), " +
           "SUM(CASE WHEN t.status.category IN :completedCategories THEN 1 ELSE 0 END), " +
           "COALESCE(SUM(t.storyPoints), 0), " +
           "COALESCE(SUM(CASE WHEN t.status.category IN :completedCategories THEN t.storyPoints ELSE 0 END), 0) " +
           "FROM Task t WHERE t.project.id = :projectId AND t.assignee.id IS NOT NULL " +
           "GROUP BY t.assignee.id")
    List<Object[]> memberTaskStatsForProject(@Param("projectId") Long projectId,
                                             @Param("completedCategories") List<TaskStatus.Category> completedCategories);

    // On-time delivery: count completed tasks where dueDate is null or dueDate >= today
    @Query("SELECT t.assignee.id, COUNT(t) FROM Task t WHERE t.project.id = :projectId " +
           "AND t.assignee.id IS NOT NULL AND t.status.category IN :completedCategories " +
           "AND (t.dueDate IS NULL OR t.dueDate >= CURRENT_DATE) " +
           "GROUP BY t.assignee.id")
    List<Object[]> memberOnTimeCountForProject(@Param("projectId") Long projectId,
                                                @Param("completedCategories") List<TaskStatus.Category> completedCategories);
}