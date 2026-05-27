package com.nemo.phase;

import com.nemo.attachment.AttachmentService;
import com.nemo.common.exception.EntityNotFoundException;
import com.nemo.expense.ProjectExpenseRepository;
import com.nemo.project.Project;
import com.nemo.project.ProjectRepository;
import com.nemo.timetracking.TimeLog;
import com.nemo.timetracking.TimeLogRepository;
import com.nemo.timetracking.UserRate;
import com.nemo.timetracking.UserRateRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class PhaseService {

    private final PhaseRepository phaseRepository;
    private final ProjectRepository projectRepository;
    private final DeliverableRepository deliverableRepository;
    private final AttachmentService attachmentService;
    private final ClientPaymentRepository clientPaymentRepository;
    private final TimeLogRepository timeLogRepository;
    private final UserRateRepository userRateRepository;
    private final ProjectExpenseRepository expenseRepository;

    public PhaseService(PhaseRepository phaseRepository,
                        ProjectRepository projectRepository,
                        DeliverableRepository deliverableRepository,
                        AttachmentService attachmentService,
                        ClientPaymentRepository clientPaymentRepository,
                        TimeLogRepository timeLogRepository,
                        UserRateRepository userRateRepository,
                        ProjectExpenseRepository expenseRepository) {
        this.phaseRepository = phaseRepository;
        this.projectRepository = projectRepository;
        this.deliverableRepository = deliverableRepository;
        this.attachmentService = attachmentService;
        this.clientPaymentRepository = clientPaymentRepository;
        this.timeLogRepository = timeLogRepository;
        this.userRateRepository = userRateRepository;
        this.expenseRepository = expenseRepository;
    }

    @Transactional(readOnly = true)
    public List<Phase> getByProjectId(Long projectId) {
        return phaseRepository.findByProjectIdOrderByPositionAsc(projectId);
    }

    @Transactional(readOnly = true)
    public List<Phase> getOpenByProjectId(Long projectId) {
        return phaseRepository.findByProjectIdAndStatusOrderByPositionAsc(projectId, Phase.PhaseStatus.OPEN);
    }

    @Transactional(readOnly = true)
    public List<Phase> getByProjectIdAndStatus(Long projectId, Phase.PhaseStatus status) {
        return phaseRepository.findByProjectIdAndStatusOrderByPositionAsc(projectId, status);
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
        if (request.plannedAmount() != null && !request.plannedAmount().isBlank()) {
            phase.setPlannedAmount(new BigDecimal(request.plannedAmount()));
        }
        if (request.status() != null) {
            phase.setStatus(Phase.PhaseStatus.valueOf(request.status()));
        }
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
        if (request.plannedAmount() != null) {
            phase.setPlannedAmount(request.plannedAmount().isBlank() ? null : new BigDecimal(request.plannedAmount()));
        }
        if (request.status() != null) {
            phase.setStatus(Phase.PhaseStatus.valueOf(request.status()));
        }
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
        clientPaymentRepository.deleteByPhaseId(id);
        phaseRepository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public List<PhaseDto> enrichWithComputedFields(List<PhaseDto> dtos) {
        if (dtos.isEmpty()) return dtos;
        List<Long> phaseIds = dtos.stream().map(PhaseDto::id).toList();
        Map<Long, Long> deliverableCounts = deliverableRepository.countByPhaseIds(phaseIds).stream()
                .collect(Collectors.toMap(arr -> (Long) arr[0], arr -> (Long) arr[1]));
        Map<Long, BigDecimal> paidSums = clientPaymentRepository.sumPaidByPhaseIds(phaseIds).stream()
                .collect(Collectors.toMap(arr -> (Long) arr[0], arr -> (BigDecimal) arr[1]));

        return dtos.stream().map(dto -> {
            long dCount = deliverableCounts.getOrDefault(dto.id(), 0L);
            BigDecimal totalPaid = paidSums.getOrDefault(dto.id(), BigDecimal.ZERO);
            BigDecimal spent = computePhaseSpent(dto);
            return new PhaseDto(dto.id(), dto.name(), dto.description(),
                    dto.projectId(), dto.startDate(), dto.endDate(),
                    dto.position(), dto.status(), dCount,
                    dto.plannedAmount(), totalPaid.toPlainString(),
                    spent.toPlainString(),
                    dto.createdAt(), dto.updatedAt());
        }).toList();
    }

    private BigDecimal computePhaseSpent(PhaseDto dto) {
        if (dto.projectId() == null || dto.startDate() == null || dto.endDate() == null) {
            return BigDecimal.ZERO;
        }
        BigDecimal laborCost = computeLaborCostForRange(dto.projectId(), dto.startDate(), dto.endDate());
        BigDecimal expenseCost = expenseRepository.sumByProjectIdAndDateRange(dto.projectId(), dto.startDate(), dto.endDate());
        return laborCost.add(expenseCost).setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal computeLaborCostForRange(Long projectId, LocalDate startDate, LocalDate endDate) {
        List<TimeLog> logs = timeLogRepository.findByProjectIdAndDateRange(projectId, startDate, endDate);
        BigDecimal total = BigDecimal.ZERO;
        for (TimeLog log : logs) {
            UserRate rate = userRateRepository.findEffectiveRate(
                    log.getUser().getId(), log.getLogDate()).orElse(null);
            if (rate != null) {
                total = total.add(log.getHours().multiply(rate.getHourlyRate()));
            }
        }
        return total.setScale(2, RoundingMode.HALF_UP);
    }
}