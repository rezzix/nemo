package com.nemo.config;

import com.nemo.common.exception.EntityNotFoundException;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
public class TaskConfigController {

    private final TaskTypeRepository typeRepo;
    private final TaskStatusRepository statusRepo;

    public TaskConfigController(TaskTypeRepository typeRepo, TaskStatusRepository statusRepo) {
        this.typeRepo = typeRepo;
        this.statusRepo = statusRepo;
    }

    // --- Task Types ---

    @GetMapping("/task-types")
    public ResponseEntity<List<TaskType>> listTypes() {
        return ResponseEntity.ok(typeRepo.findAll());
    }

    public record CreateTypeRequest(@NotBlank String name) {}

    @PostMapping("/task-types")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<TaskType> createType(@Valid @RequestBody CreateTypeRequest request) {
        TaskType type = new TaskType();
        type.setName(request.name());
        return ResponseEntity.status(HttpStatus.CREATED).body(typeRepo.save(type));
    }

    @PutMapping("/task-types/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<TaskType> updateType(@PathVariable Long id, @Valid @RequestBody CreateTypeRequest request) {
        TaskType type = typeRepo.findById(id).orElseThrow(() -> new EntityNotFoundException("TaskType", id));
        type.setName(request.name());
        return ResponseEntity.ok(typeRepo.save(type));
    }

    @DeleteMapping("/task-types/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteType(@PathVariable Long id) {
        typeRepo.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    // --- Task Statuses ---

    @GetMapping("/task-statuses")
    public ResponseEntity<List<TaskStatus>> listStatuses() {
        return ResponseEntity.ok(statusRepo.findAll());
    }

    public record CreateStatusRequest(@NotBlank String name, @NotBlank String category, boolean isDefault) {}

    @PostMapping("/task-statuses")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<TaskStatus> createStatus(@Valid @RequestBody CreateStatusRequest request) {
        TaskStatus status = new TaskStatus();
        status.setName(request.name());
        status.setCategory(TaskStatus.Category.valueOf(request.category()));
        status.setDefault(request.isDefault());
        return ResponseEntity.status(HttpStatus.CREATED).body(statusRepo.save(status));
    }

    @PutMapping("/task-statuses/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<TaskStatus> updateStatus(@PathVariable Long id, @Valid @RequestBody CreateStatusRequest request) {
        TaskStatus status = statusRepo.findById(id).orElseThrow(() -> new EntityNotFoundException("TaskStatus", id));
        status.setName(request.name());
        status.setCategory(TaskStatus.Category.valueOf(request.category()));
        status.setDefault(request.isDefault());
        return ResponseEntity.ok(statusRepo.save(status));
    }

    @DeleteMapping("/task-statuses/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteStatus(@PathVariable Long id) {
        statusRepo.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}