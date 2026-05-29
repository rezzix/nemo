package com.nemo.payment;

import org.springframework.data.jpa.repository.JpaRepository;

import java.math.BigDecimal;
import java.util.List;

public interface ProjectPaymentRepository extends JpaRepository<ProjectPayment, Long> {

    List<ProjectPayment> findByProjectIdOrderByDueDateAsc(Long projectId);

    BigDecimal sumAmountByProjectIdAndStatus(Long projectId, ProjectPayment.PaymentStatus status);
}