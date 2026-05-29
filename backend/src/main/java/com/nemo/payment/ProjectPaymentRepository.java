package com.nemo.payment;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public interface ProjectPaymentRepository extends JpaRepository<ProjectPayment, Long> {

    List<ProjectPayment> findByProjectIdOrderByDueDateAsc(Long projectId);

    BigDecimal sumAmountByProjectIdAndStatus(Long projectId, ProjectPayment.PaymentStatus status);

    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM ProjectPayment p WHERE p.status = :status")
    BigDecimal sumAmountByStatus(@Param("status") ProjectPayment.PaymentStatus status);

    @Query("SELECT p FROM ProjectPayment p WHERE p.status = 'PENDING' AND p.dueDate < :date ORDER BY p.dueDate ASC")
    List<ProjectPayment> findOverduePayments(@Param("date") LocalDate date);

    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM ProjectPayment p WHERE p.status IN :statuses")
    BigDecimal sumAmountByStatuses(@Param("statuses") List<ProjectPayment.PaymentStatus> statuses);
}