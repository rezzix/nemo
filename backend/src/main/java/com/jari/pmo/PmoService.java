package com.jari.pmo;

import com.jari.common.exception.EntityNotFoundException;
import com.jari.company.Company;
import com.jari.config.IssueStatus;
import com.jari.config.IssueStatusRepository;
import com.jari.issue.IssueRepository;
import com.jari.phase.DeliverableRepository;
import com.jari.phase.Phase;
import com.jari.phase.PhasePaymentRepository;
import com.jari.phase.PhaseRepository;
import com.jari.project.Project;
import com.jari.project.ProjectRepository;
import com.jari.timetracking.TimeLog;
import com.jari.timetracking.TimeLogRepository;
import com.jari.timetracking.UserRate;
import com.jari.timetracking.UserRateRepository;
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
    private final IssueRepository issueRepository;
    private final IssueStatusRepository issueStatusRepository;
    private final TimeLogRepository timeLogRepository;
    private final UserRateRepository userRateRepository;
    private final RaidItemRepository raidItemRepository;
    private final PhaseRepository phaseRepository;
    private final DeliverableRepository deliverableRepository;
    private final PhasePaymentRepository phasePaymentRepository;

    public PmoService(ProjectRepository projectRepository,
                      IssueRepository issueRepository,
                      IssueStatusRepository issueStatusRepository,
                      TimeLogRepository timeLogRepository,
                      UserRateRepository userRateRepository,
                      RaidItemRepository raidItemRepository,
                      PhaseRepository phaseRepository,
                      DeliverableRepository deliverableRepository,
                      PhasePaymentRepository phasePaymentRepository) {
        this.projectRepository = projectRepository;
        this.issueRepository = issueRepository;
        this.issueStatusRepository = issueStatusRepository;
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

        long totalIssues = issueRepository.countByProjectId(projectId);

        // Count completed issues (status category = DONE or CLOSED)
        List<IssueStatus> completedStatuses = new java.util.ArrayList<>();
        completedStatuses.addAll(issueStatusRepository.findByCategory(IssueStatus.Category.DONE));
        completedStatuses.addAll(issueStatusRepository.findByCategory(IssueStatus.Category.CLOSED));
        long completedIssues = 0;
        for (IssueStatus status : completedStatuses) {
            completedIssues += issueRepository.countByProjectIdAndStatusId(projectId, status.getId());
        }

        // Completion percentage
        BigDecimal completionPct = totalIssues > 0
                ? BigDecimal.valueOf(completedIssues).divide(BigDecimal.valueOf(totalIssues), 4, RoundingMode.HALF_UP)
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

        // Actual Cost (AC) = labor cost only (internal cost from time logs × rates)
        LocalDate projectStart = project.getTargetStartDate();
        LocalDate projectEnd = project.getTargetEndDate();
        BigDecimal laborCost = computeLaborCost(projectId, projectStart, projectEnd);
        BigDecimal actualCost = laborCost.setScale(2, RoundingMode.HALF_UP);

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

        // CPI = EV / AC
        BigDecimal cpi = actualCost.compareTo(BigDecimal.ZERO) > 0
                ? earnedValue.divide(actualCost, 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        // SPI = EV / PV
        BigDecimal spi = pvToday.compareTo(BigDecimal.ZERO) > 0
                ? earnedValue.divide(pvToday, 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        // Risk summary
        long openRisks = raidItemRepository.countByProjectIdAndStatus(projectId, RaidItem.RaidStatus.OPEN);
        long mitigatingRisks = raidItemRepository.countByProjectIdAndStatus(projectId, RaidItem.RaidStatus.MITIGATING);
        List<RaidItem> riskItems = raidItemRepository.findByProjectIdAndType(projectId, RaidItem.RaidType.RISK);
        int maxRiskScore = riskItems.stream().mapToInt(RaidItem::getRiskScore).max().orElse(0);
        double avgRiskScore = riskItems.isEmpty() ? 0.0 :
                riskItems.stream().mapToInt(RaidItem::getRiskScore).average().orElse(0.0);

        return new EvmMetrics(
                projectId, project.getName(),
                totalIssues, completedIssues, completionPct,
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

    private BigDecimal computeLaborCost(Long projectId, LocalDate startDate, LocalDate endDate) {
        if (startDate == null || endDate == null) {
            // If no date range, use all time logs for the project
            List<TimeLog> logs = timeLogRepository.findByProjectIdAndDateRange(
                    projectId, LocalDate.of(2000, 1, 1), LocalDate.now());
            return sumLaborCost(logs);
        }
        List<TimeLog> logs = timeLogRepository.findByProjectIdAndDateRange(projectId, startDate, endDate);
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
            long totalIssues, long completedIssues, BigDecimal completionPct,
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
    public PortfolioSummary getPortfolioSummary() {
        List<Project> projects = projectRepository.findAll();

        int totalProjects = projects.size();
        long totalIssues = 0;
        long totalCompleted = 0;
        BigDecimal totalPlannedValue = BigDecimal.ZERO;
        BigDecimal totalEarnedValue = BigDecimal.ZERO;
        BigDecimal totalActualCost = BigDecimal.ZERO;
        BigDecimal totalBudget = BigDecimal.ZERO;
        BigDecimal totalBudgetSpent = BigDecimal.ZERO;
        long totalOpenRisks = 0;
        long totalMitigatingRisks = 0;

        List<IssueStatus> completedStatuses = new java.util.ArrayList<>();
        completedStatuses.addAll(issueStatusRepository.findByCategory(IssueStatus.Category.DONE));
        completedStatuses.addAll(issueStatusRepository.findByCategory(IssueStatus.Category.CLOSED));

        for (Project project : projects) {
            long projTotal = issueRepository.countByProjectId(project.getId());
            long projCompleted = 0;
            for (IssueStatus status : completedStatuses) {
                projCompleted += issueRepository.countByProjectIdAndStatusId(project.getId(), status.getId());
            }
            totalIssues += projTotal;
            totalCompleted += projCompleted;

            if (project.getPlannedValue() != null) totalPlannedValue = totalPlannedValue.add(project.getPlannedValue());
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
                totalProjects, totalIssues, totalCompleted,
                totalPlannedValue, totalEarnedValue, totalActualCost,
                totalBudget, totalBudgetSpent,
                portfolioCv, portfolioSv,
                totalOpenRisks, totalMitigatingRisks,
                stageDistribution
        );
    }

    public record PortfolioSummary(
            int totalProjects, long totalIssues, long totalCompleted,
            BigDecimal totalPlannedValue, BigDecimal totalEarnedValue, BigDecimal totalActualCost,
            BigDecimal totalBudget, BigDecimal totalBudgetSpent,
            BigDecimal portfolioCv, BigDecimal portfolioSv,
            long totalOpenRisks, long totalMitigatingRisks,
            Map<String, Long> stageDistribution
    ) {}

    public record CompanyPortfolioSummary(
            Long companyId, String companyName, String companyKey,
            int totalProjects, long totalIssues, long totalCompleted,
            BigDecimal totalBudget, BigDecimal totalBudgetSpent,
            long totalOpenRisks, long totalMitigatingRisks,
            Map<String, Long> stageDistribution
    ) {}

    @Transactional(readOnly = true)
    public List<CompanyPortfolioSummary> getPortfolioByCompany() {
        List<Project> projects = projectRepository.findAll();

        List<IssueStatus> completedStatuses = new java.util.ArrayList<>();
        completedStatuses.addAll(issueStatusRepository.findByCategory(IssueStatus.Category.DONE));
        completedStatuses.addAll(issueStatusRepository.findByCategory(IssueStatus.Category.CLOSED));

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
                companyName = "Unassigned";
                companyKey = "N/A";
            } else {
                Company c = companyProjects.get(0).getCompany();
                companyName = c.getName();
                companyKey = c.getKey();
            }

            int totalProjects = companyProjects.size();
            long totalIssues = 0;
            long totalCompleted = 0;
            BigDecimal totalBudget = BigDecimal.ZERO;
            BigDecimal totalBudgetSpent = BigDecimal.ZERO;
            long totalOpenRisks = 0;
            long totalMitigatingRisks = 0;

            for (Project p : companyProjects) {
                long projTotal = issueRepository.countByProjectId(p.getId());
                long projCompleted = 0;
                for (IssueStatus status : completedStatuses) {
                    projCompleted += issueRepository.countByProjectIdAndStatusId(p.getId(), status.getId());
                }
                totalIssues += projTotal;
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
                    totalProjects, totalIssues, totalCompleted,
                    totalBudget, totalBudgetSpent,
                    totalOpenRisks, totalMitigatingRisks,
                    stageDistribution
            ));
        }

        return result;
    }

    @Transactional(readOnly = true)
    public List<RaidItem> getPortfolioRaidItems(RaidItem.RaidType type) {
        if (type != null) {
            return raidItemRepository.findByType(type);
        }
        return raidItemRepository.findAll();
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
    public List<ProjectTimelineEntry> getPortfolioTimeline() {
        List<Project> projects = projectRepository.findAll();
        List<Long> projectIds = projects.stream().map(Project::getId).toList();
        List<Phase> allPhases = projectIds.isEmpty() ? List.of() : phaseRepository.findByProjectIdInOrderByProjectIdAscPositionAsc(projectIds);

        List<IssueStatus> completedStatuses = new java.util.ArrayList<>();
        completedStatuses.addAll(issueStatusRepository.findByCategory(IssueStatus.Category.DONE));
        completedStatuses.addAll(issueStatusRepository.findByCategory(IssueStatus.Category.CLOSED));

        Map<Long, List<Phase>> phasesByProject = allPhases.stream()
                .collect(java.util.stream.Collectors.groupingBy(p -> p.getProject().getId()));

        List<ProjectTimelineEntry> result = new java.util.ArrayList<>();
        for (Project project : projects) {
            List<Phase> phases = phasesByProject.getOrDefault(project.getId(), List.of());

            long totalIssues = issueRepository.countByProjectId(project.getId());
            long completedIssues = 0;
            for (IssueStatus status : completedStatuses) {
                completedIssues += issueRepository.countByProjectIdAndStatusId(project.getId(), status.getId());
            }
            BigDecimal completionPct = totalIssues > 0
                    ? BigDecimal.valueOf(completedIssues).divide(BigDecimal.valueOf(totalIssues), 4, RoundingMode.HALF_UP)
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