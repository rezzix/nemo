package com.nemo.pmo;

import com.nemo.common.exception.EntityNotFoundException;
import com.nemo.company.Company;
import com.nemo.config.TaskStatus;
import com.nemo.config.TaskStatusRepository;
import com.nemo.task.TaskRepository;
import com.nemo.phase.DeliverableRepository;
import com.nemo.phase.Phase;
import com.nemo.phase.PhasePaymentRepository;
import com.nemo.phase.PhaseRepository;
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
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;

@Service
public class PmoService {

    private final ProjectRepository projectRepository;
    private final TaskRepository taskRepository;
    private final TaskStatusRepository taskStatusRepository;
    private final TimeLogRepository timeLogRepository;
    private final UserRateRepository userRateRepository;
    private final RaidItemRepository raidItemRepository;
    private final PhaseRepository phaseRepository;
    private final DeliverableRepository deliverableRepository;
    private final PhasePaymentRepository phasePaymentRepository;

    public PmoService(ProjectRepository projectRepository,
                      TaskRepository taskRepository,
                      TaskStatusRepository taskStatusRepository,
                      TimeLogRepository timeLogRepository,
                      UserRateRepository userRateRepository,
                      RaidItemRepository raidItemRepository,
                      PhaseRepository phaseRepository,
                      DeliverableRepository deliverableRepository,
                      PhasePaymentRepository phasePaymentRepository) {
        this.projectRepository = projectRepository;
        this.taskRepository = taskRepository;
        this.taskStatusRepository = taskStatusRepository;
        this.timeLogRepository = timeLogRepository;
        this.userRateRepository = userRateRepository;
        this.raidItemRepository = raidItemRepository;
        this.phaseRepository = phaseRepository;
        this.deliverableRepository = deliverableRepository;
        this.phasePaymentRepository = phasePaymentRepository;
    }

    @Transactional(readOnly = true)
    public EvmMetrics computeEvm(Long projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new EntityNotFoundException("Project", projectId));

        long totalTasks = taskRepository.countByProjectId(projectId);

        // Count completed issues (status category = DONE or CLOSED)
        List<TaskStatus> completedStatuses = new java.util.ArrayList<>();
        completedStatuses.addAll(taskStatusRepository.findByCategory(TaskStatus.Category.DONE));
        completedStatuses.addAll(taskStatusRepository.findByCategory(TaskStatus.Category.CLOSED));
        long completedTasks = 0;
        for (TaskStatus status : completedStatuses) {
            completedTasks += taskRepository.countByProjectIdAndStatusId(projectId, status.getId());
        }

