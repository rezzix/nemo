package com.nemo.task;

import com.nemo.common.exception.EntityNotFoundException;
import com.nemo.common.exception.ForbiddenException;
import com.nemo.config.TaskStatus;
import com.nemo.config.TaskStatusRepository;
import com.nemo.config.TaskType;
import com.nemo.config.TaskTypeRepository;
import com.nemo.phase.Phase;
import com.nemo.phase.PhaseRepository;
import com.nemo.project.Label;
import com.nemo.project.LabelRepository;
import com.nemo.project.Project;
import com.nemo.project.ProjectRepository;
import com.nemo.sprint.Sprint;
import com.nemo.sprint.SprintRepository;
import com.nemo.user.User;
import com.nemo.user.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
public class TaskService {

    private final TaskRepository taskRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final TaskStatusRepository statusRepository;
    private final TaskTypeRepository typeRepository;
    private final LabelRepository labelRepository;
    private final CommentRepository commentRepository;
    private final SprintRepository sprintRepository;
    private final PhaseRepository phaseRepository;

    public TaskService(TaskRepository taskRepository, ProjectRepository projectRepository,
                        UserRepository userRepository, TaskStatusRepository statusRepository,
                        TaskTypeRepository typeRepository, LabelRepository labelRepository,
                        CommentRepository commentRepository, SprintRepository sprintRepository,
                        PhaseRepository phaseRepository) {
        this.taskRepository = taskRepository;
        this.projectRepository = projectRepository;
        this.userRepository = userRepository;
        this.statusRepository = statusRepository;
        this.typeRepository = typeRepository;
        this.labelRepository = labelRepository;
        this.commentRepository = commentRepository;
        this.sprintRepository = sprintRepository;
        this.phaseRepository = phaseRepository;
    }

    @Transactional(readOnly = true)
    public Page<Task> search(Long projectId, String search, Long statusId, Long assigneeId,
                              Long typeId, String priority, Long sprintId, Long labelId,
                              Instant createdAfter, Instant createdBefore, Boolean external,
                              int page, int size, String sort) {
        Sort.Direction direction = Sort.Direction.fromString(sort.split(",")[1]);
        PageRequest pageRequest = PageRequest.of(page, size, direction, sort.split(",")[0]);
        return taskRepository.search(projectId, search, statusId, assigneeId, typeId,
                priority != null ? Task.Priority.valueOf(priority) : null,
                sprintId, labelId, createdAfter, createdBefore, external, pageRequest);
    }

    @Transactional(readOnly = true)
    public Task getById(Long id) {
        return taskRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Task", id));
    }

    @Transactional
    public Task create(Long projectId, TaskDto.CreateRequest request, Long reporterId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new EntityNotFoundException("Project", projectId));
        TaskType type = typeRepository.findById(request.typeId())
                .orElseThrow(() -> new EntityNotFoundException("TaskType", request.typeId()));
        User reporter = userRepository.findById(reporterId)
                .orElseThrow(() -> new EntityNotFoundException("User", reporterId));

        Task task = new Task();
        task.setTitle(request.title());
        task.setDescription(request.description());
        task.setPriority(Task.Priority.valueOf(request.priority()));
        task.setType(type);
        task.setProject(project);
        task.setReporter(reporter);
        task.setStatus(statusRepository.findByIsDefaultTrue()
                .orElseThrow(() -> new EntityNotFoundException("No default task status found")));

        if (request.assigneeId() != null) {
            User assignee = userRepository.findById(request.assigneeId())
                    .orElseThrow(() -> new EntityNotFoundException("User", request.assigneeId()));
            task.setAssignee(assignee);
        }

        if (request.phaseId() != null) {
            Phase phase = phaseRepository.findById(request.phaseId())
                    .orElseThrow(() -> new EntityNotFoundException("Phase", request.phaseId()));
            task.setPhase(phase);
        }

        // Generate task key
        Integer maxSeq = taskRepository.findMaxSequenceByProjectId(projectId);
        int nextSeq = (maxSeq != null ? maxSeq : 0) + 1;
        task.setTaskKey(project.getKey() + "-" + nextSeq);

