package com.nemo.task;

import com.nemo.attachment.AttachmentService;
import com.nemo.common.dto.ApiResponse;
import com.nemo.common.dto.PaginatedResponse;
import com.nemo.common.dto.PaginatedResponse.PaginationInfo;
import com.nemo.common.exception.ForbiddenException;
import com.nemo.config.TaskStatus;
import com.nemo.security.AuthHelper;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/api/projects/{projectId}/tasks")
public class TaskController {

    private final TaskService taskService;
    private final TaskMapper taskMapper;
    private final AuthHelper authHelper;

    public TaskController(TaskService taskService, TaskMapper taskMapper, AuthHelper authHelper) {
        this.taskService = taskService;
        this.taskMapper = taskMapper;
        this.authHelper = authHelper;
    }

    @GetMapping
    public ResponseEntity<PaginatedResponse<TaskDto>> list(
            @PathVariable Long projectId,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Long statusId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long assigneeId,
            @RequestParam(required = false) Long typeId,
            @RequestParam(required = false) String priority,
            @RequestParam(required = false) Long sprintId,
            @RequestParam(required = false) Long labelId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) Instant createdAfter,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) Instant createdBefore,
            @RequestParam(required = false) Boolean external,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt,desc") String sort,
            @AuthenticationPrincipal UserDetails currentUser) {

        authHelper.requireProjectReadAccess(currentUser, projectId);
        if (authHelper.isExternal(currentUser)) {
            external = true;
        }
        // Resolve ?status=DONE/TODO/IN_PROGRESS/CLOSED to statusId list
        Long resolvedStatusId = statusId;
        if (status != null && statusId == null) {
            TaskStatus.Category category = TaskStatus.Category.valueOf(status.toUpperCase());
            List<TaskStatus> statuses = taskService.getStatusesByCategory(category);
            if (statuses.size() == 1) {
                resolvedStatusId = statuses.get(0).getId();
            }
        }
        Page<Task> result = taskService.search(projectId, search, resolvedStatusId, assigneeId, typeId,
                priority, sprintId, labelId, createdAfter, createdBefore, external, page, size, sort);
        return ResponseEntity.ok(PaginatedResponse.of(
                taskMapper.toDtoList(result.getContent()),
                new PaginationInfo(page, size, result.getTotalElements(), result.getTotalPages())
        ));
    }

    @GetMapping("/{taskId}")
    public ResponseEntity<ApiResponse<TaskDto>> get(
            @PathVariable Long projectId, @PathVariable Long taskId,
            @AuthenticationPrincipal UserDetails currentUser) {
        authHelper.requireProjectReadAccess(currentUser, projectId);
        Task task = taskService.getById(taskId);
        if (authHelper.isExternal(currentUser) && !task.isExternal()) {
            throw new ForbiddenException("You do not have access to this task");
        }
        return ResponseEntity.ok(ApiResponse.of(taskMapper.toDto(task)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<TaskDto>> create(
            @PathVariable Long projectId,
            @Valid @RequestBody TaskDto.CreateRequest request,
            @AuthenticationPrincipal UserDetails currentUser) {
        authHelper.requireProjectMemberOrAdminManager(currentUser, projectId);
        Long userId = authHelper.getCurrentUserId(currentUser);
        if (authHelper.isExternal(currentUser)) {
            request = new TaskDto.CreateRequest(request.title(), request.description(),
                    request.priority(), request.typeId(), request.assigneeId(), request.phaseId(), request.labelIds(), true, request.dueDate(), request.storyPoints());
        }
        Task created = taskService.create(projectId, request, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.of(taskMapper.toDto(created)));
    }

    @PutMapping("/{taskId}")
    public ResponseEntity<ApiResponse<TaskDto>> update(
            @PathVariable Long projectId, @PathVariable Long taskId,
            @RequestBody TaskDto.UpdateRequest request,
            @AuthenticationPrincipal UserDetails currentUser) {
        authHelper.requireProjectMemberOrAdminManager(currentUser, projectId);
        if (authHelper.isExternal(currentUser)) {
            Task task = taskService.getById(taskId);
            if (!task.isExternal()) {
                throw new ForbiddenException("You can only edit external tasks");
            }
            Long userId = authHelper.getCurrentUserId(currentUser);
            if (!task.getReporter().getId().equals(userId) &&
                    !(task.getAssignee() != null && task.getAssignee().getId().equals(userId))) {
                throw new ForbiddenException("You can only edit your own external tasks");
            }
        }
        Task updated = taskService.update(taskId, request);
        return ResponseEntity.ok(ApiResponse.of(taskMapper.toDto(updated)));
    }

    @DeleteMapping("/{taskId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<Void> delete(@PathVariable Long projectId, @PathVariable Long taskId) {
        taskService.delete(taskId);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{taskId}/position")
    public ResponseEntity<ApiResponse<TaskDto>> updatePosition(
            @PathVariable Long projectId, @PathVariable Long taskId,
            @RequestBody TaskDto.PositionRequest request,
            @AuthenticationPrincipal UserDetails currentUser) {
        authHelper.requireProjectMemberOrAdminManager(currentUser, projectId);
        if (authHelper.isExternal(currentUser)) {
            Task task = taskService.getById(taskId);
            if (!task.isExternal()) {
                throw new ForbiddenException("You can only move external tasks");
            }
            Long userId = authHelper.getCurrentUserId(currentUser);
            if (!task.getReporter().getId().equals(userId) &&
                    !(task.getAssignee() != null && task.getAssignee().getId().equals(userId))) {
                throw new ForbiddenException("You can only move your own external tasks");
            }
        }
        Task updated = taskService.updatePosition(taskId, request);
        return ResponseEntity.ok(ApiResponse.of(taskMapper.toDto(updated)));
    }

    // Comments
    @GetMapping("/{taskId}/comments")
    public ResponseEntity<ApiResponse<List<TaskDto.CommentDto>>> getComments(
            @PathVariable Long projectId, @PathVariable Long taskId,
            @AuthenticationPrincipal UserDetails currentUser) {
        authHelper.requireProjectReadAccess(currentUser, projectId);
        return ResponseEntity.ok(ApiResponse.of(taskMapper.toCommentDtoList(taskService.getComments(taskId))));
    }

    @PostMapping("/{taskId}/comments")
    public ResponseEntity<ApiResponse<TaskDto.CommentDto>> addComment(
            @PathVariable Long projectId, @PathVariable Long taskId,
            @Valid @RequestBody TaskDto.CommentDto.CreateRequest request,
            @AuthenticationPrincipal UserDetails currentUser) {
        authHelper.requireProjectMemberOrAdminManager(currentUser, projectId);
        if (authHelper.isExternal(currentUser)) {
            Task task = taskService.getById(taskId);
            if (!task.isExternal()) {
                throw new ForbiddenException("You can only comment on external tasks");
            }
        }
        Long userId = authHelper.getCurrentUserId(currentUser);
        Comment comment = taskService.addComment(taskId, request, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.of(taskMapper.toCommentDto(comment)));
    }

    @PutMapping("/{taskId}/comments/{commentId}")
    public ResponseEntity<ApiResponse<TaskDto.CommentDto>> updateComment(
            @PathVariable Long projectId, @PathVariable Long taskId, @PathVariable Long commentId,
            @Valid @RequestBody TaskDto.CommentDto.UpdateRequest request,
            @AuthenticationPrincipal UserDetails currentUser) {
        authHelper.requireProjectReadAccess(currentUser, projectId);
        Long userId = authHelper.getCurrentUserId(currentUser);
        Comment comment = taskService.getComment(commentId);
        if (!authHelper.hasAnyRole(currentUser, "ADMIN", "MANAGER") && !comment.getAuthor().getId().equals(userId)) {
            throw new com.nemo.common.exception.ForbiddenException("You can only edit your own comments");
        }
        comment = taskService.updateComment(commentId, request);
        return ResponseEntity.ok(ApiResponse.of(taskMapper.toCommentDto(comment)));
    }

    @DeleteMapping("/{taskId}/comments/{commentId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<Void> deleteComment(@PathVariable Long projectId, @PathVariable Long taskId, @PathVariable Long commentId) {
        taskService.deleteComment(commentId);
        return ResponseEntity.noContent().build();
    }
}