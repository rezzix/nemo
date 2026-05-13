package com.nemo.pmo;

import com.nemo.common.dto.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/projects/{projectId}/raid")
public class RaidItemController {

    private final RaidItemService raidItemService;
    private final RaidItemMapper raidItemMapper;

    public RaidItemController(RaidItemService raidItemService, RaidItemMapper raidItemMapper) {
        this.raidItemService = raidItemService;
        this.raidItemMapper = raidItemMapper;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EXECUTIVE')")
    public ResponseEntity<ApiResponse<List<RaidItemDto>>> list(
            @PathVariable Long projectId,
            @RequestParam(required = false) RaidItem.RaidType type) {
        List<RaidItem> items = type != null
                ? raidItemService.getByProjectIdAndType(projectId, type)
                : raidItemService.getByProjectId(projectId);
        return ResponseEntity.ok(ApiResponse.of(raidItemMapper.toDtoList(items)));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EXECUTIVE')")
    public ResponseEntity<ApiResponse<RaidItemDto>> get(@PathVariable Long projectId, @PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.of(raidItemMapper.toDto(raidItemService.getById(id))));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<RaidItemDto>> create(
            @PathVariable Long projectId,
            @Valid @RequestBody RaidItemDto.CreateRequest request) {
        RaidItem created = raidItemService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.of(raidItemMapper.toDto(created)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<RaidItemDto>> update(
            @PathVariable Long projectId,
            @PathVariable Long id,
            @RequestBody RaidItemDto.UpdateRequest request) {
        RaidItem updated = raidItemService.update(id, request);
        return ResponseEntity.ok(ApiResponse.of(raidItemMapper.toDto(updated)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<Void> delete(@PathVariable Long projectId, @PathVariable Long id) {
        raidItemService.delete(id);
        return ResponseEntity.noContent().build();
    }
}