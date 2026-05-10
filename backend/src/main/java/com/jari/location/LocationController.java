package com.jari.location;

import com.jari.common.dto.ApiResponse;
import com.jari.security.AuthHelper;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/locations")
public class LocationController {

    private final LocationService locationService;

    public LocationController(LocationService locationService) {
        this.locationService = locationService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<ApiResponse<List<LocationDto>>> list(
            @RequestParam(required = false) Long companyId,
            @AuthenticationPrincipal UserDetails currentUser) {
        return ResponseEntity.ok(ApiResponse.of(locationService.listByCompany(companyId)));
    }

    @GetMapping("/tree")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<ApiResponse<List<LocationDto>>> tree(
            @RequestParam(required = false) Long companyId,
            @AuthenticationPrincipal UserDetails currentUser) {
        return ResponseEntity.ok(ApiResponse.of(locationService.getTree(companyId)));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<ApiResponse<LocationDto>> get(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails currentUser) {
        Location location = locationService.getById(id);
        LocationDto dto = new LocationDto(
                location.getId(),
                location.getName(),
                location.getDescription(),
                location.getParent() != null ? location.getParent().getId() : null,
                location.getParent() != null ? location.getParent().getName() : null,
                location.getCompany() != null ? location.getCompany().getId() : null,
                location.getCompany() != null ? location.getCompany().getName() : null,
                location.getOrder(),
                location.isActive(),
                0L,
                List.of(),
                location.getCreatedAt() != null ? location.getCreatedAt().toString() : null,
                location.getUpdatedAt() != null ? location.getUpdatedAt().toString() : null
        );
        return ResponseEntity.ok(ApiResponse.of(dto));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<LocationDto>> create(
            @Valid @RequestBody LocationDto.CreateRequest request,
            @AuthenticationPrincipal UserDetails currentUser) {
        Location created = locationService.create(request);
        LocationDto dto = new LocationDto(
                created.getId(),
                created.getName(),
                created.getDescription(),
                created.getParent() != null ? created.getParent().getId() : null,
                created.getParent() != null ? created.getParent().getName() : null,
                created.getCompany() != null ? created.getCompany().getId() : null,
                created.getCompany() != null ? created.getCompany().getName() : null,
                created.getOrder(),
                created.isActive(),
                0L,
                List.of(),
                created.getCreatedAt() != null ? created.getCreatedAt().toString() : null,
                created.getUpdatedAt() != null ? created.getUpdatedAt().toString() : null
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.of(dto));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<LocationDto>> update(
            @PathVariable Long id,
            @RequestBody LocationDto.UpdateRequest request,
            @AuthenticationPrincipal UserDetails currentUser) {
        Location updated = locationService.update(id, request);
        LocationDto dto = new LocationDto(
                updated.getId(),
                updated.getName(),
                updated.getDescription(),
                updated.getParent() != null ? updated.getParent().getId() : null,
                updated.getParent() != null ? updated.getParent().getName() : null,
                updated.getCompany() != null ? updated.getCompany().getId() : null,
                updated.getCompany() != null ? updated.getCompany().getName() : null,
                updated.getOrder(),
                updated.isActive(),
                0L,
                List.of(),
                updated.getCreatedAt() != null ? updated.getCreatedAt().toString() : null,
                updated.getUpdatedAt() != null ? updated.getUpdatedAt().toString() : null
        );
        return ResponseEntity.ok(ApiResponse.of(dto));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails currentUser) {
        locationService.deactivate(id);
        return ResponseEntity.noContent().build();
    }
}