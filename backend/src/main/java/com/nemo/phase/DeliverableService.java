package com.nemo.phase;

import com.nemo.attachment.AttachmentService;
import com.nemo.common.exception.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
public class DeliverableService {

    private final DeliverableRepository deliverableRepository;
    private final PhaseRepository phaseRepository;
    private final AttachmentService attachmentService;

    public DeliverableService(DeliverableRepository deliverableRepository,
                              PhaseRepository phaseRepository,
                              AttachmentService attachmentService) {
        this.deliverableRepository = deliverableRepository;
        this.phaseRepository = phaseRepository;
        this.attachmentService = attachmentService;
    }

    @Transactional(readOnly = true)
    public List<Deliverable> getByProjectId(Long projectId) {
        return deliverableRepository.findByPhaseProjectId(projectId);
    }

    @Transactional(readOnly = true)
    public List<Deliverable> getByPhaseId(Long phaseId) {
        return deliverableRepository.findByPhaseId(phaseId);
    }

    @Transactional(readOnly = true)
    public Deliverable getById(Long id) {
        return deliverableRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Deliverable", id));
    }

    @Transactional
    public Deliverable create(DeliverableDto.CreateRequest request) {
        Phase phase = phaseRepository.findById(request.phaseId())
                .orElseThrow(() -> new EntityNotFoundException("Phase", request.phaseId()));

        Deliverable deliverable = new Deliverable();
        deliverable.setName(request.name());
        deliverable.setDescription(request.description());
        deliverable.setPhase(phase);
        deliverable.setState(Deliverable.DeliverableState.DRAFT);
        deliverable.setDueDate(request.dueDate() != null ? LocalDate.parse(request.dueDate()) : null);
        return deliverableRepository.save(deliverable);
    }

    @Transactional
    public Deliverable update(Long id, DeliverableDto.UpdateRequest request) {
        Deliverable deliverable = getById(id);
        if (request.name() != null) deliverable.setName(request.name());
        if (request.description() != null) deliverable.setDescription(request.description());
        if (request.state() != null) deliverable.setState(Deliverable.DeliverableState.valueOf(request.state()));
        if (request.dueDate() != null) deliverable.setDueDate(LocalDate.parse(request.dueDate()));
        return deliverableRepository.save(deliverable);
    }

    @Transactional
    public void delete(Long id) {
        getById(id);
        attachmentService.deleteByDeliverableId(id);
        deliverableRepository.deleteById(id);
    }
}