package com.nemo.timetracking;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface TimeLogRepository extends JpaRepository<TimeLog, Long> {

    Page<TimeLog> findByUserId(Long userId, Pageable pageable);

    @Query("SELECT tl FROM TimeLog tl WHERE " +
           "(:userId IS NULL OR tl.user.id = :userId) AND " +
           "(:taskId IS NULL OR tl.task.id = :taskId) AND " +
           "(:projectId IS NULL OR tl.task.project.id = :projectId) AND " +
           "(:presaleId IS NULL OR tl.presale.id = :presaleId) AND " +
           "(:startDate IS NULL OR tl.logDate >= :startDate) AND " +
           "(:endDate IS NULL OR tl.logDate <= :endDate)")
    Page<TimeLog> search(Long userId, Long taskId, Long projectId, Long presaleId, LocalDate startDate, LocalDate endDate, Pageable pageable);

    List<TimeLog> findByUserIdAndLogDateBetween(Long userId, LocalDate startDate, LocalDate endDate);

    @Query("SELECT tl FROM TimeLog tl WHERE tl.task.project.id = :projectId AND tl.logDate BETWEEN :startDate AND :endDate")
    List<TimeLog> findByProjectIdAndDateRange(Long projectId, LocalDate startDate, LocalDate endDate);

    @Query("SELECT tl FROM TimeLog tl WHERE tl.task.project.id = :projectId")
    List<TimeLog> findByProjectId(Long projectId);

    @Query("SELECT tl FROM TimeLog tl WHERE tl.user.id = :userId AND tl.logDate BETWEEN :startDate AND :endDate")
    List<TimeLog> findByUserIdAndDateRange(Long userId, LocalDate startDate, LocalDate endDate);

    @Query("SELECT tl FROM TimeLog tl WHERE tl.logDate BETWEEN :startDate AND :endDate")
    List<TimeLog> findByDateRange(LocalDate startDate, LocalDate endDate);

    @Query("SELECT DISTINCT tl.user.id FROM TimeLog tl WHERE tl.logDate BETWEEN :startDate AND :endDate")
    List<Long> findDistinctUserIdsByDateRange(LocalDate startDate, LocalDate endDate);

    List<TimeLog> findByPresaleId(Long presaleId);

    @Query("SELECT tl FROM TimeLog tl WHERE tl.logDate BETWEEN :startDate AND :endDate " +
           "AND (:companyId IS NULL OR tl.task.project.company.id = :companyId)")
    List<TimeLog> findByDateRangeAndCompany(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate, @Param("companyId") Long companyId);
}