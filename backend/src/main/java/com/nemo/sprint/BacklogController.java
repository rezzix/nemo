package com.nemo.sprint;

import com.nemo.common.dto.ApiResponse;
import com.nemo.common.dto.PaginatedResponse;
import com.nemo.common.dto.PaginatedResponse.PaginationInfo;
import com.nemo.task.Task;
import com.nemo.task.TaskDto;
import com.nemo.task.TaskMapper;
import com.nemo.task.TaskRepository;
import com.nemo.security.AuthHelper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/projects/{projectId}/backlog")
public class BacklogController {

    private final TaskRepository taskRepository;
    private final TaskMapper taskMapper;
    private final AuthHelper authHelper;

    public BacklogController(TaskRepository taskRepository, TaskMapper taskMapper, AuthHelper authHelper) {
        this.taskRepository = taskRepository;
        this.taskMapper = taskMapper;
        this.authHelper = authHelper;
    }

    @GetMapping
    public ResponseEntity<PaginatedResponse<TaskDto>> getBacklog(
            @PathVariable Long projectId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "position,asc") String sort,
            @AuthenticationPrincipal UserDetails currentUser) {

        authHelper.requireProjectReadAccess(currentUser, projectId);
        PageRequest pageRequest = PageRequest.of(page, size);
        Page<Task> result = taskRepository.findByProjectIdAndSprintIdIsNull(projectId, pageRequest);
        return ResponseEntity.ok(PaginatedResponse.of(
                taskMapper.toDtoList(result.getContent()),
                new PaginationInfo(page, size, result.getTotalElements(), result.getTotalPages())
        ));
    }
}