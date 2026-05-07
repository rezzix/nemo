package com.jari.phase;

import com.jari.attachment.AttachmentService;
import com.jari.common.exception.EntityNotFoundException;
import com.jari.project.Project;
import com.jari.project.ProjectRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class PhaseService {

    private final PhaseRepository phaseRepository;
    private final ProjectRepository projectRepository;
    private final DeliverableRepository deliverableRepository;
    private final AttachmentService attachmentService;

    public PhaseService(PhaseRepository phaseRepository,
                        ProjectRepository projectRepository,
                        DeliverableRepository deliverableRepository,
                        AttachmentService attachmentService) {
        this.phaseRepository = phaseRepository;
        this.projectRepository = projectRepository;
        this.deliverableRepository = deliverableRepository;
        this.attachmentService = attachmentService;
    }

    @Transactional(readOnly = true)
    public List<Phase> getByProjectId(Long projectId) {
        return phaseRepository.findByProjectIdOrderByPositionAsc(projectId);
    }

    @Transactional(readOnly = true)
    public Phase getById(Long id) {
        return phaseRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Phase", id));
    }

    @Transactional
    public Phase create(Long projectId, PhaseDto.CreateRequest request) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new EntityNotFoundException("Project", projectId));

        List<Phase> existing = phaseRepository.findByProjectIdOrderByPositionAsc(projectId);
        int nextPosition = existing.isEmpty() ? 0 :
                existing.stream().mapToInt(Phase::getPosition).max().orElse(0) + 1;

        Phase phase = new Phase();
        phase.setName(request.name());
        phase.setDescription(request.description());
        phase.setProject(project);
        phase.setStartDate(request.startDate());
        phase.setEndDate(request.endDate());
        phase.setPosition(nextPosition);
        return phaseRepository.save(phase);
    }

    @Transactional
    public Phase update(Long id, PhaseDto.UpdateRequest request) {
        Phase phase = getById(id);
        if (request.name() != null) phase.setName(request.name());
        if (request.description() != null) phase.setDescription(request.description());
        if (request.startDate() != null) phase.setStartDate(request.startDate());
        if (request.endDate() != null) phase.setEndDate(request.endDate());
        if (request.position() != null) phase.setPosition(request.position());
        return phaseRepository.save(phase);
    }

    @Transactional
    public void delete(Long id) {
        getById(id);
        List<Long> deliverableIds = deliverableRepository.findByPhaseId(id).stream()
                .map(Deliverable::getId).toList();
        if (!deliverableIds.isEmpty()) {
            attachmentService.deleteByDeliverableIds(deliverableIds);
        }
        deliverableRepository.deleteByPhaseId(id);
        phaseRepository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public List<PhaseDto> enrichWithDeliverableCount(List<PhaseDto> dtos) {
        return dtos.stream().map(dto ->
                new PhaseDto(dto.id(), dto.name(), dto.description(),
                        dto.projectId(), dto.startDate(), dto.endDate(),
                        dto.position(),
                        deliverableRepository.countByPhaseId(dto.id()),
                        dto.createdAt(), dto.updatedAt())
        ).toList();
    }
}