        // Set labels
        if (request.labelIds() != null) {
            for (Long labelId : request.labelIds()) {
                Label label = labelRepository.findById(labelId)
                        .orElseThrow(() -> new EntityNotFoundException("Label", labelId));
                task.getLabels().add(label);
            }
        }

        if (request.external() != null && request.external()) {
            task.setExternal(true);
        }

        if (request.dueDate() != null) {
            task.setDueDate(java.time.LocalDate.parse(request.dueDate()));
        }

        return taskRepository.save(task);
    }

    @Transactional
    public Task update(Long id, TaskDto.UpdateRequest request) {
        Task task = getById(id);

        if (request.title() != null) task.setTitle(request.title());
        if (request.description() != null) task.setDescription(request.description());
        if (request.priority() != null) task.setPriority(Task.Priority.valueOf(request.priority()));
        if (request.typeId() != null) {
            TaskType type = typeRepository.findById(request.typeId())
                    .orElseThrow(() -> new EntityNotFoundException("TaskType", request.typeId()));
            task.setType(type);
        }
        if (request.assigneeId() != null) {
            User assignee = userRepository.findById(request.assigneeId())
                    .orElseThrow(() -> new EntityNotFoundException("User", request.assigneeId()));
            task.setAssignee(assignee);
        }
        if (request.statusId() != null) {
            TaskStatus status = statusRepository.findById(request.statusId())
                    .orElseThrow(() -> new EntityNotFoundException("TaskStatus", request.statusId()));
            task.setStatus(status);
        }
        if (request.sprintId() != null) {
            Sprint sprint = sprintRepository.findById(request.sprintId())
                    .orElseThrow(() -> new EntityNotFoundException("Sprint", request.sprintId()));
            task.setSprint(sprint);
        }
        if (request.phaseId() != null) {
            Phase phase = phaseRepository.findById(request.phaseId())
                    .orElseThrow(() -> new EntityNotFoundException("Phase", request.phaseId()));
            task.setPhase(phase);
        } else {
            task.setPhase(null);
        }
        if (request.labelIds() != null) {
            task.getLabels().clear();
            for (Long labelId : request.labelIds()) {
                Label label = labelRepository.findById(labelId)
                        .orElseThrow(() -> new EntityNotFoundException("Label", labelId));
                task.getLabels().add(label);
            }
        }
        if (request.external() != null) task.setExternal(request.external());

        if (request.dueDate() != null) {
            task.setDueDate(java.time.LocalDate.parse(request.dueDate()));
        }

        return taskRepository.save(task);
    }

    @Transactional
    public void delete(Long id) {
        Task task = getById(id);
        taskRepository.delete(task);
    }

    @Transactional
    public Task updatePosition(Long id, TaskDto.PositionRequest request) {
        Task task = getById(id);
        task.setPosition(request.position());
        // If sprintId is explicitly set, update it; null moves to backlog
        if (request.sprintId() != null) {
            Sprint sprint = sprintRepository.findById(request.sprintId())
                    .orElseThrow(() -> new EntityNotFoundException("Sprint", request.sprintId()));
            task.setSprint(sprint);
        }
        return taskRepository.save(task);
    }

    // Comments
    @Transactional(readOnly = true)
    public List<Comment> getComments(Long taskId) {
        return commentRepository.findByTaskIdOrderByCreatedAtAsc(taskId);
    }

    @Transactional
    public Comment addComment(Long taskId, TaskDto.CommentDto.CreateRequest request, Long authorId) {
        Task task = getById(taskId);
        User author = userRepository.findById(authorId)
                .orElseThrow(() -> new EntityNotFoundException("User", authorId));
        Comment comment = new Comment();
        comment.setContent(request.content());
        comment.setTask(task);
        comment.setAuthor(author);
        return commentRepository.save(comment);
    }

    @Transactional(readOnly = true)
    public Comment getComment(Long commentId) {
        return commentRepository.findById(commentId)
                .orElseThrow(() -> new EntityNotFoundException("Comment", commentId));
    }

    @Transactional
    public Comment updateComment(Long commentId, TaskDto.CommentDto.UpdateRequest request) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new EntityNotFoundException("Comment", commentId));
        comment.setContent(request.content());
        return commentRepository.save(comment);
    }

    @Transactional
    public void deleteComment(Long commentId) {
        commentRepository.deleteById(commentId);
    }
}