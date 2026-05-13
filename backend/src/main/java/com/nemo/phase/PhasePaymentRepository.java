package com.nemo.phase;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;

public interface PhasePaymentRepository extends JpaRepository<PhasePayment, Long> {

    List<PhasePayment> findByPhaseIdOrderByPaymentDateDesc(Long phaseId);

    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM PhasePayment p WHERE p.phase.id = :phaseId")
    BigDecimal sumPaidByPhaseId(@Param("phaseId") Long phaseId);

    @Query("SELECT p.phase.id, COALESCE(SUM(p.amount), 0) FROM PhasePayment p WHERE p.phase.id IN :phaseIds GROUP BY p.phase.id")
    List<Object[]> sumPaidByPhaseIds(@Param("phaseIds") List<Long> phaseIds);

    void deleteByPhaseId(Long phaseId);
}