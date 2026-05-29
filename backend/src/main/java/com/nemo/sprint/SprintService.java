package com.nemo.sprint;

import com.nemo.common.exception.EntityNotFoundException;
import com.nemo.common.exception.ForbiddenException;
import com.nemo.config.TaskStatus;
import com.nemo.task.Task;
import com.nemo.task.TaskRepository;
import com.nemo.project.Project;
import com.nemo.project.ProjectRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class SprintService {

    private final SprintRepository sprintRepository;
    private final ProjectRepository projectRepository;
    private final TaskRepository taskRepository;

    public SprintService(SprintRepository sprintRepository, ProjectRepository projectRepository,
                         TaskRepository taskRepository) {
        this.sprintRepository = sprintRepository;
        this.projectRepository = projectRepository;
        this.taskRepository = taskRepository;
    }

    @Transactional(readOnly = true)
    public List<Sprint> getByProjectId(Long projectId, Sprint.SprintStatus status) {
        if (status != null) {
            return sprintRepository.findByProjectIdAndStatus(projectId, status);
        }
        return sprintRepository.findByProjectId(projectId);
    }

    @Transactional(readOnly = true)
    public Sprint getById(Long id) {
        return sprintRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Sprint", id));
    }

    @Transactional
    public Sprint create(Long projectId, SprintDto.CreateRequest request) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new EntityNotFoundException("Project", projectId));

        Sprint sprint = new Sprint();
        sprint.setName(request.name());
        sprint.setGoal(request.goal());
        sprint.setProject(project);
        sprint.setStartDate(request.startDate());
        sprint.setEndDate(request.endDate());
        return sprintRepository.save(sprint);
    }

    @Transactional
    public Sprint update(Long id, SprintDto.UpdateRequest request) {
        Sprint sprint = getById(id);
        if (request.name() != null) sprint.setName(request.name());
        if (request.goal() != null) sprint.setGoal(request.goal());
        if (request.startDate() != null) sprint.setStartDate(request.startDate());
        if (request.endDate() != null) sprint.setEndDate(request.endDate());
        return sprintRepository.save(sprint);
    }

    @Transactional
    public Sprint updateStatus(Long id, SprintDto.StatusUpdateRequest request) {
        Sprint sprint = getById(id);
        sprint.setStatus(Sprint.SprintStatus.valueOf(request.status()));
        return sprintRepository.save(sprint);
    }

    @Transactional
    public Sprint start(Long sprintId) {
        Sprint sprint = getById(sprintId);
        if (sprint.getStatus() != Sprint.SprintStatus.PLANNING) {
            throw new ForbiddenException("Only PLANNING sprints can be started. Current status: " + sprint.getStatus());
        }
        List<Sprint> activeSprints = sprintRepository.findByProjectIdAndStatus(
                sprint.getProject().getId(), Sprint.SprintStatus.ACTIVE);
        if (!activeSprints.isEmpty()) {
            throw new ForbiddenException("Project already has an active sprint (Sprint '" +
                    activeSprints.get(0).getName() + "'). Complete it first.");
        }
        sprint.setStatus(Sprint.SprintStatus.ACTIVE);
        return sprintRepository.save(sprint);
    }

    @Transactional
    public Sprint complete(Long sprintId) {
        Sprint sprint = getById(sprintId);
        if (sprint.getStatus() != Sprint.SprintStatus.ACTIVE) {
            throw new ForbiddenException("Only ACTIVE sprints can be completed. Current status: " + sprint.getStatus());
        }
        sprint.setStatus(Sprint.SprintStatus.CLOSED);

        // Move incomplete tasks out of this sprint (set sprint = null → backlog)
        List<Task> sprintTasks = taskRepository.findBySprintId(sprintId);
        for (Task task : sprintTasks) {
            if (task.getStatus() != null
                    && task.getStatus().getCategory() != TaskStatus.Category.DONE
                    && task.getStatus().getCategory() != TaskStatus.Category.CLOSED) {
                task.setSprint(null);
                taskRepository.save(task);
            }
        }

        return sprintRepository.save(sprint);
    }
}