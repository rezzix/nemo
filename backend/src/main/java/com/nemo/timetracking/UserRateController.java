package com.nemo.timetracking;

import com.nemo.common.dto.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/user-rates")
public class UserRateController {

    private final UserRateService userRateService;
    private final UserRateMapper userRateMapper;

    public UserRateController(UserRateService userRateService, UserRateMapper userRateMapper) {
        this.userRateService = userRateService;
        this.userRateMapper = userRateMapper;
    }

    @GetMapping("/user/{userId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'HR')")
    public ResponseEntity<ApiResponse<List<UserRateDto>>> getByUser(@PathVariable Long userId) {
        return ResponseEntity.ok(ApiResponse.of(userRateMapper.toDtoList(userRateService.getByUserId(userId))));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'HR')")
    public ResponseEntity<ApiResponse<UserRateDto>> get(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.of(userRateMapper.toDto(userRateService.getById(id))));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<UserRateDto>> create(@Valid @RequestBody UserRateDto.CreateRequest request) {
        UserRate created = userRateService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.of(userRateMapper.toDto(created)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<UserRateDto>> update(@PathVariable Long id, @RequestBody UserRateDto.UpdateRequest request) {
        UserRate updated = userRateService.update(id, request);
        return ResponseEntity.ok(ApiResponse.of(userRateMapper.toDto(updated)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        userRateService.delete(id);
        return ResponseEntity.noContent().build();
    }
}