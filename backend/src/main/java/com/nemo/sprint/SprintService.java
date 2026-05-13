package com.nemo.sprint;

import com.nemo.common.exception.EntityNotFoundException;
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

    public SprintService(SprintRepository sprintRepository, ProjectRepository projectRepository) {
        this.sprintRepository = sprintRepository;
        this.projectRepository = projectRepository;
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
}