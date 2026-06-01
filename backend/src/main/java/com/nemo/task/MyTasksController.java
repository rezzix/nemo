package com.nemo.task;

import com.nemo.common.dto.ApiResponse;
import com.nemo.security.AuthHelper;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/tasks")
public class MyTasksController {

    private final TaskService taskService;
    private final TaskMapper taskMapper;
    private final AuthHelper authHelper;

    public MyTasksController(TaskService taskService, TaskMapper taskMapper, AuthHelper authHelper) {
        this.taskService = taskService;
        this.taskMapper = taskMapper;
        this.authHelper = authHelper;
    }

    @GetMapping("/my")
    public ResponseEntity<ApiResponse<List<TaskDto>>> getMyTasks(
            @AuthenticationPrincipal UserDetails currentUser) {
        Long userId = authHelper.getCurrentUserId(currentUser);
        List<Task> tasks = taskService.getMyTasks(userId);
        return ResponseEntity.ok(ApiResponse.of(taskMapper.toDtoList(tasks)));
    }
}
