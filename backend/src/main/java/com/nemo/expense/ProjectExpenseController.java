package com.nemo.expense;

import com.nemo.common.dto.ApiResponse;
import com.nemo.security.AuthHelper;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/projects/{projectId}/expenses")
public class ProjectExpenseController {

    private final ProjectExpenseService expenseService;
    private final ProjectExpenseMapper expenseMapper;
    private final AuthHelper authHelper;

    public ProjectExpenseController(ProjectExpenseService expenseService,
                                     ProjectExpenseMapper expenseMapper,
                                     AuthHelper authHelper) {
        this.expenseService = expenseService;
        this.expenseMapper = expenseMapper;
        this.authHelper = authHelper;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'CONTRIBUTOR', 'HR', 'EXECUTIVE')")
    public ResponseEntity<ApiResponse<List<ProjectExpenseDto>>> list(
            @PathVariable Long projectId,
            @AuthenticationPrincipal UserDetails currentUser) {
        authHelper.requireProjectReadAccess(currentUser, projectId);
        return ResponseEntity.ok(ApiResponse.of(expenseMapper.toDtoList(expenseService.getByProjectId(projectId))));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<ProjectExpenseDto>> create(
            @PathVariable Long projectId,
            @RequestBody ProjectExpenseDto.CreateRequest request,
            @AuthenticationPrincipal UserDetails currentUser) {
        authHelper.requireProjectReadAccess(currentUser, projectId);
        Long userId = authHelper.getCurrentUserId(currentUser);
        ProjectExpense created = expenseService.create(projectId, userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.of(expenseMapper.toDto(created)));
    }

    @PutMapping("/{expenseId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<ProjectExpenseDto>> update(
            @PathVariable Long projectId,
            @PathVariable Long expenseId,
            @RequestBody ProjectExpenseDto.UpdateRequest request,
            @AuthenticationPrincipal UserDetails currentUser) {
        authHelper.requireProjectReadAccess(currentUser, projectId);
        ProjectExpense updated = expenseService.update(expenseId, request);
        return ResponseEntity.ok(ApiResponse.of(expenseMapper.toDto(updated)));
    }

    @DeleteMapping("/{expenseId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<Void> delete(
            @PathVariable Long projectId,
            @PathVariable Long expenseId,
            @AuthenticationPrincipal UserDetails currentUser) {
        authHelper.requireProjectReadAccess(currentUser, projectId);
        expenseService.delete(expenseId);
        return ResponseEntity.noContent().build();
    }
}