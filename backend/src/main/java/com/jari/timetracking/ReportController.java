package com.jari.timetracking;

import com.jari.common.dto.ApiResponse;
import com.jari.project.Project;
import com.jari.project.ProjectRepository;
import com.jari.user.User;
import com.jari.user.UserRepository;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/reports")
public class ReportController {

    private final TimeLogRepository timeLogRepository;
    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;

    public ReportController(TimeLogRepository timeLogRepository, UserRepository userRepository, ProjectRepository projectRepository) {
        this.timeLogRepository = timeLogRepository;
        this.userRepository = userRepository;
        this.projectRepository = projectRepository;
    }

    @GetMapping("/time-by-project")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EXECUTIVE', 'HR')")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> timeByProject(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) Long projectId,
            @RequestParam(required = false) Long userId) {

        List<TimeLog> logs;
        if (userId != null) {
            logs = timeLogRepository.findByUserIdAndDateRange(userId, startDate, endDate);
        } else if (projectId != null) {
            logs = timeLogRepository.findByProjectIdAndDateRange(projectId, startDate, endDate);
        } else {
            logs = timeLogRepository.findByDateRange(startDate, endDate);
        }

        Map<Long, BigDecimal> byProject = logs.stream()
                .collect(Collectors.groupingBy(
                        tl -> tl.getIssue().getProject().getId(),
                        Collectors.reducing(BigDecimal.ZERO, TimeLog::getHours, BigDecimal::add)
                ));

        Map<Long, String> projectNames = projectRepository.findAll().stream()
                .collect(Collectors.toMap(Project::getId, p -> p.getName()));

        List<Map<String, Object>> result = byProject.entrySet().stream()
                .map(e -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("projectId", e.getKey());
                    m.put("projectName", projectNames.getOrDefault(e.getKey(), ""));
                    m.put("totalHours", e.getValue());
                    return m;
                })
                .toList();

        return ResponseEntity.ok(ApiResponse.of(result));
    }

    @GetMapping("/time-by-user")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EXECUTIVE', 'HR')")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> timeByUser(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) Long projectId,
            @RequestParam(required = false) Long userId) {

        List<TimeLog> logs;
        if (userId != null) {
            logs = timeLogRepository.findByUserIdAndDateRange(userId, startDate, endDate);
        } else if (projectId != null) {
            logs = timeLogRepository.findByProjectIdAndDateRange(projectId, startDate, endDate);
        } else {
            logs = timeLogRepository.findByDateRange(startDate, endDate);
        }

        Map<Long, BigDecimal> byUser = logs.stream()
                .collect(Collectors.groupingBy(
                        tl -> tl.getUser().getId(),
                        Collectors.reducing(BigDecimal.ZERO, TimeLog::getHours, BigDecimal::add)
                ));

        Set<Long> userIds = byUser.keySet();
        Map<Long, String> userNames = userRepository.findAllById(userIds).stream()
                .collect(Collectors.toMap(User::getId, u -> u.getFirstName() + " " + u.getLastName()));

        List<Map<String, Object>> result = byUser.entrySet().stream()
                .map(e -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("userId", e.getKey());
                    m.put("userName", userNames.getOrDefault(e.getKey(), ""));
                    m.put("totalHours", e.getValue());
                    return m;
                })
                .toList();

        return ResponseEntity.ok(ApiResponse.of(result));
    }

    @GetMapping("/time-by-issue")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EXECUTIVE', 'HR')")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> timeByIssue(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam Long projectId,
            @RequestParam(required = false) Long assigneeId) {

        List<TimeLog> logs = timeLogRepository.findByProjectIdAndDateRange(projectId, startDate, endDate);

        Map<Long, BigDecimal> byIssue = logs.stream()
                .collect(Collectors.groupingBy(
                        tl -> tl.getIssue().getId(),
                        Collectors.reducing(BigDecimal.ZERO, TimeLog::getHours, BigDecimal::add)
                ));

        List<Map<String, Object>> result = byIssue.entrySet().stream()
                .map(e -> Map.of("issueId", (Object) e.getKey(), "totalHours", e.getValue()))
                .toList();

        return ResponseEntity.ok(ApiResponse.of(result));
    }

    @GetMapping("/attendance")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EXECUTIVE', 'HR')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> attendance(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {

        List<TimeLog> logs = timeLogRepository.findByDateRange(startDate, endDate);

        // Group by user
        Map<Long, List<TimeLog>> byUser = logs.stream()
                .collect(Collectors.groupingBy(tl -> tl.getUser().getId()));

        // Count total working days in range (Mon-Fri)
        long totalWorkDays = 0;
        LocalDate d = startDate;
        while (!d.isAfter(endDate)) {
            if (d.getDayOfWeek().getValue() <= 5) totalWorkDays++;
            d = d.plusDays(1);
        }

        // Per-user attendance
        List<Map<String, Object>> userAttendance = new ArrayList<>();
        Set<Long> userIds = byUser.keySet();
        List<User> userEntities = userRepository.findAllById(userIds);
        Map<Long, String> userNames = userEntities.stream()
                .collect(Collectors.toMap(User::getId, u -> u.getFirstName() + " " + u.getLastName()));
        Map<Long, String> userCompanies = userEntities.stream()
                .collect(Collectors.toMap(User::getId, u -> u.getCompany() != null ? u.getCompany().getName() : "Global"));
        for (Map.Entry<Long, List<TimeLog>> entry : byUser.entrySet()) {
            Long userId = entry.getKey();
            List<TimeLog> userLogs = entry.getValue();

            Set<LocalDate> daysWorked = userLogs.stream()
                    .map(TimeLog::getLogDate)
                    .collect(Collectors.toSet());

            BigDecimal totalHours = userLogs.stream()
                    .map(TimeLog::getHours)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal avgDailyHours = daysWorked.size() > 0
                    ? totalHours.divide(BigDecimal.valueOf(daysWorked.size()), 2, RoundingMode.HALF_UP)
                    : BigDecimal.ZERO;

            BigDecimal attendanceRate = totalWorkDays > 0
                    ? BigDecimal.valueOf(daysWorked.size())
                        .divide(BigDecimal.valueOf(totalWorkDays), 4, RoundingMode.HALF_UP)
                        .multiply(BigDecimal.valueOf(100))
                    : BigDecimal.ZERO;

            // Identify days with 0 hours (absent days on workdays)
            long absentDays = 0;
            d = startDate;
            while (!d.isAfter(endDate)) {
                if (d.getDayOfWeek().getValue() <= 5 && !daysWorked.contains(d)) {
                    absentDays++;
                }
                d = d.plusDays(1);
            }

            Map<String, Object> row = new LinkedHashMap<>();
            row.put("userId", userId);
            row.put("userName", userNames.getOrDefault(userId, ""));
            row.put("companyName", userCompanies.getOrDefault(userId, "Global"));
            row.put("daysWorked", daysWorked.size());
            row.put("absentDays", absentDays);
            row.put("totalHours", totalHours);
            row.put("avgDailyHours", avgDailyHours);
            row.put("attendanceRate", attendanceRate);
            userAttendance.add(row);
        }

        // Sort by attendance rate ascending (worst first)
        userAttendance.sort((a, b) -> ((BigDecimal) b.get("attendanceRate")).compareTo((BigDecimal) a.get("attendanceRate")));

        // Daily summary
        Map<LocalDate, Set<Long>> dailyUsers = new TreeMap<>();
        for (TimeLog tl : logs) {
            dailyUsers.computeIfAbsent(tl.getLogDate(), k -> new TreeSet<>()).add(tl.getUser().getId());
        }

        List<Map<String, Object>> dailySummary = new ArrayList<>();
        for (Map.Entry<LocalDate, Set<Long>> dayEntry : dailyUsers.entrySet()) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("date", dayEntry.getKey().toString());
            row.put("usersPresent", dayEntry.getValue().size());
            dailySummary.add(row);
        }

        // Overall summary
        long totalInternalUsers = userRepository.countByActiveStatus().stream()
                .filter(r -> Boolean.TRUE.equals(r[0]))
                .mapToLong(r -> (Long) r[1])
                .sum();

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("totalWorkDays", totalWorkDays);
        summary.put("totalInternalUsers", totalInternalUsers);
        summary.put("userAttendance", userAttendance);
        summary.put("dailySummary", dailySummary);

        return ResponseEntity.ok(ApiResponse.of(summary));
    }

    @GetMapping("/headcount")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EXECUTIVE', 'HR')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> headcount() {

        long totalUsers = userRepository.count();
        long activeUsers = userRepository.countByActive(true);
        long inactiveUsers = userRepository.countByActive(false);

        // By role
        List<Object[]> roleCounts = userRepository.countByRole();
        List<Map<String, Object>> byRole = new ArrayList<>();
        for (Object[] row : roleCounts) {
            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("role", ((User.Role) row[0]).name());
            entry.put("count", row[1]);
            byRole.add(entry);
        }

        // By department
        List<Object[]> deptCounts = userRepository.countByDepartment();
        List<Map<String, Object>> byDepartment = new ArrayList<>();
        for (Object[] row : deptCounts) {
            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("department", row[0]);
            entry.put("count", row[1]);
            byDepartment.add(entry);
        }

        // By company
        List<Object[]> companyCounts = userRepository.countByCompany();
        List<Map<String, Object>> byCompany = new ArrayList<>();
        for (Object[] row : companyCounts) {
            Map<String, Object> entry = new LinkedHashMap<>();
            String companyName = row[0] != null ? (String) row[0] : "Global";
            entry.put("company", companyName);
            entry.put("count", row[1]);
            byCompany.add(entry);
        }

        // By active status
        List<Object[]> activeCounts = userRepository.countByActiveStatus();
        List<Map<String, Object>> byActiveStatus = new ArrayList<>();
        for (Object[] row : activeCounts) {
            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("active", row[0]);
            entry.put("count", row[1]);
            byActiveStatus.add(entry);
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("totalUsers", totalUsers);
        result.put("activeUsers", activeUsers);
        result.put("inactiveUsers", inactiveUsers);
        result.put("byRole", byRole);
        result.put("byDepartment", byDepartment);
        result.put("byCompany", byCompany);
        result.put("byActiveStatus", byActiveStatus);

        return ResponseEntity.ok(ApiResponse.of(result));
    }
}