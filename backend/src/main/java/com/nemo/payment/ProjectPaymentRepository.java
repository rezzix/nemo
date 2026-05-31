package com.nemo.payment;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public interface ProjectPaymentRepository extends JpaRepository<ProjectPayment, Long> {

    List<ProjectPayment> findByProjectIdOrderByDueDateAsc(Long projectId);

    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM ProjectPayment p WHERE p.project.id = :projectId AND p.status = :status")
    BigDecimal sumAmountByProjectIdAndStatus(@Param("projectId") Long projectId, @Param("status") ProjectPayment.PaymentStatus status);

    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM ProjectPayment p WHERE p.status = :status")
    BigDecimal sumAmountByStatus(@Param("status") ProjectPayment.PaymentStatus status);

    @Query("SELECT p FROM ProjectPayment p JOIN FETCH p.project WHERE p.status = :status AND p.dueDate < :date ORDER BY p.dueDate ASC")
    List<ProjectPayment> findOverduePayments(@Param("status") ProjectPayment.PaymentStatus status, @Param("date") LocalDate date);

    @Query("SELECT p FROM ProjectPayment p JOIN FETCH p.project WHERE p.dueDate BETWEEN :start AND :end ORDER BY p.dueDate ASC")
    List<ProjectPayment> findByDueDateBetweenOrderByDueDateAsc(@Param("start") LocalDate start, @Param("end") LocalDate end);

    @Query("SELECT p FROM ProjectPayment p JOIN FETCH p.project WHERE p.receivedDate BETWEEN :start AND :end ORDER BY p.receivedDate ASC")
    List<ProjectPayment> findByReceivedDateBetweenOrderByReceivedDateAsc(@Param("start") LocalDate start, @Param("end") LocalDate end);
}