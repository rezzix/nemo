package com.nemo.sprint;

import com.nemo.common.dto.ApiResponse;
import com.nemo.config.TaskStatus;
import com.nemo.task.Task;
import com.nemo.task.TaskDto;
import com.nemo.task.TaskMapper;
import com.nemo.task.TaskRepository;
import com.nemo.security.AuthHelper;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/projects/{projectId}/sprints")
public class SprintController {

    private final SprintService sprintService;
    private final SprintMapper sprintMapper;
    private final TaskRepository taskRepository;
    private final TaskMapper taskMapper;
    private final AuthHelper authHelper;

    public SprintController(SprintService sprintService, SprintMapper sprintMapper,
                            TaskRepository taskRepository, TaskMapper taskMapper, AuthHelper authHelper) {
        this.sprintService = sprintService;
        this.sprintMapper = sprintMapper;
        this.taskRepository = taskRepository;
        this.taskMapper = taskMapper;
        this.authHelper = authHelper;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<SprintDto>>> list(
            @PathVariable Long projectId,
            @RequestParam(required = false) String status,
            @AuthenticationPrincipal UserDetails currentUser) {
        authHelper.requireProjectReadAccess(currentUser, projectId);
        Sprint.SprintStatus statusEnum = status != null ? Sprint.SprintStatus.valueOf(status) : null;
        return ResponseEntity.ok(ApiResponse.of(sprintMapper.toDtoList(sprintService.getByProjectId(projectId, statusEnum))));
    }

    @GetMapping("/{sprintId}")
    public ResponseEntity<ApiResponse<SprintDto>> get(
            @PathVariable Long projectId, @PathVariable Long sprintId,
            @AuthenticationPrincipal UserDetails currentUser) {
        authHelper.requireProjectReadAccess(currentUser, projectId);
        return ResponseEntity.ok(ApiResponse.of(sprintMapper.toDto(sprintService.getById(sprintId))));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<SprintDto>> create(
            @PathVariable Long projectId, @Valid @RequestBody SprintDto.CreateRequest request) {
        Sprint created = sprintService.create(projectId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.of(sprintMapper.toDto(created)));
    }

    @PutMapping("/{sprintId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<SprintDto>> update(
            @PathVariable Long projectId, @PathVariable Long sprintId,
            @RequestBody SprintDto.UpdateRequest request) {
        Sprint updated = sprintService.update(sprintId, request);
        return ResponseEntity.ok(ApiResponse.of(sprintMapper.toDto(updated)));
    }

    @PatchMapping("/{sprintId}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<SprintDto>> updateStatus(
            @PathVariable Long projectId, @PathVariable Long sprintId,
            @Valid @RequestBody SprintDto.StatusUpdateRequest request) {
        Sprint updated = sprintService.updateStatus(sprintId, request);
        return ResponseEntity.ok(ApiResponse.of(sprintMapper.toDto(updated)));
    }

    @PostMapping("/{sprintId}/start")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<SprintDto>> start(
            @PathVariable Long projectId, @PathVariable Long sprintId) {
        Sprint started = sprintService.start(sprintId);
        return ResponseEntity.ok(ApiResponse.of(sprintMapper.toDto(started)));
    }

    @PostMapping("/{sprintId}/complete")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<SprintDto>> complete(
            @PathVariable Long projectId, @PathVariable Long sprintId) {
        Sprint completed = sprintService.complete(sprintId);
        return ResponseEntity.ok(ApiResponse.of(sprintMapper.toDto(completed)));
    }

    @GetMapping("/velocity")
    public ResponseEntity<ApiResponse<List<SprintVelocityDto>>> velocity(
            @PathVariable Long projectId,
            @AuthenticationPrincipal UserDetails currentUser) {
        authHelper.requireProjectReadAccess(currentUser, projectId);
        List<Sprint> sprints = sprintService.getByProjectId(projectId, null);
        if (sprints.isEmpty()) {
            return ResponseEntity.ok(ApiResponse.of(List.of()));
        }
        List<Long> sprintIds = sprints.stream().map(Sprint::getId).toList();
        Map<Long, Long> totalBySprint = taskRepository.countBySprintIds(sprintIds).stream()
                .collect(Collectors.toMap(arr -> (Long) arr[0], arr -> (Long) arr[1]));
        Map<Long, Long> completedBySprint = taskRepository.countCompletedBySprintIds(
                sprintIds, List.of(TaskStatus.Category.DONE, TaskStatus.Category.CLOSED)).stream()
                .collect(Collectors.toMap(arr -> (Long) arr[0], arr -> (Long) arr[1]));
        Map<Long, Long> storyPointsBySprint = taskRepository.sumStoryPointsBySprintIds(sprintIds).stream()
                .collect(Collectors.toMap(arr -> (Long) arr[0], arr -> (Long) arr[1]));
        Map<Long, Long> completedStoryPointsBySprint = taskRepository.sumCompletedStoryPointsBySprintIds(
                sprintIds, List.of(TaskStatus.Category.DONE, TaskStatus.Category.CLOSED)).stream()
                .collect(Collectors.toMap(arr -> (Long) arr[0], arr -> (Long) arr[1]));
        List<SprintVelocityDto> result = sprints.stream()
                .map(s -> new SprintVelocityDto(
                        s.getId(), s.getName(), s.getStatus().name(),
                        totalBySprint.getOrDefault(s.getId(), 0L).intValue(),
                        completedBySprint.getOrDefault(s.getId(), 0L).intValue(),
                        storyPointsBySprint.getOrDefault(s.getId(), 0L).intValue(),
                        completedStoryPointsBySprint.getOrDefault(s.getId(), 0L).intValue()))
                .toList();
        return ResponseEntity.ok(ApiResponse.of(result));
    }

    @GetMapping("/{sprintId}/burndown")
    public ResponseEntity<ApiResponse<SprintBurndownDto>> burndown(
            @PathVariable Long projectId, @PathVariable Long sprintId,
            @AuthenticationPrincipal UserDetails currentUser) {
        authHelper.requireProjectReadAccess(currentUser, projectId);
        Sprint sprint = sprintService.getById(sprintId);

        // Get all tasks in this sprint
        Page<Task> tasks = taskRepository.findByProjectId(projectId, PageRequest.of(0, 500));
        List<Task> sprintTasks = tasks.getContent().stream()
                .filter(t -> t.getSprint() != null && t.getSprint().getId().equals(sprintId))
                .toList();

        int totalSP = sprintTasks.stream()
                .mapToInt(t -> t.getStoryPoints() != null ? t.getStoryPoints() : 0)
                .sum();
        int completedSP = sprintTasks.stream()
                .filter(t -> t.getStatus() != null && t.getStatus().getCategory() != null
                        && (t.getStatus().getCategory() == TaskStatus.Category.DONE
                        || t.getStatus().getCategory() == TaskStatus.Category.CLOSED))
                .mapToInt(t -> t.getStoryPoints() != null ? t.getStoryPoints() : 0)
                .sum();

        LocalDate start = sprint.getStartDate();
        LocalDate end = sprint.getEndDate();
        if (start == null || end == null) {
            return ResponseEntity.ok(ApiResponse.of(new SprintBurndownDto(sprintId, sprint.getName(), null, null, totalSP, List.of())));
        }

        LocalDate today = LocalDate.now();
        LocalDate lastDay = today.isBefore(end) ? today : end;
        long totalDays = java.time.temporal.ChronoUnit.DAYS.between(start, end) + 1;
        double dailyBurn = totalDays > 0 ? (double) totalSP / totalDays : 0;

        List<SprintBurndownDto.DataPoint> data = new java.util.ArrayList<>();
        for (LocalDate day = start; !day.isAfter(lastDay); day = day.plusDays(1)) {
            long daysElapsed = java.time.temporal.ChronoUnit.DAYS.between(start, day) + 1;
            double ideal = Math.max(0, totalSP - (dailyBurn * daysElapsed));
            data.add(new SprintBurndownDto.DataPoint(day.toString(), Math.round(ideal * 100) / 100.0, totalSP - completedSP));
        }

        return ResponseEntity.ok(ApiResponse.of(new SprintBurndownDto(
                sprintId, sprint.getName(), start, end, totalSP, data)));
    }
}