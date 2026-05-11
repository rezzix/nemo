package com.jari.timetracking;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDate;
import java.util.List;

public interface TimeLogRepository extends JpaRepository<TimeLog, Long> {

    Page<TimeLog> findByUserId(Long userId, Pageable pageable);

    @Query("SELECT tl FROM TimeLog tl WHERE " +
           "(:userId IS NULL OR tl.user.id = :userId) AND " +
           "(:issueId IS NULL OR tl.issue.id = :issueId) AND " +
           "(:projectId IS NULL OR tl.issue.project.id = :projectId) AND " +
           "(:presaleId IS NULL OR tl.presale.id = :presaleId) AND " +
           "(:startDate IS NULL OR tl.logDate >= :startDate) AND " +
           "(:endDate IS NULL OR tl.logDate <= :endDate)")
    Page<TimeLog> search(Long userId, Long issueId, Long projectId, Long presaleId, LocalDate startDate, LocalDate endDate, Pageable pageable);

    List<TimeLog> findByUserIdAndLogDateBetween(Long userId, LocalDate startDate, LocalDate endDate);

    @Query("SELECT tl FROM TimeLog tl WHERE tl.issue.project.id = :projectId AND tl.logDate BETWEEN :startDate AND :endDate")
    List<TimeLog> findByProjectIdAndDateRange(Long projectId, LocalDate startDate, LocalDate endDate);

    @Query("SELECT tl FROM TimeLog tl WHERE tl.user.id = :userId AND tl.logDate BETWEEN :startDate AND :endDate")
    List<TimeLog> findByUserIdAndDateRange(Long userId, LocalDate startDate, LocalDate endDate);

    @Query("SELECT tl FROM TimeLog tl WHERE tl.logDate BETWEEN :startDate AND :endDate")
    List<TimeLog> findByDateRange(LocalDate startDate, LocalDate endDate);

    @Query("SELECT DISTINCT tl.user.id FROM TimeLog tl WHERE tl.logDate BETWEEN :startDate AND :endDate")
    List<Long> findDistinctUserIdsByDateRange(LocalDate startDate, LocalDate endDate);

    List<TimeLog> findByPresaleId(Long presaleId);
}