package com.nemo.project;

import com.nemo.common.dto.ApiResponse;
import com.nemo.expense.ProjectExpenseRepository;
import com.nemo.pmo.RaidItemRepository;
import com.nemo.phase.PhaseRepository;
import com.nemo.security.AuthHelper;
import com.nemo.sprint.SprintRepository;
import com.nemo.task.TaskRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@RestController
@RequestMapping("/api/projects/{projectId}/activity")
public class ProjectActivityController {

    private final ProjectService projectService;
    private final TaskRepository taskRepository;
    private final PhaseRepository phaseRepository;
    private final RaidItemRepository raidItemRepository;
    private final ProjectExpenseRepository expenseRepository;
    private final SprintRepository sprintRepository;
    private final AuthHelper authHelper;

    public ProjectActivityController(ProjectService projectService, TaskRepository taskRepository,
                                     PhaseRepository phaseRepository, RaidItemRepository raidItemRepository,
                                     ProjectExpenseRepository expenseRepository, SprintRepository sprintRepository,
                                     AuthHelper authHelper) {
        this.projectService = projectService;
        this.taskRepository = taskRepository;
        this.phaseRepository = phaseRepository;
        this.raidItemRepository = raidItemRepository;
        this.expenseRepository = expenseRepository;
        this.sprintRepository = sprintRepository;
        this.authHelper = authHelper;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<ProjectActivityDto>>> getActivity(
            @PathVariable Long projectId,
            @AuthenticationPrincipal UserDetails currentUser) {
        authHelper.requireProjectReadAccess(currentUser, projectId);
        projectService.getById(projectId); // validate project exists

        List<ProjectActivityDto> activities = new ArrayList<>();

        for (var t : taskRepository.findByProjectId(projectId, PageRequest.of(0, 100)).getContent()) {
            String actor = t.getAssignee() != null
                    ? t.getAssignee().getFirstName() + " " + t.getAssignee().getLastName()
                    : "System";
            activities.add(new ProjectActivityDto(t.getCreatedAt().toString(), actor, "TASK_CREATED", "Task created: " + t.getTitle()));
            if (t.getUpdatedAt() != null && !t.getUpdatedAt().equals(t.getCreatedAt())) {
                activities.add(new ProjectActivityDto(t.getUpdatedAt().toString(), actor, "TASK_UPDATED", "Task updated: " + t.getTitle()));
            }
        }

        for (var p : phaseRepository.findByProjectIdOrderByPositionAsc(projectId)) {
            activities.add(new ProjectActivityDto(p.getCreatedAt().toString(), "System", "PHASE_CREATED", "Phase created: " + p.getName()));
            if (p.getUpdatedAt() != null && !p.getUpdatedAt().equals(p.getCreatedAt())) {
                activities.add(new ProjectActivityDto(p.getUpdatedAt().toString(), "System", "PHASE_UPDATED", "Phase updated: " + p.getName()));
            }
        }

        for (var r : raidItemRepository.findByProjectIdWithOwner(projectId)) {
            String actor = r.getOwner() != null
                    ? r.getOwner().getFirstName() + " " + r.getOwner().getLastName()
                    : "System";
            activities.add(new ProjectActivityDto(r.getCreatedAt().toString(), actor, "RAID_CREATED", r.getType() + " added: " + r.getTitle()));
            if (r.getUpdatedAt() != null && !r.getUpdatedAt().equals(r.getCreatedAt())) {
                activities.add(new ProjectActivityDto(r.getUpdatedAt().toString(), actor, "RAID_UPDATED", r.getType() + " updated: " + r.getTitle()));
            }
        }

        for (var e : expenseRepository.findByProjectIdOrderByExpenseDateDesc(projectId)) {
            activities.add(new ProjectActivityDto(e.getCreatedAt().toString(), "System", "EXPENSE_CREATED", "Expense recorded: " + e.getDescription()));
        }

        for (var s : sprintRepository.findByProjectId(projectId)) {
            activities.add(new ProjectActivityDto(s.getCreatedAt().toString(), "System", "SPRINT_CREATED", "Sprint created: " + s.getName()));
            if (s.getUpdatedAt() != null && !s.getUpdatedAt().equals(s.getCreatedAt())) {
                activities.add(new ProjectActivityDto(s.getUpdatedAt().toString(), "System", "SPRINT_UPDATED", "Sprint updated: " + s.getName()));
            }
        }

        activities.sort(Comparator.comparing(ProjectActivityDto::timestamp).reversed());

        return ResponseEntity.ok(ApiResponse.of(activities.stream().limit(20).toList()));
    }
}