        // Completion percentage
        BigDecimal completionPct = totalTasks > 0
                ? BigDecimal.valueOf(completedTasks).divide(BigDecimal.valueOf(totalTasks), 4, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        // Derived Planned Value = sum of phase planned amounts
        List<Phase> phases = phaseRepository.findByProjectIdOrderByPositionAsc(projectId);
        BigDecimal derivedPlannedValue = phases.stream()
                .map(p -> p.getPlannedAmount() != null ? p.getPlannedAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Planned Value: use derived from phases if available, otherwise fall back to project field
        BigDecimal plannedValue = derivedPlannedValue.compareTo(BigDecimal.ZERO) > 0
                ? derivedPlannedValue
                : (project.getPlannedValue() != null ? project.getPlannedValue() : BigDecimal.ZERO);

        // Earned Value (EV) = completion% × plannedValue
        BigDecimal earnedValue = completionPct.multiply(plannedValue).setScale(2, RoundingMode.HALF_UP);

        // Actual Cost (AC) = labor cost + project budget spent (external costs)
        BigDecimal laborCost = computeLaborCost(projectId);
        BigDecimal budgetSpent = project.getBudgetSpent() != null ? project.getBudgetSpent() : BigDecimal.ZERO;
        BigDecimal actualCost = laborCost.add(budgetSpent).setScale(2, RoundingMode.HALF_UP);

        // Total paid by client (sum of phase payments)
        List<Long> phaseIds = phases.stream().map(Phase::getId).toList();
        BigDecimal totalPaid = BigDecimal.ZERO;
        if (!phaseIds.isEmpty()) {
            List<Object[]> paidSums = phasePaymentRepository.sumPaidByPhaseIds(phaseIds);
            for (Object[] row : paidSums) {
                if (row[1] != null) totalPaid = totalPaid.add((BigDecimal) row[1]);
            }
        }

        // Cost Variance (CV) = EV - AC
        BigDecimal costVariance = earnedValue.subtract(actualCost).setScale(2, RoundingMode.HALF_UP);

        // Schedule Variance (SV) = EV - PV
        // PV at current date = (elapsedDays / totalDays) × plannedValue
        BigDecimal pvToday = computePlannedValueToday(project, plannedValue);
        BigDecimal scheduleVariance = earnedValue.subtract(pvToday).setScale(2, RoundingMode.HALF_UP);

        // CPI = EV / AC (null when AC = 0 — no costs recorded yet)
        BigDecimal cpi = actualCost.compareTo(BigDecimal.ZERO) > 0
                ? earnedValue.divide(actualCost, 2, RoundingMode.HALF_UP)
                : null;

        // SPI = EV / PV (null when EV = 0 or PV = 0 — no meaningful ratio)
        BigDecimal spi = earnedValue.compareTo(BigDecimal.ZERO) > 0 && pvToday.compareTo(BigDecimal.ZERO) > 0
                ? earnedValue.divide(pvToday, 2, RoundingMode.HALF_UP)
                : null;

        // Risk summary
        long openRisks = raidItemRepository.countByProjectIdAndStatus(projectId, RaidItem.RaidStatus.OPEN);
        long mitigatingRisks = raidItemRepository.countByProjectIdAndStatus(projectId, RaidItem.RaidStatus.MITIGATING);
        List<RaidItem> riskItems = raidItemRepository.findByProjectIdAndType(projectId, RaidItem.RaidType.RISK);
        int maxRiskScore = riskItems.stream().mapToInt(RaidItem::getRiskScore).max().orElse(0);
        double avgRiskScore = riskItems.isEmpty() ? 0.0 :
                riskItems.stream().mapToInt(RaidItem::getRiskScore).average().orElse(0.0);

        return new EvmMetrics(
                projectId, project.getName(),
                totalTasks, completedTasks, completionPct,
                plannedValue, earnedValue, actualCost,
                pvToday, costVariance, scheduleVariance,
                cpi, spi,
                project.getBudget(), laborCost,
                project.getStage() != null ? project.getStage().name() : null,
                project.getStrategicScore(),
                project.getTargetStartDate() != null ? project.getTargetStartDate().toString() : null,
                project.getTargetEndDate() != null ? project.getTargetEndDate().toString() : null,
                openRisks, mitigatingRisks, maxRiskScore, avgRiskScore,
                derivedPlannedValue, totalPaid
        );
    }

    private BigDecimal computeLaborCost(Long projectId) {
        List<TimeLog> logs = timeLogRepository.findByProjectId(projectId);
        return sumLaborCost(logs);
    }

    private BigDecimal sumLaborCost(List<TimeLog> logs) {
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

    private BigDecimal computePlannedValueToday(Project project, BigDecimal plannedValue) {
        if (project.getTargetStartDate() == null || project.getTargetEndDate() == null || plannedValue == null) {
            return plannedValue != null ? plannedValue : BigDecimal.ZERO;
        }
        LocalDate today = LocalDate.now();
        LocalDate start = project.getTargetStartDate();
        LocalDate end = project.getTargetEndDate();
        long totalDays = ChronoUnit.DAYS.between(start, end);
        if (totalDays <= 0) return plannedValue;

        long elapsedDays = ChronoUnit.DAYS.between(start, today);
        if (elapsedDays < 0) return BigDecimal.ZERO;
        if (elapsedDays >= totalDays) return plannedValue;

        return plannedValue.multiply(BigDecimal.valueOf(elapsedDays))
                .divide(BigDecimal.valueOf(totalDays), 2, RoundingMode.HALF_UP);
    }

    public record EvmMetrics(
            Long projectId, String projectName,
            long totalTasks, long completedTasks, BigDecimal completionPct,
            BigDecimal plannedValue, BigDecimal earnedValue, BigDecimal actualCost,
            BigDecimal pvToday, BigDecimal costVariance, BigDecimal scheduleVariance,
            BigDecimal cpi, BigDecimal spi,
            BigDecimal budget, BigDecimal laborCost,
            String stage, Integer strategicScore,
            String targetStartDate, String targetEndDate,
            long openRisks, long mitigatingRisks, int maxRiskScore, double avgRiskScore,
            BigDecimal derivedPlannedValue, BigDecimal totalPaid
    ) {}

    @Transactional(readOnly = true)
    public PortfolioSummary getPortfolioSummary(Long companyId) {
        List<Project> projects = projectRepository.findAllByCompanyIdOrNull(companyId);

        int totalProjects = projects.size();
        long totalTasks = 0;
        long totalCompleted = 0;
        BigDecimal totalPlannedValue = BigDecimal.ZERO;
        BigDecimal totalEarnedValue = BigDecimal.ZERO;
        BigDecimal totalActualCost = BigDecimal.ZERO;
        BigDecimal totalBudget = BigDecimal.ZERO;
        BigDecimal totalBudgetSpent = BigDecimal.ZERO;
        long totalOpenRisks = 0;
        long totalMitigatingRisks = 0;

        List<TaskStatus> completedStatuses = new java.util.ArrayList<>();
        completedStatuses.addAll(taskStatusRepository.findByCategory(TaskStatus.Category.DONE));
        completedStatuses.addAll(taskStatusRepository.findByCategory(TaskStatus.Category.CLOSED));

        for (Project project : projects) {
            long projTotal = taskRepository.countByProjectId(project.getId());
            long projCompleted = 0;
            for (TaskStatus status : completedStatuses) {
                projCompleted += taskRepository.countByProjectIdAndStatusId(project.getId(), status.getId());
            }
            totalTasks += projTotal;
            totalCompleted += projCompleted;

            // Per-project EVM aggregation
            BigDecimal projPv = project.getPlannedValue() != null ? project.getPlannedValue() : BigDecimal.ZERO;
            totalPlannedValue = totalPlannedValue.add(projPv);

            BigDecimal projCompletion = projTotal > 0
                    ? BigDecimal.valueOf(projCompleted).divide(BigDecimal.valueOf(projTotal), 4, RoundingMode.HALF_UP)
                    : BigDecimal.ZERO;
            totalEarnedValue = totalEarnedValue.add(projCompletion.multiply(projPv).setScale(2, RoundingMode.HALF_UP));

            BigDecimal projLaborCost = computeLaborCost(project.getId());
            BigDecimal projBudgetSpent = project.getBudgetSpent() != null ? project.getBudgetSpent() : BigDecimal.ZERO;
            totalActualCost = totalActualCost.add(projLaborCost.add(projBudgetSpent).setScale(2, RoundingMode.HALF_UP));

            if (project.getBudget() != null) totalBudget = totalBudget.add(project.getBudget());
            if (project.getBudgetSpent() != null) totalBudgetSpent = totalBudgetSpent.add(project.getBudgetSpent());

            totalOpenRisks += raidItemRepository.countByProjectIdAndStatus(project.getId(), RaidItem.RaidStatus.OPEN);
            totalMitigatingRisks += raidItemRepository.countByProjectIdAndStatus(project.getId(), RaidItem.RaidStatus.MITIGATING);
        }

        // Portfolio-level EVM
        BigDecimal portfolioCv = totalEarnedValue.subtract(totalActualCost);
        BigDecimal portfolioSv = totalEarnedValue.subtract(totalPlannedValue);

        // Stage distribution
        Map<String, Long> stageDistribution = projects.stream()
                .collect(java.util.stream.Collectors.groupingBy(
                        p -> p.getStage() != null ? p.getStage().name() : "INITIATION",
                        java.util.stream.Collectors.counting()));

        return new PortfolioSummary(
                totalProjects, totalTasks, totalCompleted,
                totalPlannedValue, totalEarnedValue, totalActualCost,
                totalBudget, totalBudgetSpent,
                portfolioCv, portfolioSv,
                totalOpenRisks, totalMitigatingRisks,
                stageDistribution
        );
    }

    public record PortfolioSummary(
            int totalProjects, long totalTasks, long totalCompleted,
            BigDecimal totalPlannedValue, BigDecimal totalEarnedValue, BigDecimal totalActualCost,
            BigDecimal totalBudget, BigDecimal totalBudgetSpent,
            BigDecimal portfolioCv, BigDecimal portfolioSv,
            long totalOpenRisks, long totalMitigatingRisks,
            Map<String, Long> stageDistribution
    ) {}

    public record CompanyPortfolioSummary(
            Long companyId, String companyName, String companyKey,
            int totalProjects, long totalTasks, long totalCompleted,
            BigDecimal totalBudget, BigDecimal totalBudgetSpent,
            long totalOpenRisks, long totalMitigatingRisks,
            Map<String, Long> stageDistribution
    ) {}

    @Transactional(readOnly = true)
    public List<CompanyPortfolioSummary> getPortfolioByCompany(Long companyId) {
        List<Project> projects = projectRepository.findAllByCompanyIdOrNull(companyId);

        List<TaskStatus> completedStatuses = new java.util.ArrayList<>();
        completedStatuses.addAll(taskStatusRepository.findByCategory(TaskStatus.Category.DONE));
        completedStatuses.addAll(taskStatusRepository.findByCategory(TaskStatus.Category.CLOSED));

        // Group projects by company
        Map<Long, List<Project>> byCompany = new java.util.LinkedHashMap<>();
        for (Project p : projects) {
            Long cid = p.getCompany() != null ? p.getCompany().getId() : 0L;
            byCompany.computeIfAbsent(cid, k -> new java.util.ArrayList<>()).add(p);
        }

        List<CompanyPortfolioSummary> result = new java.util.ArrayList<>();
        for (Map.Entry<Long, List<Project>> entry : byCompany.entrySet()) {
            Long cid = entry.getKey();
            List<Project> companyProjects = entry.getValue();

            String companyName;
            String companyKey;
            if (cid == 0L) {
                companyName = "Global";
                companyKey = "N/A";
            } else {
                Company c = companyProjects.get(0).getCompany();
                companyName = c.getName();
                companyKey = c.getKey();
            }

            int totalProjects = companyProjects.size();
            long totalTasks = 0;
            long totalCompleted = 0;
            BigDecimal totalBudget = BigDecimal.ZERO;
            BigDecimal totalBudgetSpent = BigDecimal.ZERO;
            long totalOpenRisks = 0;
            long totalMitigatingRisks = 0;

            for (Project p : companyProjects) {
                long projTotal = taskRepository.countByProjectId(p.getId());
                long projCompleted = 0;
                for (TaskStatus status : completedStatuses) {
                    projCompleted += taskRepository.countByProjectIdAndStatusId(p.getId(), status.getId());
                }
                totalTasks += projTotal;
                totalCompleted += projCompleted;

                if (p.getBudget() != null) totalBudget = totalBudget.add(p.getBudget());
                if (p.getBudgetSpent() != null) totalBudgetSpent = totalBudgetSpent.add(p.getBudgetSpent());

                totalOpenRisks += raidItemRepository.countByProjectIdAndStatus(p.getId(), RaidItem.RaidStatus.OPEN);
                totalMitigatingRisks += raidItemRepository.countByProjectIdAndStatus(p.getId(), RaidItem.RaidStatus.MITIGATING);
            }

            Map<String, Long> stageDistribution = companyProjects.stream()
                    .collect(java.util.stream.Collectors.groupingBy(
                            p -> p.getStage() != null ? p.getStage().name() : "INITIATION",
                            java.util.stream.Collectors.counting()));

            result.add(new CompanyPortfolioSummary(
                    cid == 0L ? null : cid, companyName, companyKey,
                    totalProjects, totalTasks, totalCompleted,
                    totalBudget, totalBudgetSpent,
                    totalOpenRisks, totalMitigatingRisks,
                    stageDistribution
            ));
        }

        return result;
    }

    @Transactional(readOnly = true)
    public List<RaidItem> getPortfolioRaidItems(RaidItem.RaidType type, Long companyId) {
        if (type != null) {
            return raidItemRepository.findByCompanyIdAndType(companyId, type);
        }
        return raidItemRepository.findByCompanyIdOrNull(companyId);
    }

    public record PhaseTimelineEntry(
            Long phaseId, String phaseName,
            LocalDate startDate, LocalDate endDate,
            long totalDeliverables, long completedDeliverables
    ) {}

    public record ProjectTimelineEntry(
            Long projectId, String projectKey, String projectName,
            String companyName, String stage,
            LocalDate targetStartDate, LocalDate targetEndDate,
            BigDecimal completionPct,
            List<PhaseTimelineEntry> phases
    ) {}

    @Transactional(readOnly = true)
    public List<ProjectTimelineEntry> getPortfolioTimeline(Long companyId) {
        List<Project> projects = projectRepository.findAllByCompanyIdOrNull(companyId);
        List<Long> projectIds = projects.stream().map(Project::getId).toList();
        List<Phase> allPhases = projectIds.isEmpty() ? List.of() : phaseRepository.findByProjectIdInOrderByProjectIdAscPositionAsc(projectIds);

        List<TaskStatus> completedStatuses = new java.util.ArrayList<>();
        completedStatuses.addAll(taskStatusRepository.findByCategory(TaskStatus.Category.DONE));
        completedStatuses.addAll(taskStatusRepository.findByCategory(TaskStatus.Category.CLOSED));

        Map<Long, List<Phase>> phasesByProject = allPhases.stream()
                .collect(java.util.stream.Collectors.groupingBy(p -> p.getProject().getId()));

        List<ProjectTimelineEntry> result = new java.util.ArrayList<>();
        for (Project project : projects) {
            List<Phase> phases = phasesByProject.getOrDefault(project.getId(), List.of());

            long totalTasks = taskRepository.countByProjectId(project.getId());
            long completedTasks = 0;
            for (TaskStatus status : completedStatuses) {
                completedTasks += taskRepository.countByProjectIdAndStatusId(project.getId(), status.getId());
            }
            BigDecimal completionPct = totalTasks > 0
                    ? BigDecimal.valueOf(completedTasks).divide(BigDecimal.valueOf(totalTasks), 4, RoundingMode.HALF_UP)
                    : BigDecimal.ZERO;

            List<PhaseTimelineEntry> phaseEntries = new java.util.ArrayList<>();
            for (Phase phase : phases) {
                long totalDel = deliverableRepository.countByPhaseId(phase.getId());
                // Approximate completion: count deliverables whose status matches completed statuses
                long completedDel = 0; // simplified — could be enhanced later
                phaseEntries.add(new PhaseTimelineEntry(
                        phase.getId(), phase.getName(),
                        phase.getStartDate(), phase.getEndDate(),
                        totalDel, completedDel
                ));
            }

            result.add(new ProjectTimelineEntry(
                    project.getId(), project.getKey(), project.getName(),
                    project.getCompany() != null ? project.getCompany().getName() : null,
                    project.getStage() != null ? project.getStage().name() : null,
                    project.getTargetStartDate(), project.getTargetEndDate(),
                    completionPct,
                    phaseEntries
            ));
        }
        return result;
    }
}