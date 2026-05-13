package com.nemo.pmo;

import com.nemo.common.exception.EntityNotFoundException;
import com.nemo.project.Project;
import com.nemo.project.ProjectRepository;
import com.nemo.user.User;
import com.nemo.user.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
public class RaidItemService {

    private final RaidItemRepository raidItemRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;

    public RaidItemService(RaidItemRepository raidItemRepository,
                           ProjectRepository projectRepository,
                           UserRepository userRepository) {
        this.raidItemRepository = raidItemRepository;
        this.projectRepository = projectRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<RaidItem> getByProjectId(Long projectId) {
        return raidItemRepository.findByProjectId(projectId);
    }

    @Transactional(readOnly = true)
    public List<RaidItem> getByProjectIdAndType(Long projectId, RaidItem.RaidType type) {
        return raidItemRepository.findByProjectIdAndType(projectId, type);
    }

    @Transactional(readOnly = true)
    public RaidItem getById(Long id) {
        return raidItemRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("RaidItem", id));
    }

    @Transactional
    public RaidItem create(RaidItemDto.CreateRequest request) {
        Project project = projectRepository.findById(request.projectId())
                .orElseThrow(() -> new EntityNotFoundException("Project", request.projectId()));

        RaidItem item = new RaidItem();
        item.setProject(project);
        item.setType(request.type());
        item.setTitle(request.title());
        item.setDescription(request.description());
        item.setStatus(request.status() != null ? request.status() : RaidItem.RaidStatus.OPEN);
        item.setProbability(request.probability());
        item.setImpact(request.impact());
        item.setMitigationPlan(request.mitigationPlan());
        item.setDependsOnProjectId(request.dependsOnProjectId());
        item.setDueDate(request.dueDate() != null ? LocalDate.parse(request.dueDate()) : null);

        if (request.ownerId() != null) {
            User owner = userRepository.findById(request.ownerId())
                    .orElseThrow(() -> new EntityNotFoundException("User", request.ownerId()));
            item.setOwner(owner);
        }

        return raidItemRepository.save(item);
    }

    @Transactional
    public RaidItem update(Long id, RaidItemDto.UpdateRequest request) {
        RaidItem item = getById(id);

        if (request.type() != null) item.setType(request.type());
        if (request.title() != null) item.setTitle(request.title());
        if (request.description() != null) item.setDescription(request.description());
        if (request.status() != null) item.setStatus(request.status());
        if (request.probability() != null) item.setProbability(request.probability());
        if (request.impact() != null) item.setImpact(request.impact());
        if (request.mitigationPlan() != null) item.setMitigationPlan(request.mitigationPlan());
        if (request.dependsOnProjectId() != null) item.setDependsOnProjectId(request.dependsOnProjectId());
        if (request.ownerId() != null) {
            User owner = userRepository.findById(request.ownerId())
                    .orElseThrow(() -> new EntityNotFoundException("User", request.ownerId()));
            item.setOwner(owner);
        }
        if (request.dueDate() != null) item.setDueDate(LocalDate.parse(request.dueDate()));

        return raidItemRepository.save(item);
    }

    @Transactional
    public void delete(Long id) {
        RaidItem item = getById(id);
        raidItemRepository.delete(item);
    }
}