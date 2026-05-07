package com.jari.timetracking;

import com.jari.common.dto.ApiResponse;
import com.jari.common.dto.PaginatedResponse;
import com.jari.common.dto.PaginatedResponse.PaginationInfo;
import com.jari.security.AuthHelper;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/time-logs")
public class TimeLogController {

    private final TimeLogService timeLogService;
    private final TimeLogMapper timeLogMapper;
    private final AuthHelper authHelper;

    public TimeLogController(TimeLogService timeLogService, TimeLogMapper timeLogMapper, AuthHelper authHelper) {
        this.timeLogService = timeLogService;
        this.timeLogMapper = timeLogMapper;
        this.authHelper = authHelper;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<TimeLogDto>> create(
            @Valid @RequestBody TimeLogDto.CreateRequest request,
            @AuthenticationPrincipal UserDetails currentUser) {
        Long userId = authHelper.getCurrentUserId(currentUser);
        TimeLog created = timeLogService.create(request, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.of(timeLogMapper.toDto(created)));
    }

    @GetMapping
    public ResponseEntity<PaginatedResponse<TimeLogDto>> list(
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) Long issueId,
            @RequestParam(required = false) Long projectId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "logDate,desc") String sort,
            @AuthenticationPrincipal UserDetails currentUser) {

        if (userId != null && !userId.equals(authHelper.getCurrentUserId(currentUser))
                && !authHelper.hasAnyRole(currentUser, "ADMIN", "MANAGER", "EXECUTIVE", "HR")) {
            throw new com.jari.common.exception.ForbiddenException("You can only view your own time logs");
        }
        Page<TimeLog> result = timeLogService.search(userId, issueId, projectId, startDate, endDate, page, size, sort);
        return ResponseEntity.ok(PaginatedResponse.of(
                timeLogMapper.toDtoList(result.getContent()),
                new PaginationInfo(page, size, result.getTotalElements(), result.getTotalPages())
        ));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<TimeLogDto>> get(
            @PathVariable Long id, @AuthenticationPrincipal UserDetails currentUser) {
        TimeLog timeLog = timeLogService.getById(id);
        Long currentUserId = authHelper.getCurrentUserId(currentUser);
        if (!timeLog.getUser().getId().equals(currentUserId)
                && !authHelper.hasAnyRole(currentUser, "ADMIN", "MANAGER", "HR")) {
            throw new com.jari.common.exception.ForbiddenException("You can only view your own time logs");
        }
        return ResponseEntity.ok(ApiResponse.of(timeLogMapper.toDto(timeLog)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<TimeLogDto>> update(
            @PathVariable Long id, @RequestBody TimeLogDto.UpdateRequest request,
            @AuthenticationPrincipal UserDetails currentUser) {
        TimeLog timeLog = timeLogService.getById(id);
        Long currentUserId = authHelper.getCurrentUserId(currentUser);
        if (!timeLog.getUser().getId().equals(currentUserId)
                && !authHelper.hasAnyRole(currentUser, "ADMIN", "MANAGER")) {
            throw new com.jari.common.exception.ForbiddenException("You can only edit your own time logs");
        }
        TimeLog updated = timeLogService.update(id, request);
        return ResponseEntity.ok(ApiResponse.of(timeLogMapper.toDto(updated)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        timeLogService.delete(id);
        return ResponseEntity.noContent().build();
    }
}