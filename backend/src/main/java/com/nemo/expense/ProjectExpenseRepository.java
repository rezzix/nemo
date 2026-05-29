package com.nemo.expense;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public interface ProjectExpenseRepository extends JpaRepository<ProjectExpense, Long> {

    List<ProjectExpense> findByProjectIdOrderByExpenseDateDesc(Long projectId);

    @Query("SELECT COALESCE(SUM(e.amount), 0) FROM ProjectExpense e WHERE e.project.id = :projectId")
    BigDecimal sumByProjectId(@Param("projectId") Long projectId);

    @Query("SELECT COALESCE(SUM(e.amount), 0) FROM ProjectExpense e WHERE e.project.id = :projectId AND e.expenseDate BETWEEN :startDate AND :endDate")
    BigDecimal sumByProjectIdAndDateRange(@Param("projectId") Long projectId, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    void deleteByProjectId(Long projectId);

    List<ProjectExpense> findByApprovalStatus(ProjectExpense.ApprovalStatus approvalStatus);
}