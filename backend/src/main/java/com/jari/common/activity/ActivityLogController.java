package com.jari.common.activity;

import com.jari.common.dto.PaginatedResponse;
import com.jari.common.dto.PaginatedResponse.PaginationInfo;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;

@RestController
@RequestMapping("/api/activity-logs")
@PreAuthorize("hasRole('ADMIN')")
public class ActivityLogController {

    private final ActivityLogRepository repository;

    public ActivityLogController(ActivityLogRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public ResponseEntity<PaginatedResponse<ActivityLogDto>> search(
            @RequestParam(required = false) String username,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            @RequestParam(defaultValue = "createdAt,desc") String sort) {

        if (startDate == null) startDate = LocalDate.now().minusDays(3);
        if (endDate == null) endDate = LocalDate.now();

        Instant startInstant = startDate.atStartOfDay(ZoneId.systemDefault()).toInstant();
        Instant endInstant = endDate.plusDays(1).atStartOfDay(ZoneId.systemDefault()).toInstant();

        String[] sortParts = sort.split(",");
        Sort.Direction direction = sortParts.length > 1 && sortParts[1].equalsIgnoreCase("asc")
                ? Sort.Direction.ASC : Sort.Direction.DESC;
        Sort sorting = Sort.by(direction, sortParts[0]);

        Page<ActivityLog> result = repository.search(username, startInstant, endInstant, PageRequest.of(page, size, sorting));

        List<ActivityLogDto> dtos = result.getContent().stream()
                .map(a -> new ActivityLogDto(
                        a.getId(),
                        a.getUsername(),
                        a.getMethod(),
                        a.getPath(),
                        a.getStatus(),
                        a.getIp(),
                        a.getDuration(),
                        a.getCreatedAt().toString()
                ))
                .toList();

        return ResponseEntity.ok(PaginatedResponse.of(
                dtos,
                new PaginationInfo(
                        result.getNumber(),
                        result.getSize(),
                        result.getTotalElements(),
                        result.getTotalPages()
                )
        ));
    }
}