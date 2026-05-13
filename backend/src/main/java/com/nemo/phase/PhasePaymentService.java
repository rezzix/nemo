package com.nemo.phase;

import com.nemo.common.exception.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service
public class PhasePaymentService {

    private final PhasePaymentRepository paymentRepository;
    private final PhaseRepository phaseRepository;

    public PhasePaymentService(PhasePaymentRepository paymentRepository, PhaseRepository phaseRepository) {
        this.paymentRepository = paymentRepository;
        this.phaseRepository = phaseRepository;
    }

    @Transactional(readOnly = true)
    public List<PhasePayment> getByPhaseId(Long phaseId) {
        return paymentRepository.findByPhaseIdOrderByPaymentDateDesc(phaseId);
    }

    @Transactional(readOnly = true)
    public PhasePayment getById(Long id) {
        return paymentRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("PhasePayment", id));
    }

    @Transactional
    public PhasePayment create(Long phaseId, PhasePaymentDto.CreateRequest request) {
        Phase phase = phaseRepository.findById(phaseId)
                .orElseThrow(() -> new EntityNotFoundException("Phase", phaseId));
        PhasePayment payment = new PhasePayment();
        payment.setPhase(phase);
        payment.setAmount(new BigDecimal(request.amount()));
        payment.setPaymentDate(request.paymentDate() != null ? LocalDate.parse(request.paymentDate()) : LocalDate.now());
        payment.setReference(request.reference());
        payment.setNotes(request.notes());
        return paymentRepository.save(payment);
    }

    @Transactional
    public PhasePayment update(Long id, PhasePaymentDto.UpdateRequest request) {
        PhasePayment payment = getById(id);
        if (request.amount() != null) payment.setAmount(new BigDecimal(request.amount()));
        if (request.paymentDate() != null) payment.setPaymentDate(LocalDate.parse(request.paymentDate()));
        if (request.reference() != null) payment.setReference(request.reference());
        if (request.notes() != null) payment.setNotes(request.notes());
        return paymentRepository.save(payment);
    }

    @Transactional
    public void delete(Long id) {
        PhasePayment payment = getById(id);
        paymentRepository.delete(payment);
    }
}