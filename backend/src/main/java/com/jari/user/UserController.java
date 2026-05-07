package com.jari.user;

import com.jari.common.dto.ApiResponse;
import com.jari.common.dto.PaginatedResponse;
import com.jari.common.dto.PaginatedResponse.PaginationInfo;
import com.jari.security.AuthHelper;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;
    private final UserMapper userMapper;
    private final AuthHelper authHelper;

    public UserController(UserService userService, UserMapper userMapper, AuthHelper authHelper) {
        this.userService = userService;
        this.userMapper = userMapper;
        this.authHelper = authHelper;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'HR')")
    public ResponseEntity<PaginatedResponse<UserDto>> list(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) Boolean active,
            @RequestParam(required = false) Long companyId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt,desc") String sort,
            @AuthenticationPrincipal UserDetails currentUser) {

        Long effectiveCompanyId = companyId;
        if (effectiveCompanyId == null && !authHelper.hasAnyRole(currentUser, "ADMIN", "HR")) {
            effectiveCompanyId = authHelper.getCurrentCompanyId(currentUser);
        }
        User.Role roleEnum = role != null ? User.Role.valueOf(role) : null;
        Page<User> result = userService.search(search, roleEnum, active, effectiveCompanyId, page, size, sort);

        return ResponseEntity.ok(PaginatedResponse.of(
                userMapper.toDtoList(result.getContent()),
                new PaginationInfo(page, size, result.getTotalElements(), result.getTotalPages())
        ));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or #id == authentication.principal.username")
    public ResponseEntity<ApiResponse<UserDto>> get(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.of(userMapper.toDto(userService.getById(id))));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<UserDto>> create(@Valid @RequestBody UserDto.CreateRequest request) {
        User created = userService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.of(userMapper.toDto(created)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<UserDto>> update(@PathVariable Long id, @RequestBody UserDto.UpdateRequest request) {
        User updated = userService.update(id, request);
        return ResponseEntity.ok(ApiResponse.of(userMapper.toDto(updated)));
    }

    @PutMapping("/{id}/password")
    public ResponseEntity<ApiResponse<Object>> changePassword(
            @PathVariable Long id,
            @Valid @RequestBody UserDto.PasswordChangeRequest request,
            @AuthenticationPrincipal UserDetails currentUser) {

        boolean isAdmin = authHelper.hasAnyRole(currentUser, "ADMIN");
        if (!isAdmin) {
            authHelper.requireSelfOrAdmin(currentUser, id);
        }
        userService.changePassword(id, request, isAdmin);
        return ResponseEntity.ok(ApiResponse.of("Password changed"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deactivate(@PathVariable Long id) {
        userService.deactivate(id);
        return ResponseEntity.noContent().build();
    }
}